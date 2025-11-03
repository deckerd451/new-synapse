import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Users, BrainCircuit, Loader2, ServerCrash } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient'; // ✅ make sure this path is correct

type SkillLeaderboardItem = {
  skill: string;
  endorsement_count: number;
};

type ConnectorLeaderboardItem = {
  id: string;
  name: string;
  email: string;
  connection_count: number;
};

type LeaderboardData = SkillLeaderboardItem[] | ConnectorLeaderboardItem[];

function LeaderboardTable({ data, type }: { data: LeaderboardData; type: 'skills' | 'connectors' }) {
  if (data.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No data available for this leaderboard yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">Rank</TableHead>
          <TableHead>{type === 'skills' ? 'Skill' : 'User'}</TableHead>
          <TableHead className="text-right">{type === 'skills' ? 'Endorsements' : 'Connections'}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium text-gold">{index + 1}</TableCell>
            <TableCell>
              {type === 'skills'
                ? (item as SkillLeaderboardItem).skill
                : (item as ConnectorLeaderboardItem).name}
            </TableCell>
            <TableCell className="text-right font-mono text-cyan">
              {type === 'skills'
                ? (item as SkillLeaderboardItem).endorsement_count
                : (item as ConnectorLeaderboardItem).connection_count}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function LeaderboardTab() {
  const [activeTab, setActiveTab] = useState<'skills' | 'connectors'>('skills');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);

      try {
        if (activeTab === 'skills') {
          // 🧠 Fetch top skills
          const { data, error } = await supabase
            .from('skills')
            .select('skill, endorsement_count')
            .order('endorsement_count', { ascending: false })
            .limit(20);

          if (error) throw error;
          setLeaderboardData(data || []);
        } else {
          // 🤝 Fetch top connectors
          const { data, error } = await supabase
            .from('community')
            .select('id, name, email, connection_count')
            .order('connection_count', { ascending: false })
            .limit(20);

          if (error) throw error;
          setLeaderboardData(data || []);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load leaderboard data.');
        toast.error(err.message || 'Failed to load leaderboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [activeTab]);

  return (
    <Card className="border-cyan/20 bg-background/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan">
          <Trophy />
          Network Leaderboards
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'skills' | 'connectors')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="skills">
              <BrainCircuit className="w-4 h-4 mr-2" />
              Top Skills
            </TabsTrigger>
            <TabsTrigger value="connectors">
              <Users className="w-4 h-4 mr-2" />
              Top Connectors
            </TabsTrigger>
          </TabsList>

          <TabsContent value="skills" className="mt-4">
            {loading && (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 text-cyan animate-spin" />
              </div>
            )}
            {error && (
              <div className="text-center p-8 bg-destructive/10 rounded-lg">
                <ServerCrash className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-destructive-foreground">{error}</p>
              </div>
            )}
            {!loading && !error && <LeaderboardTable data={leaderboardData} type="skills" />}
          </TabsContent>

          <TabsContent value="connectors" className="mt-4">
            {loading && (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 text-cyan animate-spin" />
              </div>
            )}
            {error && (
              <div className="text-center p-8 bg-destructive/10 rounded-lg">
                <ServerCrash className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-destructive-foreground">{error}</p>
              </div>
            )}
            {!loading && !error && <LeaderboardTable data={leaderboardData} type="connectors" />}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
