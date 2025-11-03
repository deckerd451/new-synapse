import { useState, useEffect, useRef, useCallback } from "react";
import ForceGraph2D, { NodeObject, LinkObject } from "react-force-graph-2d";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Loader2, ServerCrash } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";

interface ProfileNode extends NodeObject {
  id: string;
  name: string;
  group?: string;
  color?: string;
  imageUrl?: string;
}

interface NodeMetrics {
  connections: number;
  endorsements: number;
  bio?: string;
}

export function SynapseTab() {
  const { isDark } = useTheme();
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphData, setGraphData] = useState<{ nodes: ProfileNode[]; links: LinkObject[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const [hoveredNode, setHoveredNode] = useState<ProfileNode | null>(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, visible: false });
  const [metricsCache, setMetricsCache] = useState<Record<string, NodeMetrics>>({});

  // 🧠 Fetch network data
  useEffect(() => {
    const fetchGraphData = async () => {
      setLoading(true);
      try {
        const { data: profiles } = await supabase.from("community").select("id, name, image_url, skills");
        const { data: connections } = await supabase.from("connections").select("id, from_user_id, to_user_id");

        const nodes =
          profiles?.map((p) => ({
            id: p.id,
            name: p.name || "Unnamed",
            group: Array.isArray(p.skills) ? p.skills[0] : "General",
            color: "#00FFFF",
            imageUrl: p.image_url || undefined,
          })) || [];

        const links =
          connections?.map((c) => ({
            source: c.from_user_id,
            target: c.to_user_id,
          })) || [];

        setGraphData({ nodes, links });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load network data.");
      } finally {
        setLoading(false);
      }
    };
    fetchGraphData();
  }, []);

  // 📏 Resize handling
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // 🧭 Track mouse
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setTooltip((t) => ({ ...t, x: e.clientX + 12, y: e.clientY + 12 }));
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  // 🔍 Fetch node metrics dynamically
  const fetchNodeMetrics = useCallback(async (nodeId: string) => {
    if (metricsCache[nodeId]) return metricsCache[nodeId];

    try {
      const [{ count: connCount }, { count: endCount }, { data: profileData }] = await Promise.all([
        supabase
          .from("connections")
          .select("*", { count: "exact", head: true })
          .or(`from_user_id.eq.${nodeId},to_user_id.eq.${nodeId}`),
        supabase
          .from("endorsements")
          .select("*", { count: "exact", head: true })
          .eq("target_id", nodeId),
        supabase
          .from("community")
          .select("bio")
          .eq("id", nodeId)
          .maybeSingle(),
      ]);

      const metrics = {
        connections: connCount || 0,
        endorsements: endCount || 0,
        bio: profileData?.bio,
      };
      setMetricsCache((prev) => ({ ...prev, [nodeId]: metrics }));
      return metrics;
    } catch (err) {
      console.error("Metrics fetch error:", err);
      return { connections: 0, endorsements: 0 };
    }
  }, [metricsCache]);

  // 🧬 Node render
  const nodeCanvasObject = useCallback(
    (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as ProfileNode;
      const r = 5;
      const gradient = ctx.createRadialGradient(n.x!, n.y!, 0, n.x!, n.y!, 18);
      gradient.addColorStop(0, `${n.color || "#00FFFF"}AA`);
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(n.x!, n.y!, 18, 0, 2 * Math.PI);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(n.x!, n.y!, r, 0, 2 * Math.PI);
      ctx.fillStyle = n.color || "#00FFFF";
      ctx.fill();

      const fontSize = 11 / globalScale;
      ctx.font = `${fontSize}px JetBrains Mono`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = isDark ? "#E0E0E0" : "#222";
      ctx.fillText(n.name, n.x!, n.y! + 8 / globalScale);
    },
    [isDark]
  );

  return (
    <Card className="border-cyan/20 bg-background/50 h-[70vh] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan">
          <Zap /> Synapse Network — <span className="text-sm text-muted-foreground">Real-Time Data Probe</span>
        </CardTitle>
      </CardHeader>

      <CardContent ref={containerRef} className="relative flex-grow overflow-hidden">
        <div className="synapse-bg" />

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-cyan animate-spin" />
            <p className="text-muted-foreground mt-2">Analyzing network topology…</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-destructive">
            <ServerCrash className="h-6 w-6 mr-2" /> {error}
          </div>
        )}

        {!loading && !error && (
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeCanvasObject={nodeCanvasObject}
            linkColor={() => "rgba(0,255,255,0.25)"}
            linkDirectionalParticles={3}
            linkDirectionalParticleWidth={1.5}
            linkDirectionalParticleSpeed={() => Math.random() * 0.008 + 0.004}
            backgroundColor="transparent"
            onNodeHover={async (node) => {
              if (node) {
                const n = node as ProfileNode;
                const data = await fetchNodeMetrics(n.id);
                setHoveredNode({ ...n, ...data });
                setTooltip((t) => ({ ...t, visible: true }));
              } else {
                setTooltip((t) => ({ ...t, visible: false }));
                setHoveredNode(null);
              }
            }}
          />
        )}

        {/* 🧠 Data Probe Tooltip */}
        {tooltip.visible && hoveredNode && (
          <div
            className="tooltip animate-fade-in"
            style={{
              position: "fixed",
              top: tooltip.y,
              left: tooltip.x,
              transform: "translate(10px, 10px)",
              zIndex: 1000,
            }}
          >
            <p className="font-mono text-xs text-cyan mb-1">{hoveredNode.name}</p>
            <p className="text-[10px] text-cyan/70 leading-tight">
              🧩 Connections: {metricsCache[hoveredNode.id]?.connections ?? "…"}
              <br />
              ⭐ Endorsements: {metricsCache[hoveredNode.id]?.endorsements ?? "…"}
            </p>
            {hoveredNode.bio && (
              <p className="mt-1 text-[9px] text-cyan/60 max-w-[180px] italic line-clamp-2">
                “{hoveredNode.bio.slice(0, 80)}…”
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
