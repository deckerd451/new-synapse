import { useState, useEffect, useRef, useCallback } from "react";
import ForceGraph2D, { NodeObject, LinkObject } from "react-force-graph-2d";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Zap,
  RotateCcw,
  Maximize2,
  Minimize2,
  Loader2,
  ServerCrash,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";
import { RealtimeChannel } from "@supabase/supabase-js";

interface ProfileNode extends NodeObject {
  id: string;
  name: string;
  imageUrl?: string;
  color: string;
  group: string;
}

export function SynapseTab() {
  const { isDark } = useTheme();
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [graphData, setGraphData] = useState<{ nodes: ProfileNode[]; links: LinkObject[] }>({
    nodes: [],
    links: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [savedView, setSavedView] = useState<any>(null);
  const [isFull, setIsFull] = useState(false);
  const [activeBursts, setActiveBursts] = useState<Set<string>>(new Set());

  const skillColors = ["#FFD700", "#00FFFF", "#FF69B4", "#ADFF2F", "#FFA500", "#9370DB"];
  const getColorByGroup = (group: string) => {
    const idx =
      Math.abs(group.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) %
      skillColors.length;
    return skillColors[idx];
  };

  // 🧠 Fetch initial graph
  useEffect(() => {
    const fetchGraphData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from("community")
          .select("id, name, image_url, skills");
        if (profilesError) throw profilesError;

        const { data: connections, error: connectionsError } = await supabase
          .from("connections")
          .select("id, from_user_id, to_user_id");
        if (connectionsError) throw connectionsError;

        const nodes: ProfileNode[] =
          profiles?.map((p, i) => {
            let group = "General";
            if (p.skills) {
              try {
                const arr =
                  typeof p.skills === "string"
                    ? p.skills.split(",").map((s) => s.trim())
                    : Array.isArray(p.skills)
                    ? p.skills
                    : [];
                if (arr.length > 0) group = arr[0];
              } catch {
                group = "General";
              }
            }
            const color = getColorByGroup(group);
            const angle = (i / profiles.length) * 2 * Math.PI;
            const radius = 300;
            const cx = Math.cos(angle) * radius;
            const cy = Math.sin(angle) * radius;

            return {
              id: p.id,
              name: p.name || "Unnamed",
              imageUrl: p.image_url || undefined,
              color,
              group,
              x: cx,
              y: cy,
            };
          }) || [];

        const links: LinkObject[] =
          connections?.map((c) => ({
            source: c.from_user_id,
            target: c.to_user_id,
          })) || [];

        setGraphData({ nodes, links });
      } catch (err: any) {
        console.error("Graph fetch error:", err);
        setError(err.message || "Failed to load network data.");
        toast.error(err.message || "Failed to load network data.");
      } finally {
        setLoading(false);
      }
    };
    fetchGraphData();
  }, []);

  // 🛰️ Supabase Realtime listener for new connections
  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel("realtime-connections")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "connections" },
        (payload) => {
          const newLink = payload.new;
          if (!newLink) return;
          const linkId = `${newLink.from_user_id}-${newLink.to_user_id}`;
          console.log("⚡ New connection detected:", linkId);

          // Add to active bursts for 3s glow
          setActiveBursts((prev) => new Set(prev).add(linkId));
          setTimeout(() => {
            setActiveBursts((prev) => {
              const copy = new Set(prev);
              copy.delete(linkId);
              return copy;
            });
          }, 3000);

          // Optionally append link dynamically
          setGraphData((prev) => ({
            ...prev,
            links: [
              ...prev.links,
              { source: newLink.from_user_id, target: newLink.to_user_id },
            ],
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 📏 Responsive sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // 🎨 Node Rendering — glowing technical style
  const nodeCanvasObject = useCallback(
    (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as ProfileNode;
      const r = 5;
      const gradient = ctx.createRadialGradient(n.x!, n.y!, 0, n.x!, n.y!, 20);
      gradient.addColorStop(0, `${n.color}AA`);
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(n.x!, n.y!, 20, 0, 2 * Math.PI);
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(n.x!, n.y!, r, 0, 2 * Math.PI);
      ctx.fillStyle = n.color;
      ctx.fill();

      // Label
      const fontSize = 11 / globalScale;
      ctx.font = `${fontSize}px JetBrains Mono`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = isDark ? "#E0E0E0" : "#222";
      ctx.fillText(n.name, n.x!, n.y! + 8 / globalScale);
    },
    [isDark]
  );

  // ⚡ Link visual dynamics
  const linkColor = (link: LinkObject) => {
    const id = `${link.source}-${link.target}`;
    return activeBursts.has(id)
      ? "rgba(0,255,255,0.9)"
      : "rgba(0,255,255,0.25)";
  };

  const linkDirectionalParticles = (link: LinkObject) =>
    activeBursts.has(`${link.source}-${link.target}`) ? 12 : 3;

  const linkDirectionalParticleWidth = (link: LinkObject) =>
    activeBursts.has(`${link.source}-${link.target}`) ? 3 : 1.5;

  const linkDirectionalParticleSpeed = (link: LinkObject) =>
    activeBursts.has(`${link.source}-${link.target}`)
      ? Math.random() * 0.02 + 0.015
      : Math.random() * 0.008 + 0.004;

  // 🎥 Camera controls
  const saveCameraView = () => {
    if (!fgRef.current) return;
    const { x, y, k } = fgRef.current.zoom();
    localStorage.setItem("synapse_view", JSON.stringify({ x, y, k }));
    setSavedView({ x, y, k });
    toast.success("View saved");
  };

  const loadCameraView = () => {
    const stored = localStorage.getItem("synapse_view");
    if (stored && fgRef.current) {
      const { x, y, k } = JSON.parse(stored);
      fgRef.current.zoom(k, { x, y }, 800);
    }
  };

  const resetCamera = () => {
    fgRef.current.zoomToFit(400, 60);
  };

  // 🖥️ Fullscreen toggle
  const toggleFullscreen = () => {
    setIsFull((prev) => !prev);
    setTimeout(() => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    }, 400);
  };

  return (
    <Card
      className={`border-cyan/20 bg-background/50 ${
        isFull ? "fixed inset-0 z-50 rounded-none" : "h-[70vh]"
      } flex flex-col`}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan">
          <Zap /> Synapse View —{" "}
          <span className="text-sm text-muted-foreground">Technical Energy Network</span>
        </CardTitle>
      </CardHeader>

      <CardContent ref={containerRef} className="relative flex-grow overflow-hidden">
        <div className="synapse-bg" />

        {loading && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-background/50">
            <Loader2 className="h-8 w-8 text-cyan animate-spin" />
            <p className="mt-4 text-muted-foreground">Building network visualization...</p>
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
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel={(n) => `${(n as ProfileNode).name} — ${(n as ProfileNode).group}`}
            nodeCanvasObject={nodeCanvasObject}
            linkColor={linkColor}
            linkDirectionalParticles={linkDirectionalParticles}
            linkDirectionalParticleWidth={linkDirectionalParticleWidth}
            linkDirectionalParticleSpeed={linkDirectionalParticleSpeed}
            backgroundColor="transparent"
          />
        )}

        {/* HUD Controls */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3 z-50">
          <button onClick={resetCamera} className="hud-btn px-3 py-2 rounded text-cyan text-sm flex items-center gap-1">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button onClick={saveCameraView} className="hud-btn px-3 py-2 rounded text-cyan text-sm flex items-center gap-1">
            Save
          </button>
          <button onClick={loadCameraView} className="hud-btn px-3 py-2 rounded text-cyan text-sm flex items-center gap-1">
            Load
          </button>
          <button
            onClick={toggleFullscreen}
            className="hud-btn px-3 py-2 rounded text-cyan text-sm flex items-center gap-1"
          >
            {isFull ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}{" "}
            {isFull ? "Exit" : "Full"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
