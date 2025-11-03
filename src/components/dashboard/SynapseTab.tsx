import { useState, useEffect, useRef, useCallback } from "react";
import ForceGraph2D, { NodeObject, LinkObject } from "react-force-graph-2d";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Loader2, ServerCrash } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";

// =============== Types ===============
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

// =============== Component ===============
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

  // --------- Color palette & grouping ----------
  const skillColors = ["#FFD700", "#00FFFF", "#FF69B4", "#ADFF2F", "#FFA500", "#9370DB"];

  const colorFor = (group: string) => {
    const h = Math.abs(group.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
    return skillColors[h % skillColors.length];
  };

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

  // --------- Data fetch ----------
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

            let x: number | undefined = undefined;
            let y: number | undefined = undefined;
            if (typeof p.x === "number" && typeof p.y === "number") {
              x = p.x;
              y = p.y;
            } else {
              const angle = (i / count) * Math.PI * 2;
              const radius = 300;
              x = Math.cos(angle) * radius + (Math.random() - 0.5) * 40;
              y = Math.sin(angle) * radius + (Math.random() - 0.5) * 40;
            }

            return {
              id: p.id,
              name: p.name || "Unnamed",
              imageUrl: p.image_url || undefined,
              color,
              group,
              x,
              y,
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
        const msg = err?.message || "Failed to load network data.";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --------- Responsive sizing ----------
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
  }, [loading]);

  // --------- Camera persistence ----------
  const saveCamera = useCallback(() => {
    if (!fgRef.current) return;
    const cam = fgRef.current.cameraPosition();
    if (!cam) return;
    localStorage.setItem("synapse_camera", JSON.stringify(cam));
  }, []);

  const debounceRef = useRef<number | null>(null);
  const debouncedSaveCamera = useCallback(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(saveCamera, 250);
  }, [saveCamera]);

  useEffect(() => {
    if (!fgRef.current || !graphData.nodes.length) return;
    const saved = localStorage.getItem("synapse_camera");
    if (!saved) return;
    try {
      const { x, y, z } = JSON.parse(saved);
      fgRef.current.cameraPosition({ x, y, z });
    } catch {
      /* ignore */
    }
  }, [graphData]);

  // --------- Node rendering ----------
  const nodeCanvasObject = useCallback(
    (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as ProfileNode;
      const label = n.name;
      const r = 5;
      const fontSize = 12 / globalScale;

      ctx.beginPath();
      ctx.arc(n.x!, n.y!, r, 0, 2 * Math.PI);
      ctx.fillStyle = n.color;
      ctx.fill();

      ctx.font = `${fontSize}px Sora`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isDark ? "#E5E7EB" : "#1F2937";
      ctx.fillText(label, n.x!, n.y! + r + 8 / globalScale);
    },
    [isDark]
  );

  // --------- Persist node drag ----------
  const onNodeDragEnd = async (node: NodeObject) => {
    const n = node as ProfileNode;
    try {
      const { error } = await supabase
        .from("community")
        .update({ x: n.x, y: n.y } as any)
        .eq("id", n.id);
      if (error) console.debug("[SynapseTab] Skipped persisting x/y:", error.message);
    } catch (err) {
      console.debug("[SynapseTab] Persist x/y failed:", (err as any)?.message);
    }
  };

  // --------- Reset View Button Handler ----------
  const handleResetView = useCallback(() => {
    if (!fgRef.current || !graphData.nodes.length) return;

    // Compute bounding box of current graph
    const bbox = fgRef.current.getGraphBbox();
    const center = {
      x: (bbox.x[0] + bbox.x[1]) / 2,
      y: (bbox.y[0] + bbox.y[1]) / 2,
      z: Math.max(bbox.z[1] - bbox.z[0], bbox.y[1] - bbox.y[0]) * 0.9, // auto zoom level
    };

    fgRef.current.cameraPosition(
      { x: center.x, y: center.y, z: center.z },
      { x: center.x, y: center.y, z: 0 },
      1000 // ms animation
    );
  }, [graphData]);

  // --------- Render ----------
  return (
    <Card className="border-cyan/20 bg-background/50 h-[70vh] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan">
          <Zap />
          <span>Synapse View</span>
          <span className="text-sm text-muted-foreground"> — clustered by skills</span>
        </CardTitle>
      </CardHeader>

      <CardContent ref={containerRef} className="flex-grow relative">
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
          <>
            <button
              className="absolute right-3 top-3 px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-700 text-white text-xs shadow-md"
              onClick={handleResetView}
            >
              Reset View
            </button>

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
              linkColor={() => "rgba(0, 207, 255, 0.35)"}
              enableNodeDrag={true}
              onNodeDragEnd={onNodeDragEnd}
              onZoomEnd={debouncedSaveCamera}
              onEngineStop={debouncedSaveCamera}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
