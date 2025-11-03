// src/components/dashboard/SynapseTab.tsx
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ForceGraph2D, { ForceGraphMethods, LinkObject, NodeObject } from "react-force-graph-2d";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Zap, Loader2, ServerCrash, ZoomIn, ZoomOut, RotateCcw, Camera, Snowflake, Layers } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";

type CommunityRow = {
  id: string;
  name: string | null;
  image_url: string | null;
  skills?: string | string[] | null;
};

type ConnectionRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
};

interface ProfileNode extends NodeObject {
  id: string;
  name: string;
  imageUrl?: string;
  color: string;
  group: string;
  // optional fixed position (for cluster mode)
  fx?: number;
  fy?: number;
}

const LS_KEY_CAMERA = "synapse_camera_v1"; // {k, x, y}
const GRID_BG =
  "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 24px), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 24px)";

const SKILL_COLORS = ["#FFD700", "#00FFFF", "#FF69B4", "#ADFF2F", "#FFA500", "#9370DB", "#00D1B2", "#F472B6"];

function colorForGroup(group: string) {
  const idx = Math.abs(group.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % SKILL_COLORS.length;
  return SKILL_COLORS[idx];
}

function parseSkills(sk: CommunityRow["skills"]): string[] {
  if (!sk) return [];
  if (Array.isArray(sk)) return sk.map((s) => `${s}`.trim()).filter(Boolean);
  const raw = `${sk}`.trim();
  // tolerate {a,b} or JSON-ish or CSV
  const cleaned = raw.replace(/^\{|\}$/g, "");
  // try JSON array
  try {
    const maybe = JSON.parse(raw);
    if (Array.isArray(maybe)) return maybe.map((s) => `${s}`.trim()).filter(Boolean);
  } catch {}
  return cleaned
    .split(",")
    .map((s) => s.replace(/^"(.*)"$/, "$1").trim())
    .filter(Boolean);
}

export function SynapseTab() {
  const { isDark } = useTheme();
  const fgRef = useRef<ForceGraphMethods>();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasUnderlayRef = useRef<HTMLCanvasElement>(null); // ambient
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [baseNodes, setBaseNodes] = useState<ProfileNode[]>([]);
  const [links, setLinks] = useState<LinkObject[]>([]);

  // HUD state
  const [clusterMode, setClusterMode] = useState(true);
  const [energyOn, setEnergyOn] = useState(true);
  const [frozen, setFrozen] = useState(false);

  // camera state
  const camera = useRef<{ k: number; x: number; y: number } | null>(null);
  const [zoomK, setZoomK] = useState(1);

  // dims
  useEffect(() => {
    const recalc = () => {
      if (!wrapperRef.current) return;
      setDims({ w: wrapperRef.current.clientWidth, h: wrapperRef.current.clientHeight });
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  // ambient energy painter
  useEffect(() => {
    let raf = 0;
    const cnv = canvasUnderlayRef.current;
    if (!cnv) return;
    const ctx = cnv.getContext("2d");
    if (!ctx) return;

    const LOOP = () => {
      if (!cnv || !ctx) return;
      cnv.width = dims.w || cnv.width;
      cnv.height = dims.h || cnv.height;

      // clear
      ctx.clearRect(0, 0, cnv.width, cnv.height);

      // breathing alpha
      const t = Date.now() * 0.001;
      const pulse = 0.35 + 0.25 * Math.sin(t * 1.2);

      if (energyOn) {
        // radial gradient energy field
        const cx = cnv.width / 2;
        const cy = cnv.height / 2;
        const r = Math.max(cnv.width, cnv.height) * (0.55 + 0.05 * Math.sin(t * 0.8));

        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(0, 207, 255, ${0.10 + 0.10 * pulse})`);
        g.addColorStop(1, `rgba(0, 0, 0, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // radiating scanlines
        ctx.globalAlpha = 0.45 * (0.6 + 0.4 * pulse);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(0,207,255,0.35)";
        const rings = 6;
        for (let i = 1; i <= rings; i++) {
          const rr = (r / rings) * i * (1 + 0.03 * Math.sin(t * 2 + i));
          ctx.beginPath();
          ctx.arc(cx, cy, rr, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(LOOP);
    };

    raf = requestAnimationFrame(LOOP);
    return () => cancelAnimationFrame(raf);
  }, [dims.w, dims.h, energyOn]);

  // fetch data
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [{ data: profiles, error: pErr }, { data: conns, error: cErr }] = await Promise.all([
          supabase.from("community").select("id,name,image_url,skills"),
          supabase.from("connections").select("id,from_user_id,to_user_id"),
        ]);
        if (pErr) throw pErr;
        if (cErr) throw cErr;

        const nodes: ProfileNode[] =
          (profiles as CommunityRow[]).map((p, idx, all) => {
            const skills = parseSkills(p.skills);
            const group = skills[0] || "General";
            const color = colorForGroup(group);

            // initial circular distribution for cluster pinning
            const angle = (idx / Math.max(1, all.length)) * Math.PI * 2;
            const radius = 360;
            const fx = Math.cos(angle) * radius;
            const fy = Math.sin(angle) * radius;

            return {
              id: p.id,
              name: p.name || "Unnamed",
              imageUrl: p.image_url || undefined,
              color,
              group,
              // NOTE: pinning is applied conditionally below (clusterMode)
              ...(clusterMode ? { fx, fy } : {}),
            };
          }) || [];

        const links: LinkObject[] =
          (conns as ConnectionRow[]).map((c) => ({
            source: c.from_user_id,
            target: c.to_user_id,
          })) || [];

        setBaseNodes(nodes);
        setLinks(links);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to load network.");
        toast.error(e.message || "Failed to load network.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetch once

  // cluster mode toggle effect (pin/unpin nodes)
  const clusteredNodes = useMemo<ProfileNode[]>(() => {
    if (!baseNodes.length) return [];
    if (!clusterMode) {
      // unpin nodes
      return baseNodes.map(({ fx, fy, ...n }) => ({ ...n, fx: undefined, fy: undefined }));
    }
    return baseNodes; // already preset with fx, fy
  }, [baseNodes, clusterMode]);

  // freeze physics
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    // quick freeze: kill charge + link forces
    try {
      const charge = fg.d3Force("charge");
      const link = fg.d3Force("link");
      if (frozen) {
        // weaken forces to near-zero
        charge && // @ts-ignore
          charge.strength(0);
        link && // @ts-ignore
          link.distance(0).strength(0);
      } else {
        // restore typical-ish forces
        charge && // @ts-ignore
          charge.strength(-60);
        link && // @ts-ignore
          link.distance(50).strength(0.1);
      }
      // reheat
      // @ts-ignore
      fg.d3ReheatSimulation && fg.d3ReheatSimulation();
    } catch {}
  }, [frozen]);

  // camera persistence
  const handleZoom = useCallback((transform: { k: number; x: number; y: number }) => {
    camera.current = transform;
    setZoomK(transform.k);
  }, []);
  const handleZoomEnd = useCallback((transform: { k: number; x: number; y: number }) => {
    camera.current = transform;
    try {
      localStorage.setItem(LS_KEY_CAMERA, JSON.stringify(transform));
    } catch {}
  }, []);

  // restore camera on first mount
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const restore = () => {
      try {
        const saved = localStorage.getItem(LS_KEY_CAMERA);
        if (!saved) return;
        const { k, x, y } = JSON.parse(saved);
        // centerAt uses graph coords; zoom() uses k directly
        fg.zoom(k, 0);
        // to preserve x/y, emulate d3-zoom's translate by using centerAt with no animation
        // estimate center by inverting x,y: screen transform = translate(x,y) scale(k)
        // A simpler user-friendly restore: zoom then fit center:
        // But we'll try to approximate:
        setTimeout(() => {
          fg.centerAt((-x + dims.w / 2) / k, (-y + dims.h / 2) / k, 0);
        }, 0);
      } catch {}
    };
    // delay till first render
    const t = setTimeout(restore, 60);
    return () => clearTimeout(t);
  }, [dims.w, dims.h]);

  // canvas node rendering (technical label)
  const nodeCanvasObject = useCallback(
    (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as ProfileNode;
      const r = 4;
      // halo
      ctx.beginPath();
      ctx.arc(n.x!, n.y!, r + 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 207, 255, 0.25)";
      ctx.fill();

      // core
      ctx.beginPath();
      ctx.arc(n.x!, n.y!, r, 0, Math.PI * 2);
      ctx.fillStyle = n.color;
      ctx.fill();

      // label
      const label = n.name;
      const fontSize = Math.max(8, 12 / globalScale);
      ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = isDark ? "rgba(229,231,235,0.95)" : "rgba(31,41,55,0.95)";
      ctx.fillText(label, n.x!, n.y! + r + 2);
    },
    [isDark]
  );

  // link color & particles (energy reacts)
  const linkColor = useCallback(() => (energyOn ? "rgba(0,207,255,0.35)" : "rgba(0,207,255,0.18)"), [energyOn]);
  const particleWidth = useCallback(() => (energyOn ? 1.6 : 0), [energyOn]);
  const particleSpeed = useCallback(() => (energyOn ? Math.random() * 0.012 + 0.006 : 0), [energyOn]);

  // HUD handlers
  const doReset = () => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.zoomToFit(400, 40, (n: NodeObject) => true);
    // also clear saved camera
    try {
      localStorage.removeItem(LS_KEY_CAMERA);
    } catch {}
  };
  const doZoom = (dir: 1 | -1) => {
    const fg = fgRef.current;
    if (!fg) return;
    const newK = Math.min(8, Math.max(0.15, zoomK * (dir === 1 ? 1.25 : 0.8)));
    fg.zoom(newK, 200);
  };
  const doSnapshot = () => {
    if (!wrapperRef.current) return;
    const canvas = wrapperRef.current.querySelector("canvas");
    if (!canvas) {
      toast.error("No canvas to capture.");
      return;
    }
    const url = (canvas as HTMLCanvasElement).toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "synapse-snapshot.png";
    a.click();
  };

  return (
    <Card className="border-cyan/20 bg-background/50 h-[70vh] flex flex-col overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan">
          <Zap className="shrink-0" />
          <span>Synapse Console</span>
          <span className="text-xs text-muted-foreground ml-2">technical view · clustered by skills</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative flex-1 p-0">
        {/* technical grid background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: GRID_BG,
            backgroundSize: "auto, auto",
            opacity: 0.22,
            pointerEvents: "none",
          }}
        />

        {/* ambient energy underlay */}
        <canvas ref={canvasUnderlayRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* graph container */}
        <div ref={wrapperRef} className="relative w-full h-full">
          {loading && (
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-background/70 z-10">
              <Loader2 className="h-8 w-8 text-cyan animate-spin" />
              <p className="mt-4 text-muted-foreground">Building network…</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-destructive/10 rounded-lg z-10">
              <ServerCrash className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-destructive-foreground font-semibold">Network Error</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <ForceGraph2D
              ref={fgRef as any}
              width={dims.w}
              height={dims.h}
              graphData={{ nodes: clusteredNodes, links }}
              nodeLabel={(n) => {
                const nn = n as ProfileNode;
                return `${nn.name}\n${nn.group}`;
              }}
              nodeCanvasObject={nodeCanvasObject}
              backgroundColor="transparent"
              linkColor={linkColor}
              linkDirectionalParticles={1}
              linkDirectionalParticleWidth={particleWidth}
              linkDirectionalParticleSpeed={particleSpeed}
              enableNodeDrag // keep drag
              onZoom={handleZoom}
              onZoomEnd={handleZoomEnd}
            />
          )}

          {/* HUD (bottom-center) */}
          <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
            <div className="flex items-center gap-3 rounded-2xl bg-black/50 backdrop-blur-md border border-cyan/30 px-4 py-3 shadow-[0_0_20px_rgba(0,207,255,0.15)]">
              <Button variant="outline" size="icon" onClick={() => doZoom(-1)} className="border-cyan/40">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => doZoom(1)} className="border-cyan/40">
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={doReset} className="border-cyan/40 gap-2">
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>

              <div className="w-px h-6 bg-cyan/30 mx-1" />

              <div className="flex items-center gap-2">
                <Switch id="energy" checked={energyOn} onCheckedChange={setEnergyOn} />
                <Label htmlFor="energy" className="text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan" /> Energy
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch id="freeze" checked={frozen} onCheckedChange={setFrozen} />
                <Label htmlFor="freeze" className="text-xs text-muted-foreground flex items-center gap-1">
                  <Snowflake className="w-3 h-3" /> Freeze
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch id="cluster" checked={clusterMode} onCheckedChange={setClusterMode} />
                <Label htmlFor="cluster" className="text-xs text-muted-foreground flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Cluster
                </Label>
              </div>

              <Button variant="outline" onClick={doSnapshot} className="border-cyan/40 gap-2">
                <Camera className="w-4 h-4" />
                Snapshot
              </Button>
            </div>

            {/* readout */}
            <div className="mt-2 w-full text-center text-[11px] text-cyan/80">
              Zoom: {zoomK.toFixed(2)} {frozen ? "· Physics: OFF" : "· Physics: ON"} {clusterMode ? "· Clustered" : "· Free"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
