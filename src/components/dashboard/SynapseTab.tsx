import { useState, useEffect, useRef, useCallback } from "react";
import ForceGraph2D, { NodeObject, LinkObject } from "react-force-graph-2d";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Loader2, ServerCrash } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";

// 🧬 Extended node type
interface ProfileNode extends NodeObject {
  id: string;
  name: string;
  imageUrl?: string;
  color: string;
  group: string;
  fx?: number;
  fy?: number;
}

interface Connection {
  id: string;
  from_user_id: string;
  to_user_id: string;
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

  // 🎨 Define cluster color palette
  const skillColors = [
    "#FFD700", // gold
    "#00FFFF", // cyan
    "#FF69B4", // pink
    "#ADFF2F", // lime
    "#FFA500", // orange
    "#9370DB", // purple
  ];

  const getColorByGroup = (group: string) => {
    const index =
      Math.abs(group.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) %
      skillColors.length;
    return skillColors[index];
  };

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

        // 🧩 Assign each profile to a skill group
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
                if (arr.length > 0) group = arr[0]; // use first skill as cluster tag
              } catch {
                group = "General";
              }
            }

            const color = getColorByGroup(group);

            // Assign cluster center roughly spaced around a circle
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
              fx: cx + (Math.random() - 0.5) * 40,
              fy: cy + (Math.random() - 0.5) * 40,
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
  }, [loading]);

  // 🧠 Custom node rendering
  const nodeCanvasObject = useCallback(
    (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const typedNode = node as ProfileNode;
      const label = typedNode.name;
      const fontSize = 12 / globalScale;
      ctx.font = `${fontSize}px Sora`;
      const r = 5;

      // Draw circle node
      ctx.beginPath();
      ctx.arc(typedNode.x!, typedNode.y!, r, 0, 2 * Math.PI, false);
      ctx.fillStyle = typedNode.color;
      ctx.fill();

      // Label below node
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isDark ? "#E5E7EB" : "#1F2937";
      ctx.fillText(label, typedNode.x!, typedNode.y! + r + 8 / globalScale);
    },
    [isDark]
  );

  return (
    <Card className="border-cyan/20 bg-background/50 h-[70vh] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan">
          <Zap />
          Synapse View — <span className="text-sm text-muted-foreground">Clustered by skills</span>
        </CardTitle>
      </CardHeader>
      <CardContent ref={containerRef} className="flex-grow relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-background/50">
            <Loader2 className="h-8 w-8 text-cyan animate-spin" />
            <p className="mt-4 text-muted-foreground">Building clustered network visualization...</p>
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
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel={(n) => `${(n as ProfileNode).name}\n${(n as ProfileNode).group}`}
            nodeCanvasObject={nodeCanvasObject}
            linkDirectionalParticles={1}
            linkDirectionalParticleWidth={1.5}
            linkDirectionalParticleSpeed={() => Math.random() * 0.01 + 0.005}
            linkColor={() => "rgba(0, 207, 255, 0.3)"}
            backgroundColor="transparent"
          />
        )}
      </CardContent>
    </Card>
  );
}
