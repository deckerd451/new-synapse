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
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";

interface ProfileNode extends NodeObject {
  id: string;
  name: string;
  imageUrl?: string;
  color: string;
  group: string;
  skills?: string[];
}

export function SynapseTab() {
  const { isDark } = useTheme();
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphData, setGraphData] = useState<{ nodes: ProfileNode[]; links: LinkObject[] }>({
    nodes: [],
    links: [],
  });
  const [selectedNode, setSelectedNode] = useState<ProfileNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isFull, setIsFull] = useState(false);

  const skillColors = ["#FFD700", "#00FFFF", "#FF69B4", "#ADFF2F", "#FFA500", "#9370DB"];
  const getColorByGroup = (group: string) => {
    const idx =
      Math.abs(group.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) %
      skillColors.length;
    return skillColors[idx];
  };

  // 🧠 Load graph data
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
            const group = Array.isArray(p.skills)
              ? p.skills[0] || "General"
              : typeof p.skills === "string"
              ? p.skills.split(",")[0] || "General"
              : "General";
            const color = getColorByGroup(group);
            return {
              id: p.id,
              name: p.name || "Unnamed",
              imageUrl: p.image_url || undefined,
              color,
              group,
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

  // 📏 Handle sizing
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

  // 🧬 Node Rendering
  const nodeCanvasObject = useCallback(
    (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as ProfileNode;
      const r = 5;
      const gradient = ctx.createRadialGradient(n.x!, n.y!, 0, n.x!, n.y!, 18);
      gradient.addColorStop(0, `${n.color}AA`);
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(n.x!, n.y!, 18, 0, 2 * Math.PI);
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

  // 🎛️ Controls
  const resetCamera = () => fgRef.current?.zoomToFit(400, 60);
  const toggleFullscreen = () => setIsFull((p) => !p);

  return (
    <Card
      className={`border-cyan/20 bg-background/50 ${
        isFull ? "fixed inset-0 z-50 rounded-none" : "h-[70vh]"
      } flex flex-col`}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan">
          <Zap /> Synapse Network —{" "}
          <span className="text-sm text-muted-foreground">Architectural Diagnostics</span>
        </CardTitle>
      </CardHeader>

      <CardContent ref={containerRef} className="relative flex-grow overflow-hidden">
        {/* Subtle technical grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(0deg, rgba(0,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

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
            linkColor={() => "rgba(0,255,255,0.25)"}
            linkDirectionalParticles={3}
            linkDirectionalParticleWidth={1.5}
            linkDirectionalParticleSpeed={() => Math.random() * 0.008 + 0.004}
            backgroundColor="transparent"
            onNodeClick={(node) => setSelectedNode(node as ProfileNode)}
          />
        )}

        {/* HUD controls */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3 z-50">
          <button
            onClick={resetCamera}
            className="hud-btn px-3 py-2 rounded text-cyan text-sm flex items-center gap-1"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button
            onClick={toggleFullscreen}
            className="hud-btn px-3 py-2 rounded text-cyan text-sm flex items-center gap-1"
          >
            {isFull ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {isFull ? "Exit" : "Full"}
          </button>
        </div>

        {/* ⚙️ Node Info HUD */}
        {selectedNode && (
          <div className="absolute bottom-6 right-6 w-64 bg-black/70 border border-cyan/40 rounded-lg shadow-lg text-cyan p-4 backdrop-blur-sm animate-fade-in">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-mono text-base">{selectedNode.name}</h3>
              <button onClick={() => setSelectedNode(null)} className="text-cyan/70 hover:text-cyan">
                <XCircle size={16} />
              </button>
            </div>
            {selectedNode.imageUrl && (
              <img
                src={selectedNode.imageUrl}
                alt={selectedNode.name}
                className="w-full h-32 object-cover rounded-md mb-2 border border-cyan/30"
              />
            )}
            <p className="text-xs text-cyan/80">
              <span className="uppercase tracking-wider text-cyan/60">Group: </span>
              {selectedNode.group}
            </p>
            <p className="text-xs text-cyan/80 mt-1">
              <span className="uppercase tracking-wider text-cyan/60">ID: </span>
              {selectedNode.id.slice(0, 8)}…
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
