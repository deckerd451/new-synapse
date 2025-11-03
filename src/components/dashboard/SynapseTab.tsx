import { useState, useEffect, useRef, useCallback } from "react";
import ForceGraph2D, { NodeObject, LinkObject } from "react-force-graph-2d";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Loader2, ServerCrash, Crosshair, Save, RotateCcw, Play } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────
interface ProfileNode extends NodeObject {
  id: string;
  name: string;
  image_url?: string | null;
  group: string;       // first skill or "General"
  color: string;       // mapped cyan spectrum
}

interface RawConnection {
  id: string;
  from_user_id: string;
  to_user_id: string;
}

type GraphData = { nodes: ProfileNode[]; links: LinkObject[] };

// ───────────────────────────────────────────────────────────────────────────────
// Constants & utils
// ───────────────────────────────────────────────────────────────────────────────
const VIEW_KEY = "synapse_view_v2";
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

// Single-hue technical palette: cyan spectrum (light → deep)
const CYAN_SCALE = [
  "rgba(224, 255, 255, 1.0)", // very light cyan (labels/glow accents)
  "rgba(173, 245, 255, 1.0)",
  "rgba(120, 235, 255, 1.0)",
  "rgba( 64, 220, 255, 1.0)",
  "rgba(  0, 207, 255, 1.0)",
  "rgba(  0, 176, 220, 1.0)"
];

// Deterministic group color index (kept technical—no random rainbow)
const colorByGroup = (group: string) => {
  const sum = [...group].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return CYAN_SCALE[(sum % (CYAN_SCALE.length - 2)) + 2]; // bias toward middle/brighter cyans
};

