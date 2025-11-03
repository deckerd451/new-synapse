// src/components/dashboard/SynapseTab.tsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import ForceGraph2D, { ForceGraphMethods, LinkObject, NodeObject } from "react-force-graph-2d";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Focus, RefreshCw, Save, Play, Pause, Crosshair, Sparkles, Type } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import {
  colorForGroup,
  parseSkills,
  saveCamera,
  loadCamera,
  savePositions,
  loadPositions,
} from "@/lib/graphUtils";

type CommunityRow = {
  id: string;
  name: string | null;
  image_url?: string | null;
  skills?: unknown;
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
  // persisted positions
  x?: number; y?: number; vx?: number; vy?: number;
  // initial “cluster anchors” (temporary)
  fx?: number; fy?: number;
}

export function SynapseTab() {
  const { isDark } = useTheme();
  const fgRef = useRef<ForceGraphMethods>();
  const containerRef = useRef<HTMLDivElement>(null);

  const [graphData, setGraphData] = useState<{ nodes: ProfileNode[]; links: LinkObject[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [layoutRunning, setLayoutRunning] = useState(true);
  const [showParticles, setShowParticles] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [hoverNode, setHoverNode] = useState<ProfileNode | null>(null);
  const [timeTick, setTimeTick] = useState(0); // drives energy animation

  // ⏱ animate link “energy” brightness
  useEffect(() => {
    const id = setInterval(() => setTimeTick(t => t + 1), 40); // ~25fps
    return () => clearInterval(id);
  }, []);

  // 📥 fetch community & connections
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const [{ data: profiles, error: pe }, { data: conns, error: ce }] = await Promise.all([
          supabase.from("community").select("id, name, image_url, skills"),
          supabase.from("connections").select("id, from_user_id, to_user_id"),
        ]);
        if (pe) throw pe;
        if (ce) throw ce;

        const persisted = loadPositions();
        const nodes: ProfileNode[] = (profiles || []).map((p: CommunityRow, i: number, arr) => {
          const skills = parseSkills(p.skills);
          const group = skills[0] || "General";
          const color = colorForGroup(group);

          // cluster anchors on a ring
          const angle = (i / Math.max(1, arr.length)) * 2 * Math.PI;
          const radius = 380;
          const anchorX = Math.cos(angle) * radius;
          const anchorY = Math.sin(angle) * radius;

          // resume pos if we have it
          const stored = persisted[p.id];

          return {
            id: p.id,
            name: p.name || "Unnamed",
            imageUrl: p.image_url || undefined,
            color,
            group,
            x: stored?.x,
            y: stored?.y,
            // fix to cluster for a moment
            fx: anchorX + (Math.random() - 0.5) * 45,
            fy: anchorY + (Math.random() - 0.5) * 45,
          };
        });

        const links: LinkObject[] = (conns || []).map((c: ConnectionRow) => ({
          source: c.from_user_id, target: c.to_user_id,
        }));

        setGraphData({ nodes, links });

        // release anchors after warm-up
        setTimeout(() => {
          setGraphData(prev => ({
            ...prev,
            nodes: prev.nodes.map(n => ({ ...n, fx: undefined, fy: undefined })),
          }));
        }, 1600);
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Failed to load graph.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 🎯 camera restore on mount
  useEffect(() => {
    const cam = loadCamera();
    if (cam && fgRef.current) {
      fgRef.current.zoom(cam.k, 0);
      fgRef.current.centerAt(cam.x, cam.y, 0);
    }
  }, [graphData.nodes.length]);

  // 💾 auto-save camera when moved
  const handleEngineStop = useCallback(() => {
    setLayoutRunning(false);
    // also save node positions after settle
    const g = fgRef.current;
    if (!g) return;
    const nodes = (graphData.nodes || []) as ProfileNode[];
    const pos: Record<string, { x: number; y: number }> = {};
    nodes.forEach(n => {
      if (typeof n.x === "number" && typeof n.y === "number") {
        pos[n.id] = { x: n.x, y: n.y };
      }
    });
    savePositions(pos);
  }, [graphData.nodes]);

  const handleMoveEnd = useCallback(() => {
    const g = fgRef.current;
    if (!g) return;
    // @ts-expect-error - private but available
    const cam = g?.camera()?.position || { x: 0, y: 0, z: 1 };
    // ForceGraph2D uses z for zoom inverse; convert to k
    const k = 1 / (cam.z || 1);
    saveCamera({ x: cam.x, y: cam.y, k });
  }, []);

  // 🔎 highlight neighbors on hover
  const neighborSet = useMemo(() => {
    if (!hoverNode) return new Set<string>();
    const set = new Set<string>([hoverNode.id]);
    graphData.links.forEach(l => {
      const s = (l.source as any)?.id || l.source;
      const t = (l.target as any)?.id || l.target;
      if (s === hoverNode.id && typeof t === "string") set.add(t);
      if (t === hoverNode.id && typeof s === "string") set.add(s);
    });
    return set;
  }, [hoverNode, graphData.links]);

  // 🧪 custom node renderer (small technical glyph + text)
  const nodeCanvasObject = useCallback((n: NodeObject, ctx: CanvasRenderingContext2D, scale: number) => {
    const node = n as ProfileNode;
    const base = neighborSet.size ? neighborSet.has(node.id) : true;
    const r = base ? 5 : 3;
    const alpha = base ? 0.95 : 0.45;

    // outer ring
    ctx.beginPath();
    ctx.arc(node.x!, node.y!, r + 2, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(180,200,255,${alpha * 0.35})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // core
    ctx.beginPath();
    ctx.arc(node.x!, node.y!, r, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(node.color, alpha);
    ctx.fill();

    if (showLabels) {
      const fontSize = Math.max(10, 12 / (scale * 0.8));
      ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = isDark ? "rgba(229,231,235,0.9)" : "rgba(31,41,55,0.95)";
      ctx.fillText(node.name, node.x!, node.y! + r + 4);
    }
  }, [neighborSet, showLabels, isDark]);

  // ⚡ technical “energy” links
  const linkCanvasObject = useCallback((l: LinkObject, ctx: CanvasRenderingContext2D) => {
    const src = l.source as ProfileNode;
    const dst = l.target as ProfileNode;
    if (!src || !dst) return;

    const hovered = hoverNode && (src.id === hoverNode.id || dst.id === hoverNode.id);
    const dx = (dst.x! - src.x!);
    const dy = (dst.y! - src.y!);
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len, ny = dy / len;

    // base line (dim)
    ctx.beginPath();
    ctx.moveTo(src.x!, src.y!);
    ctx.lineTo(dst.x!, dst.y!);
    ctx.strokeStyle = hovered ? "rgba(0,230,255,0.55)" : "rgba(0,170,220,0.25)";
    ctx.lineWidth = hovered ? 1.6 : 1;
    ctx.stroke();

    if (!showParticles) return;

    // bright “pulse” moving along link
    const t = (timeTick % 600) / 600; // 0..1 loop
    const pulsePos = (t * len + 10) % len;
    const px = src.x! + nx * pulsePos;
    const py = src.y! + ny * pulsePos;

    const grd = ctx.createRadialGradient(px, py, 0, px, py, 16);
    grd.addColorStop(0, hovered ? "rgba(0,255,255,0.9)" : "rgba(0,245,255,0.75)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(px, py, 16, 0, Math.PI * 2);
    ctx.fill();
  }, [timeTick, hoverNode, showParticles]);

  // 🎮 controls
  const handleReset = () => {
    if (!fgRef.current) return;
    fgRef.current.zoom(1, 800);
    fgRef.current.centerAt(0, 0, 800);
    saveCamera({ x: 0, y: 0, k: 1 });
  };

  const handleSaveView = () => {
    if (!fgRef.current) return;
    // @ts-expect-error private access
    const cam = fgRef.current.camera().position || { x: 0, y: 0, z: 1 };
    const k = 1 / (cam.z || 1);
    saveCamera({ x: cam.x, y: cam.y, k });
    // save positions
    const nodes = (graphData.nodes || []) as ProfileNode[];
    const pos: Record<string, { x: number; y: number }> = {};
    nodes.forEach(n => { if (typeof n.x === "number" && typeof n.y === "number") pos[n.id] = { x: n.x, y: n.y }; });
    savePositions(pos);
    toast.success("View saved");
  };

  const handleAutoLayout = () => {
    if (!fgRef.current) return;
    setLayoutRunning(true);
    // kick a small random nudge to unstick
    setGraphData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => ({ ...n, vx: (Math.random() - 0.5) * 0.01, vy: (Math.random() - 0.5) * 0.01 })),
    }));
    // release any fixed
    fgRef.current.d3ReheatSimulation();
  };

  const handleCenterOnMe = async () => {
    // center on current user if in node list
    const { data: auth } = await supabase.auth.getUser();
    const email = auth?.user?.email;
    if (!email) return toast.info("Log in to center on your node.");

    const { data: me } = await supabase.from("community").select("id").eq("email", email).maybeSingle();
    if (!me?.id) return toast.info("No profile node found.");
    const node = graphData.nodes.find(n => n.id === me.id);
    if (!node || node.x == null || node.y == null || !fgRef.current) return;

    fgRef.current.centerAt(node.x, node.y, 800);
    fgRef.current.zoom(1.4, 800);
  };

  const handleToggleParticles = () => setShowParticles(v => !v);
  const handleToggleLabels = () => setShowLabels(v => !v);

  // 📐 size
  const [dims, setDims] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const onResize = () => {
      if (!containerRef.current) return;
      setDims({ w: containerRef.current.clientWidth, h: containerRef.current.clientHeight });
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <Card className="border-cyan/20 bg-background/50 h-[70vh] relative overflow-hidden">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-cyan">
          <Zap className="w-5 h-5" />
          Synapse View <span className="ml-2 text-xs text-muted-foreground">technical mode</span>
        </CardTitle>
      </CardHeader>

      <CardContent ref={containerRef} className="relative h-full pt-2">
        {loading && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-background/60 z-10">
            <Loader2 className="h-7 w-7 text-cyan animate-spin" />
            <p className="mt-3 text-sm text-muted-foreground">Assembling network…</p>
          </div>
        )}

        <ForceGraph2D
          ref={fgRef as any}
          width={dims.w}
          height={dims.h}
          graphData={graphData}
          backgroundColor="transparent"
          enableNodeDrag
          cooldownTicks={layoutRunning ? 80 : 0}
          onEngineStop={handleEngineStop}
          onNodeHover={(n: any) => setHoverNode(n || null)}
          onZoomEnd={handleMoveEnd}
          onCenterAtEnd={handleMoveEnd}
          onNodeDragEnd={handleMoveEnd}
          nodeRelSize={4}
          nodeLabel={(n) => showLabels ? `${(n as ProfileNode).name}\n[${(n as ProfileNode).group}]` : ""}
          nodeCanvasObject={nodeCanvasObject}
          linkCanvasObjectMode={() => "after"}
          linkCanvasObject={linkCanvasObject}
        />

        {/* HUD (bottom-center controls) */}
        <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 bottom-4 flex items-center gap-2 bg-black/40 backdrop-blur-md border border-cyan/30 rounded-2xl px-3 py-2 shadow-lg">
          <Button size="sm" variant="secondary" className="hud-btn" onClick={handleReset} title="Reset View">
            <RefreshCw className="w-4 h-4 mr-1" /> Reset
          </Button>
          <Button size="sm" variant="secondary" className="hud-btn" onClick={handleSaveView} title="Save Camera & Layout">
            <Save className="w-4 h-4 mr-1" /> Save
          </Button>
          <Button size="sm" variant="secondary" className="hud-btn" onClick={handleAutoLayout} title="Reheat Layout">
            <Play className="w-4 h-4 mr-1" /> Layout
          </Button>
          <Button size="sm" variant="secondary" className="hud-btn" onClick={handleCenterOnMe} title="Center on Me">
            <Crosshair className="w-4 h-4 mr-1" /> Me
          </Button>
          <Button size="sm" variant="secondary" className="hud-btn" onClick={handleToggleParticles} title="Toggle Energy">
            <Sparkles className="w-4 h-4 mr-1" /> {showParticles ? "Energy On" : "Energy Off"}
          </Button>
          <Button size="sm" variant="secondary" className="hud-btn" onClick={handleToggleLabels} title="Toggle Labels">
            <Type className="w-4 h-4 mr-1" /> {showLabels ? "Labels On" : "Labels Off"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** helpers */
function hexToRgba(hex: string, a = 1) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
  return `rgba(${r},${g},${b},${a})`;
}
