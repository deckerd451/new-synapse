import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ForceGraph2D, { NodeObject, LinkObject, ForceGraphMethods } from "react-force-graph-2d";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Zap, Loader2, ServerCrash, Target, Save, RotateCcw, Gauge } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";

// ---------------------------
// Types
// ---------------------------
interface ProfileRow {
  id: string;
  name: string | null;
  image_url?: string | null;
  skills?: string | string[] | null;
  bio?: string | null;
}

interface ConnectionRow {
  id: string;
  from_user_id: string;
  to_user_id: string;
}

interface ProfileNode extends NodeObject {
  id: string;
  name: string;
  imageUrl?: string;
  group: string;          // first skill or "General"
  color: string;          // color by group
  fx?: number;            // optional pin to cluster
  fy?: number;
}

type EnergyLevel = "low" | "med" | "high";

type CameraState = {
  k: number;    // zoom
  x: number;    // panX
  y: number;    // panY
};

const LS_CAMERA_KEY = "synapse.camera.v1";

// palette chosen for a crisp technical look
const GROUP_COLORS = ["#00F0FF", "#FFD700", "#7C8CFF", "#FF6EC7", "#66FF99", "#FFA94D", "#00E0A8"];

const hashToColor = (s: string) => {
  const h = Math.abs([...s].reduce((a, c) => a + c.charCodeAt(0), 0));
  return GROUP_COLORS[h % GROUP_COLORS.length];
};

const parseSkills = (skills?: string | string[] | null): string[] => {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills.map((s) => `${s}`.trim()).filter(Boolean);
  // comma-separated string fallback
  return skills
    .split(",")
    .map((s) => s.trim().replace(/^\{|\}$/g, "")) // defensive for {a,b} legacy values
    .filter(Boolean);
};

