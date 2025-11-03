import { useState, useEffect, useRef, useCallback } from 'react';
import ForceGraph2D, { NodeObject, LinkObject } from 'react-force-graph-2d';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Loader2, ServerCrash } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useTheme } from '@/hooks/use-theme';
import { toast } from 'sonner';

// Extend NodeObject to include profile data
interface ProfileNode extends NodeObject {
  id: string;
  name: string;
  imageUrl?: string;
  color: string;
}

interface Connection {
  id: string;
  from_user_id: string;
  to_user_id: string;
}

interface Profile {
  id: string;
  name: string;
  image_url?: string;
}

export function SynapseTab() {
  const { isDark } = useTheme();
  const [graphData, setGraphData] = useState<{ nodes: ProfileNode[]; links: LinkObject[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const fetchGraphData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 🧠 Fetch all community members (profiles)
        const { data: profiles, error: profilesError } = await supabase
          .from('community')
          .select('id, name, image_url');

        if (profilesError) throw profilesError;

        // 🔗 Fetch all connections
        const { data: connections, error: connectionsError } = await supabase
          .from('connections')
          .select('id, from_user_id, to_user_id');

        if (connectionsError) throw connectionsError;

        // 🧩 Transform to match ForceGraph2D format
        const nodes: ProfileNode[] =
          profiles?.map((p) => ({
            id: p.id,
            name: p.name || 'Unnamed',
            imageUrl: p.image_url || undefined,
            color: '#FFD700', // gold nodes
          })) || [];

        const links: LinkObject[] =
          connections?.map((c) => ({
            source: c.from_user_id,
            target: c.to_user_id,
          })) || [];

        setGraphData({ nodes, links });
      } catch (err: any) {
        console.error('Graph fetch error:', err);
        setError(err.message || 'Failed to load network data.');
        toast.error(err.message || 'Failed to load network data.');
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
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [loading]);

  // 🧬 Custom node rendering
  const nodeCanvasObject = useCallback(
    (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const typedNode = node as ProfileNode;
      const label = typedNode.name;
      const fontSize = 12 / globalScale;
      ctx.font = `${fontSize}px Sora`;
      const r = 4;

      // Draw circle
      ctx.beginPath();
      ctx.arc(typedNode.x!, typedNode.y!, r, 0, 2 * Math.PI, false);
      ctx.fillStyle = typedNode.color || 'rgba(255, 215, 0, 0.8)';
      ctx.fill();

      // Draw text label
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isDark ? '#E5E7EB' : '#1F2937';
      ctx.fillText(label, typedNode.x!, typedNode.y! + r + 8 / globalScale);
    },
    [isDark]
  );

  return (
    <Card className="border-cyan/20 bg-background/50 h-[70vh] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan">
          <Zap />
          Synapse View
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
          <ForceGraph2D
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel="name"
            nodeCanvasObject={nodeCanvasObject}
            linkDirectionalParticles={1}
            linkDirectionalParticleWidth={1.5}
            linkDirectionalParticleSpeed={() => Math.random() * 0.01 + 0.005}
            linkColor={() => 'rgba(0, 207, 255, 0.3)'}
            backgroundColor="transparent"
          />
        )}
      </CardContent>
    </Card>
  );
}