// ───────────────────────────────────────────────────────────────────────────────
// Component
// ───────────────────────────────────────────────────────────────────────────────
export function SynapseTab() {
  const { isDark } = useTheme();

  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);

  // canvas dims
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // camera state (we compute from d3-zoom transform)
  const transformRef = useRef<{ k: number; x: number; y: number }>({ k: 1, x: 0, y: 0 });

  // global pulse clock & interaction energy
  const [tick, setTick] = useState(0);
  const lastInteractionRef = useRef<number>(Date.now());
  const activityEnergyRef = useRef<number>(0); // 0..1

  // ── Fetch data
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // community: id, name, image_url, skills
        const { data: profiles, error: pErr } = await supabase
          .from("community")
          .select("id, name, image_url, skills");
        if (pErr) throw pErr;

        // connections
        const { data: connections, error: cErr } = await supabase
          .from("connections")
          .select("id, from_user_id, to_user_id");
        if (cErr) throw cErr;

        const nodes: ProfileNode[] = (profiles ?? []).map((p) => {
          let firstSkill = "General";
          const skills = Array.isArray(p.skills)
            ? p.skills
            : typeof p.skills === "string"
              ? p.skills.split(",").map((s) => s.trim()).filter(Boolean)
              : [];
        if (skills.length) firstSkill = skills[0];

          return {
            id: p.id,
            name: p.name || "Unnamed",
            image_url: p.image_url,
            group: firstSkill,
            color: colorByGroup(firstSkill)
          };
        });

        const links: LinkObject[] = (connections ?? []).map((c: RawConnection) => ({
          source: c.from_user_id,
          target: c.to_user_id
        }));

        setGraphData({ nodes, links });
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to load network data.");
        toast.error(e.message || "Failed to load network data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Responsive sizing
  useEffect(() => {
    const recalc = () => {
      if (!containerRef.current) return;
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight
      });
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  // ── Global animation clock (for synchronized breathing & energy decay)
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const now = Date.now();

      // energy rises on interactions (we bump elsewhere), decays smoothly here
      const elapsed = (now - lastInteractionRef.current) / 1000;
      const target = Math.max(0, 1.0 - elapsed / 2.5); // ~2.5s decay
      activityEnergyRef.current = clamp(
        activityEnergyRef.current * 0.92 + target * 0.08
      );

      setTick((t) => (t + 1) % 1000000); // trigger re-render at ~60fps
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── Interaction bump helper
  const bumpEnergy = () => {
    lastInteractionRef.current = Date.now();
    activityEnergyRef.current = clamp(activityEnergyRef.current + 0.4, 0, 1);
  };

  // ── Get & set camera (compute center using d3 transform)
  const getCameraState = () => {
    const { k, x, y } = transformRef.current;
    const { width, height } = dimensions;
    const cx = (-x + width / 2) / k;
    const cy = (-y + height / 2) / k;
    return { k, x, y, cx, cy };
  };

  const applyCameraState = (state: { k: number; cx: number; cy: number }, ms = 600) => {
    if (!fgRef.current) return;
    fgRef.current.centerAt(state.cx, state.cy, ms);
    fgRef.current.zoom(state.k, ms);
  };

  // ── Load persisted camera
  useEffect(() => {
    // allow graph mount first
    const t = setTimeout(() => {
      const raw = localStorage.getItem(VIEW_KEY);
      if (raw && fgRef.current && dimensions.width && dimensions.height) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.k && parsed?.cx != null && parsed?.cy != null) {
            applyCameraState(parsed, 800);
          }
        } catch {
          // ignore
        }
      } else {
        // first time—zoom to fit
        if (fgRef.current) {
          fgRef.current.zoomToFit(800, 50);
        }
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphData.nodes.length, graphData.links.length, dimensions.width, dimensions.height]);

  // ── Node renderer (technical: small core + halo + mono label)
  const nodeCanvasObject = useCallback(
    (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as ProfileNode;
      const r = 3.5;
      const halo = 7;
      const pulse = (Math.sin(tick * 0.06) + 1) / 2; // 0..1 slow breathing
      const energy = activityEnergyRef.current;       // 0..1

      // Halo (subtle, synced to pulse & energy)
      const haloAlpha = 0.12 + 0.18 * pulse + 0.2 * energy;
      ctx.beginPath();
      ctx.arc(n.x!, n.y!, halo, 0, 2 * Math.PI);
      ctx.fillStyle = n.color.replace("1.0", `${clamp(haloAlpha)}`);
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(n.x!, n.y!, r, 0, 2 * Math.PI);
      ctx.fillStyle = n.color;
      ctx.fill();

      // Label
      const label = n.name;
      const fontSize = Math.max(10 / globalScale, 8);
      ctx.font = `500 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = isDark ? "rgba(210,230,240,0.92)" : "rgba(25,35,45,0.92)";
      ctx.fillText(label, n.x!, (n.y ?? 0) + halo + 3);
    },
    [isDark, tick]
  );

  // ── Link styling (radiating energy + dynamic brightness)
  const linkColor = useCallback(() => {
    const baseAlpha = 0.20;
    const pulse = (Math.sin(tick * 0.08) + 1) / 2;
    const energy = activityEnergyRef.current;
    const a = clamp(baseAlpha + 0.25 * pulse + 0.35 * energy, 0, 1);
    return `rgba(0,207,255,${a})`; // technical cyan
  }, [tick]);

  const linkParticles = useCallback(() => {
    const energy = activityEnergyRef.current;
    // fewer particles when zoomed far out; more when close or energized
    const zoom = transformRef.current.k || 1;
    const zoomFactor = clamp((zoom - 0.6) / 1.4, 0, 1); // 0 @ 0.6x, 1 @ ~2x
    return Math.round(1 + 3 * (0.4 * zoomFactor + 0.6 * energy)); // 1..4
  }, []);

  const linkParticleWidth = useCallback(() => {
    const energy = activityEnergyRef.current;
    return 0.8 + 1.8 * energy; // 0.8 .. 2.6
  }, []);

  const linkParticleSpeed = useCallback(() => {
    const pulse = (Math.sin(tick * 0.1) + 1) / 2;
    const energy = activityEnergyRef.current;
    // base speed + extra on pulse & energy
    return 0.002 + 0.014 * (0.4 * pulse + 0.6 * energy); // faster when interacting
  }, [tick]);

  // ── Controls
  const handleReset = () => {
    bumpEnergy();
    if (fgRef.current) fgRef.current.zoomToFit(700, 50);
  };

  const handleSaveView = () => {
    const { k, cx, cy } = getCameraState();
    localStorage.setItem(VIEW_KEY, JSON.stringify({ k, cx, cy }));
    toast.success("View saved.");
  };

  const handleLoadView = () => {
    const raw = localStorage.getItem(VIEW_KEY);
    if (!raw) {
      toast.info("No saved view.");
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.k && parsed?.cx != null && parsed?.cy != null) {
        bumpEnergy();
        applyCameraState(parsed, 700);
      } else {
        toast.error("Saved view is invalid.");
      }
    } catch {
      toast.error("Failed to load view.");
    }
  };

  // ── Graph props
  const onZoom = (transform: { k: number; x: number; y: number }) => {
    transformRef.current = transform;
    bumpEnergy();
  };
  const onZoomEnd = () => {
    // auto-persist on every zoom end
    const { k, cx, cy } = getCameraState();
    localStorage.setItem(VIEW_KEY, JSON.stringify({ k, cx, cy }));
  };

  const onNodeDragStart = () => bumpEnergy();
  const onNodeDragEnd = () => {
    bumpEnergy();
    // settle then persist camera after a short delay (avoids spamming)
    setTimeout(() => {
      const { k, cx, cy } = getCameraState();
      localStorage.setItem(VIEW_KEY, JSON.stringify({ k, cx, cy }));
    }, 150);
  };

  return (
    <Card className="border-cyan/20 bg-background/50 h-[70vh] flex flex-col relative overflow-hidden">
      <CardHeader className="border-b border-cyan/10">
        <CardTitle className="flex items-center gap-2 text-cyan">
          <Zap className="h-5 w-5" />
          Synapse Console
          <span className="ml-2 text-xs text-muted-foreground tracking-wider">
            TECHNICAL • CYAN • REACTIVE
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent ref={containerRef} className="flex-grow relative p-0">
        {loading && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-background/60">
            <Loader2 className="h-8 w-8 text-cyan animate-spin" />
            <p className="mt-4 text-muted-foreground">Building network visualization…</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-destructive/10">
            <ServerCrash className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-destructive-foreground font-semibold">Network Error</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <ForceGraph2D
              ref={fgRef}
              width={dimensions.width}
              height={dimensions.height}
              graphData={graphData}
              backgroundColor="transparent"
              nodeLabel={(n) => (n as ProfileNode).name}
              nodeCanvasObject={nodeCanvasObject}
              linkColor={linkColor}
              linkDirectionalParticles={linkParticles}
              linkDirectionalParticleWidth={linkParticleWidth}
              linkDirectionalParticleSpeed={linkParticleSpeed}
              cooldownTicks={0}                 // keep interactive & fluid
              d3AlphaDecay={0.02}               // slower decay = smoother motion
              onZoom={onZoom}
              onZoomEnd={onZoomEnd}
              onNodeDragStart={onNodeDragStart}
              onNodeDragEnd={onNodeDragEnd}
            />

            {/* Bottom-center Technical Controls */}
            <div
              className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2
                         flex items-center gap-2 px-3 py-2 rounded-xl
                         bg-[rgba(8,12,16,0.75)] border border-cyan/20 shadow-[0_0_30px_rgba(0,207,255,0.08)]"
              style={{ backdropFilter: "blur(6px)" }}
            >
              <Button size="sm" variant="outline" className="border-cyan/40 text-cyan hover:bg-cyan/10"
                onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button size="sm" variant="outline" className="border-cyan/40 text-cyan hover:bg-cyan/10"
                onClick={() => {
                  bumpEnergy();
                  if (fgRef.current) {
                    // gentle focus to graph centroid
                    fgRef.current.centerAt(0, 0, 600);
                  }
                }}>
                <Crosshair className="h-4 w-4 mr-1" />
                Center
              </Button>
              <Button size="sm" variant="outline" className="border-cyan/40 text-cyan hover:bg-cyan/10"
                onClick={handleSaveView}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" className="border-cyan/40 text-cyan hover:bg-cyan/10"
                onClick={handleLoadView}>
                <Play className="h-4 w-4 mr-1" />
                Load
              </Button>
            </div>

            {/* Subtle scanline overlay for technical feel */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                background:
                  "repeating-linear-gradient(180deg, rgba(0,255,255,0.12) 0px, rgba(0,255,255,0.12) 1px, transparent 2px, transparent 4px)"
              }}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
