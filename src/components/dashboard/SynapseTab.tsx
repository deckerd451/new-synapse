import { useState, useEffect, useRef, useCallback } from "react";
import ForceGraph2D, { NodeObject, LinkObject } from "react-force-graph-2d";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Loader2, ServerCrash, RefreshCw, ZoomIn, ZoomOut, Shuffle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";

// === Types ===
interface ProfileNode extends NodeObject {
  id: string;
  name: string;
  imageUrl?: string;
  color: string;
  group: string;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface ConnectionRow {
  id: string;
  from_user_id: string;
  to_user_id: string;
}

interface CommunityRow {
  id: string;
  name: string | null;
  image_url: string | null;
  skills: string | string[] | null;
  x?: number | null;
  y?: number | null;
}

export function SynapseTab() {
  const { isDark } = useTheme();
  const [graphData, setGraphData] = useState<{ nodes: ProfileNode[]; links: LinkObject[] }>({
    nodes: [],
    links: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const fgRef = useRef<any>(null);

  // === Visual settings ===
  const skillColors = ["#FFD700", "#00FFFF", "#FF69B4", "#ADFF2F", "#FFA500", "#9370DB"];
  const colorFor = (group: string) =>
    skillColors[
      Math.abs(group.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % skillColors.length
    ];

  const getFirstSkill = (skills: CommunityRow["skills"]) => {
    if (!skills) return "General";
    if (Array.isArray(skills)) return skills[0] || "General";
    try {
      const maybe = JSON.parse(skills as string);
      if (Array.isArray(maybe) && maybe.length) return String(maybe[0]);
    } catch {
      const parts = String(skills)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length) return parts[0];
    }
    return "General";
  };

  // === Fetch graph ===
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from("community")
          .select<CommunityRow>("id, name, image_url, skills, x, y");
        if (profilesError) throw profilesError;

        const { data: connections, error: connectionsError } = await supabase
          .from("connections")
          .select<ConnectionRow>("id, from_user_id, to_user_id");
        if (connectionsError) throw connectionsError;

        const count = profiles?.length || 1;
        const nodes: ProfileNode[] =
          profiles?.map((p, i) => {
            const group = getFirstSkill(p.skills);
            const color = colorFor(group);
            const radius = 350;
            const angle = (i / count) * Math.PI * 2;
            return {
              id: p.id,
              name: p.name || "Unnamed",
              imageUrl: p.image_url || undefined,
              color,
              group,
              x: p.x ?? Math.cos(angle) * radius,
              y: p.y ?? Math.sin(angle) * radius,
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
        toast.error(err.message || "Failed to load network data.");
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // === Resize handling ===
  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // === Camera persistence ===
  const saveCamera = useCallback(() => {
    if (!fgRef.current) return;
    const cam = fgRef.current.cameraPosition();
    if (cam) localStorage.setItem("synapse_camera", JSON.stringify(cam));
  }, []);

  const restoreCamera = useCallback(() => {
    const saved = localStorage.getItem("synapse_camera");
    if (!fgRef.current || !saved) return;
    try {
      const { x, y, z } = JSON.parse(saved);
      fgRef.current.cameraPosition({ x, y, z });
    } catch {}
  }, []);

  // Restore on load
  useEffect(() => {
    if (graphData.nodes.length) setTimeout(restoreCamera, 500);
  }, [graphData]);

  // === Node rendering with halo ===
  const nodeCanvasObject = useCallback(
    (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as ProfileNode;
      const r = 5;
      const fontSize = 12 / globalScale;

      // Glow halo
      const gradient = ctx.createRadialGradient(n.x!, n.y!, r, n.x!, n.y!, r * 4);
      gradient.addColorStop(0, `${n.color}cc`);
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(n.x!, n.y!, r * 4, 0, 2 * Math.PI);
      ctx.fill();

      // Node dot
      ctx.beginPath();
      ctx.arc(n.x!, n.y!, r, 0, 2 * Math.PI);
      ctx.fillStyle = n.color;
      ctx.fill();

      // Label
      ctx.font = `${fontSize}px Sora`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isDark ? "#E5E7EB" : "#111";
      ctx.fillText(n.name, n.x!, n.y! + r + 8 / globalScale);
    },
    [isDark]
  );

  // === Persist drag ===
  const onNodeDragEnd = async (node: NodeObject) => {
    const n = node as ProfileNode;
    try {
      await supabase.from("community").update({ x: n.x, y: n.y } as any).eq("id", n.id);
    } catch {}
  };

  // === Delightful Controls ===
  const handleResetView = useCallback(() => {
    if (!fgRef.current || !graphData.nodes.length) return;
    const bbox = fgRef.current.getGraphBbox();
    const center = {
      x: (bbox.x[0] + bbox.x[1]) / 2,
      y: (bbox.y[0] + bbox.y[1]) / 2,
      z: Math.max(bbox.y[1] - bbox.y[0], bbox.x[1] - bbox.x[0]) * 0.8,
    };
    fgRef.current.cameraPosition(
      { x: center.x, y: center.y, z: center.z },
      { x: center.x, y: center.y, z: 0 },
      1000
    );
  }, [graphData]);

  const handleZoom = (factor: number) => {
    if (!fgRef.current) return;
    const cam = fgRef.current.cameraPosition();
    fgRef.current.cameraPosition(
      { x: cam.x, y: cam.y, z: cam.z / factor },
      { x: cam.x, y: cam.y, z: 0 },
      400
    );
  };

  const shuffleLayout = () => {
    if (!fgRef.current) return;
    fgRef.current.d3Force("charge").strength(-60);
    fgRef.current.d3ReheatSimulation();
  };

  return (
    <Card className="border-cyan/20 bg-background/50 h-[70vh] flex flex-col overflow-hidden relative animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan">
          <Zap className="animate-pulse" />
          <span>Synapse View</span>
          <span className="text-sm text-muted-foreground"> — radiant & interactive</span>
        </CardTitle>
      </CardHeader>

      <CardContent ref={containerRef} className="flex-grow relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-background/50 backdrop-blur-sm transition-all">
            <Loader2 className="h-8 w-8 text-cyan animate-spin" />
            <p className="mt-4 text-muted-foreground">Energizing network...</p>
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
          <>
            {/* Floating controls */}
            <div className="absolute right-4 top-4 flex flex-col gap-2 z-10">
              <button
                onClick={handleResetView}
                title="Recenter"
                className="p-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full shadow-md transition transform hover:scale-105"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleZoom(1.2)}
                title="Zoom In"
                className="p-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full shadow-md transition transform hover:scale-105"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleZoom(0.8)}
                title="Zoom Out"
                className="p-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full shadow-md transition transform hover:scale-105"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={shuffleLayout}
                title="Shuffle Layout"
                className="p-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full shadow-md transition transform hover:scale-105"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>

            {/* Force graph */}
            <ForceGraph2D
              ref={fgRef}
              width={dimensions.width}
              height={dimensions.height}
              graphData={graphData}
              backgroundColor="transparent"
              nodeLabel={(n) => `${(n as ProfileNode).name}\n${(n as ProfileNode).group}`}
              nodeCanvasObject={nodeCanvasObject}
              linkDirectionalParticles={3}
              linkDirectionalParticleWidth={2}
              linkDirectionalParticleSpeed={() => Math.random() * 0.02 + 0.005}
              linkColor={() => "rgba(0, 207, 255, 0.25)"}
              enableNodeDrag={true}
              onNodeDragEnd={onNodeDragEnd}
              onZoomEnd={saveCamera}
              onEngineStop={saveCamera}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