// ---------------------------
// Component
// ---------------------------
export function SynapseTab() {
  const { isDark } = useTheme();
  const fgRef = useRef<ForceGraphMethods>();
  const containerRef = useRef<HTMLDivElement>(null);

  const [graphData, setGraphData] = useState<{ nodes: ProfileNode[]; links: LinkObject[] }>({
    nodes: [],
    links: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  // UI state
  const [energy, setEnergy] = useState<EnergyLevel>("high");
  const [showLabels, setShowLabels] = useState(true);
  const [zoomK, setZoomK] = useState(1); // track zoom for adaptive particles
  const [hoverNode, setHoverNode] = useState<ProfileNode | null>(null);

  // Saved camera views
  const [savedViews, setSavedViews] = useState<{ name: string; cam: CameraState }[]>([
    { name: "Default", cam: { k: 1.0, x: 0, y: 0 } },
  ]);
  const [activeView, setActiveView] = useState("Default");

  // ---------------------------
  // Layout + Data fetch
  // ---------------------------
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      setDims({ w: containerRef.current.offsetWidth, h: containerRef.current.offsetHeight });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Profiles
        const { data: profiles, error: profilesError } = await supabase
          .from("community")
          .select("id, name, image_url, skills, bio");
        if (profilesError) throw profilesError;

        // Connections
        const { data: connections, error: connectionsError } = await supabase
          .from("connections")
          .select("id, from_user_id, to_user_id");
        if (connectionsError) throw connectionsError;

        const p = (profiles || []) as ProfileRow[];

        // Assign clusters by first skill
        const N = Math.max(1, p.length);
        const radius = 350;

        const nodes: ProfileNode[] = p.map((row, i) => {
          const skills = parseSkills(row.skills);
          const group = skills[0] || "General";
          const color = hashToColor(group);
          // distribute around circle for initial cluster centers (softly pinned)
          const angle = (i / N) * 2 * Math.PI;
          const cx = Math.cos(angle) * radius;
          const cy = Math.sin(angle) * radius;

          return {
            id: row.id,
            name: row.name || "Unnamed",
            imageUrl: row.image_url || undefined,
            group,
            color,
            fx: cx + (Math.random() - 0.5) * 30,
            fy: cy + (Math.random() - 0.5) * 30,
          };
        });

        const links: LinkObject[] = (connections || []).map((c: ConnectionRow) => ({
          source: c.from_user_id,
          target: c.to_user_id,
        }));

        setGraphData({ nodes, links });
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to load network data.");
        toast.error(e.message || "Failed to load network data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ---------------------------
  // Camera persistence (localStorage)
  // ---------------------------
  const applyCamera = useCallback((cam: CameraState, animate = true) => {
    if (!fgRef.current) return;
    const ms = animate ? 600 : 0;
    // For 2D, pan is achieved by centering at (-x, -y) then zooming to k
    // We'll centerAt graph coords, then zoom.
    fgRef.current.centerAt(-cam.x, -cam.y, ms);
    fgRef.current.zoom(cam.k, ms);
  }, []);

  const saveCameraToLS = useCallback(() => {
    if (!fgRef.current) return;
    // There isn't a direct getter for pan in the API; we approximate it by reading the internal transform.
    // ForceGraph exposes an internal method for screen2GraphCoords(0,0) – we can derive pan from that:
    const zero = fgRef.current.screen2GraphCoords?.(0, 0) as { x: number; y: number };
    const center = fgRef.current.screen2GraphCoords?.(dims.w / 2, dims.h / 2) as { x: number; y: number };
    const k = zoomK;
    // pan approximated as negative of center
    const cam: CameraState = { k, x: -center.x, y: -center.y };
    localStorage.setItem(LS_CAMERA_KEY, JSON.stringify(cam));
  }, [zoomK, dims.w, dims.h]);

  useEffect(() => {
    // restore on mount
    const raw = localStorage.getItem(LS_CAMERA_KEY);
    if (raw) {
      try {
        const cam = JSON.parse(raw) as CameraState;
        // apply after first paint
        setTimeout(() => applyCamera(cam, false), 50);
      } catch {
        /* ignore */
      }
    }
  }, [applyCamera]);

  // track zoom and pan changes
  const handleZoom = useCallback((k: number) => {
    setZoomK(k);
  }, []);

  const handleZoomEnd = useCallback(() => {
    // persist on interactions
    saveCameraToLS();
  }, [saveCameraToLS]);

  // ---------------------------
  // Adaptive energy/particles
  // ---------------------------
  const maxParticlesBase = useMemo(() => {
    // base cap grows a bit with link count (but bounded)
    const L = graphData.links.length;
    return Math.min(2500, Math.max(300, Math.floor(L * 0.6)));
  }, [graphData.links.length]);

  const energyConfig = useMemo(() => {
    // Adjust particle width + count + speed by energy + zoom
    const z = Math.max(0.6, Math.min(3, zoomK));
    const level = {
      low:  { width: 0.7, speed: 0.006, mult: 0.12 },
      med:  { width: 1.3, speed: 0.010, mult: 0.22 },
      high: { width: 2.0, speed: 0.016, mult: 0.35 },
    }[energy];

    const particleCount = Math.floor(maxParticlesBase * level.mult * (1 / Math.sqrt(z)));

    return {
      particleWidth: level.width,
      particleSpeed: level.speed,
      particleCount,
    };
  }, [energy, zoomK, maxParticlesBase]);

  // ---------------------------
  // Custom drawing (labels, glow, trails)
  // ---------------------------
  const nodeCanvasObject = useCallback(
    (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as ProfileNode;
      const r = 4; // node radius
      // glow ring behind
      ctx.save();
      ctx.beginPath();
      ctx.shadowBlur = 12;
      ctx.shadowColor = n.color;
      ctx.fillStyle = n.color;
      ctx.arc(n.x!, n.y!, r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();

      // crisp core
      ctx.beginPath();
      ctx.fillStyle = "#0A0D10"; // inner dark core
      ctx.arc(n.x!, n.y!, Math.max(1.2, r - 2), 0, 2 * Math.PI);
      ctx.fill();

      // label
      if (showLabels) {
        const fontSize = Math.max(10, 13 / globalScale);
        ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = isDark ? "rgba(230, 244, 255, 0.85)" : "rgba(10,12,16,0.85)";
        ctx.fillText(n.name, n.x!, n.y! + r + 3);
      }
    },
    [isDark, showLabels]
  );

  // Link glow + trail layer
  const linkCanvasObject = useCallback(
    (link: LinkObject, ctx: CanvasRenderingContext2D) => {
      const a = link.source as ProfileNode;
      const b = link.target as ProfileNode;
      if (!a || !b) return;

      const x1 = a.x!, y1 = a.y!;
      const x2 = b.x!, y2 = b.y!;

      // soft glow underlay
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = "rgba(0, 207, 255, 0.20)";
      ctx.lineWidth = 2.2;
      ctx.shadowBlur = 16;
      ctx.shadowColor = "rgba(0, 207, 255, 0.8)";
      ctx.stroke();
      ctx.restore();

      // crisp edge
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = "rgba(0, 207, 255, 0.35)";
      ctx.lineWidth = 1.1;
      ctx.stroke();
    },
    []
  );

  // particle color by energy
  const particleColor = useCallback(() => {
    return energy === "high"
      ? "rgba(0,255,255,0.95)"
      : energy === "med"
      ? "rgba(0,255,255,0.75)"
      : "rgba(0,255,255,0.55)";
  }, [energy]);

  // ---------------------------
  // HUD actions
  // ---------------------------
  const handleResetView = useCallback(() => {
    const cam = { k: 1, x: 0, y: 0 };
    applyCamera(cam, true);
    localStorage.setItem(LS_CAMERA_KEY, JSON.stringify(cam));
    setActiveView("Default");
    toast.success("View reset");
  }, [applyCamera]);

  const handleSaveView = useCallback(() => {
    if (!fgRef.current) return;
    const center = fgRef.current.screen2GraphCoords?.(dims.w / 2, dims.h / 2) as { x: number; y: number };
    const cam: CameraState = { k: zoomK, x: -center.x, y: -center.y };
    const name = `View ${new Date().toLocaleTimeString()}`;
    const next = [...savedViews, { name, cam }];
    setSavedViews(next);
    setActiveView(name);
    localStorage.setItem(LS_CAMERA_KEY, JSON.stringify(cam));
    toast.success(`Saved: ${name}`);
  }, [zoomK, dims.w, dims.h, savedViews]);

  const handleLoadView = useCallback(
    (name: string) => {
      const found = savedViews.find((v) => v.name === name);
      if (!found) return;
      setActiveView(name);
      applyCamera(found.cam, true);
      localStorage.setItem(LS_CAMERA_KEY, JSON.stringify(found.cam));
    },
    [savedViews, applyCamera]
  );

  const focusMe = useCallback(async () => {
    // Try to focus the user's node by email (requires profile in store or JWT)
    const { data: auth } = await supabase.auth.getUser();
    const email = auth?.user?.email;
    if (!email) {
      toast.info("Log in to focus your node.");
      return;
    }
    // look up by email
    const { data: me, error } = await supabase.from("community").select("id").eq("email", email).maybeSingle();
    if (error || !me?.id) {
      toast.info("Couldn't find your node.");
      return;
    }
    const n = graphData.nodes.find((x) => x.id === me.id);
    if (!n || !fgRef.current) {
      toast.info("Your node is not in the current view.");
      return;
    }
    // center and zoom in a bit
    fgRef.current.centerAt(n.x ?? 0, n.y ?? 0, 600);
    fgRef.current.zoom(1.6, 600);
    toast.success("Focused on your node");
  }, [graphData.nodes]);

  // Node hover (for info panel)
  const handleNodeHover = useCallback((n: NodeObject | null) => {
    setHoverNode(n as ProfileNode | null);
  }, []);

  // Tooltip text
  const nodeLabel = useCallback((n: NodeObject) => {
    const p = n as ProfileNode;
    return `${p.name}\n${p.group}`;
  }, []);

  return (
    <Card className="border-cyan/20 bg-background/50 h-[78vh] flex flex-col relative overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-cyan">
          <Zap />
          Synapse Console
          <span className="ml-2 text-xs text-muted-foreground">v3 • technical</span>
        </CardTitle>
      </CardHeader>

      <CardContent ref={containerRef} className="flex-grow relative">
        {/* Loading / Error overlays */}
        {loading && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-background/60">
            <Loader2 className="h-8 w-8 text-cyan animate-spin" />
            <p className="mt-3 text-muted-foreground">Rendering network…</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-destructive/10 rounded-lg">
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
            graphData={graphData}
            backgroundColor="transparent"
            nodeLabel={nodeLabel}
            nodeCanvasObject={nodeCanvasObject}
            linkCanvasObject={linkCanvasObject}
            linkDirectionalParticles={energyConfig.particleCount}
            linkDirectionalParticleWidth={energyConfig.particleWidth}
            linkDirectionalParticleSpeed={() => Math.random() * energyConfig.particleSpeed + energyConfig.particleSpeed}
            linkDirectionalParticleColor={particleColor}
            linkColor={() => "rgba(0, 207, 255, 0.28)"}
            onNodeHover={handleNodeHover}
            // @ts-ignore: supported by force-graph (2D)
            onZoom={handleZoom}
            // @ts-ignore
            onZoomEnd={handleZoomEnd}
            enableNodeDrag={false}
            cooldownTicks={120}
            d3VelocityDecay={0.3}
            // Small nudge for stability after first render
            onEngineStop={() => {
              // settle once; keep pins for soft clustering
            }}
          />
        )}

        {/* HUD: bottom-center controls */}
        <div className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-2xl bg-black/60 border border-cyan/30 px-3 py-2 shadow-[0_0_25px_rgba(0,255,255,0.15)] backdrop-blur">
            <Button size="sm" variant="outline" className="border-cyan/40 text-cyan hover:bg-cyan/10" onClick={handleResetView}>
              <RotateCcw className="h-4 w-4 mr-2" /> Reset
            </Button>

            <Button size="sm" variant="outline" className="border-cyan/40 text-cyan hover:bg-cyan/10" onClick={handleSaveView}>
              <Save className="h-4 w-4 mr-2" /> Save
            </Button>

            <Select value={activeView} onValueChange={handleLoadView}>
              <SelectTrigger className="h-8 w-[170px] border-cyan/40 text-cyan">
                <SelectValue placeholder="Load view…" />
              </SelectTrigger>
              <SelectContent>
                {savedViews.map((v) => (
                  <SelectItem key={v.name} value={v.name}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="mx-2 h-5 w-px bg-cyan/30" />

            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-cyan" />
              <Select value={energy} onValueChange={(v: EnergyLevel) => setEnergy(v)}>
                <SelectTrigger className="h-8 w-[120px] border-cyan/40 text-cyan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Energy: Low</SelectItem>
                  <SelectItem value="med">Energy: Med</SelectItem>
                  <SelectItem value="high">Energy: High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mx-2 h-5 w-px bg-cyan/30" />

            <div className="flex items-center gap-2">
              <Switch id="labels" checked={showLabels} onCheckedChange={setShowLabels} />
              <Label htmlFor="labels" className="text-cyan text-xs">Labels</Label>
            </div>

            <Button size="sm" variant="outline" className="border-cyan/40 text-cyan hover:bg-cyan/10" onClick={focusMe}>
              <Target className="h-4 w-4 mr-2" /> Focus Me
            </Button>
          </div>
        </div>

        {/* Info panel (hover) */}
        {hoverNode && (
          <div className="absolute right-3 top-3 w-[260px] rounded-xl border border-cyan/30 bg-black/60 p-3 text-sm text-cyan/90 shadow-[0_0_25px_rgba(0,255,255,0.08)] backdrop-blur">
            <div className="font-mono text-cyan-200 text-xs mb-1">Node</div>
            <div className="font-semibold text-cyan-100">{hoverNode.name}</div>
            <div className="text-cyan-300/80 mt-1">
              <span className="text-cyan-400/80">Cluster:</span> {hoverNode.group}
            </div>
            <div className="mt-2 text-cyan-300/70">
              <span className="text-cyan-400/80">ID:</span> <span className="break-all">{hoverNode.id}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
