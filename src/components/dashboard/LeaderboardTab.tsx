import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trophy, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export function LeaderboardTab() {
  const [activeTab, setActiveTab] = useState<"skills" | "connectors">("skills");
  const [skills, setSkills] = useState<any[]>([]);
  const [connectors, setConnectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch leaderboard data
  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      if (activeTab === "skills") {
        const { data, error } = await supabase
          .from("skills")
          .select("*")
          .order("endorsement_count", { ascending: false });
        if (error) throw error;
        setSkills(data || []);
      } else {
        const { data, error } = await supabase
          .from("top_endorsers")
          .select("*")
          .order("total_given", { ascending: false });
        if (error) throw error;
        setConnectors(data || []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load leaderboard.");
    } finally {
      setLoading(false);
    }
  };

  // 🧠 Realtime: Listen for endorsement changes
  useEffect(() => {
    console.log("✅ Listening for realtime updates on endorsements...");
    const channel = supabase
      .channel("endorsements-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "endorsements",
        },
        (payload) => {
          console.log("✨ New endorsement detected:", payload.new);
          toast.success("New endorsement added!");
          // Re-fetch leaderboard instantly
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-2">
        <Trophy className="h-6 w-6 text-cyan-400" /> Network Leaderboards
      </h2>

      <div className="flex justify-center gap-6 mb-6">
        <button
          onClick={() => setActiveTab("skills")}
          className={`px-4 py-2 rounded-full border transition ${
            activeTab === "skills"
              ? "bg-cyan-600 border-cyan-400"
              : "bg-gray-800 border-gray-600 hover:bg-gray-700"
          }`}
        >
          ⚙️ Top Skills
        </button>
        <button
          onClick={() => setActiveTab("connectors")}
          className={`px-4 py-2 rounded-full border transition ${
            activeTab === "connectors"
              ? "bg-yellow-600 border-yellow-400"
              : "bg-gray-800 border-gray-600 hover:bg-gray-700"
          }`}
        >
          🤝 Top Connectors
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="animate-spin h-6 w-6 text-cyan-400" />
          <span className="ml-3 text-gray-400">Loading leaderboard...</span>
        </div>
      ) : (
        <>
          {activeTab === "skills" && (
            <Card className="bg-[#111] border border-gray-700">
              <CardHeader>
                <CardTitle className="text-cyan-400">🏆 Top Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="p-2">Rank</th>
                      <th className="p-2">Skill</th>
                      <th className="p-2 text-right">Endorsements</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skills.map((s, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-800 hover:bg-gray-800/40 transition"
                      >
                        <td className="p-2 text-gray-500">{i + 1}</td>
                        <td className="p-2 capitalize">{s.skill}</td>
                        <td className="p-2 text-right text-yellow-400 animate-fade-in">
                          {s.endorsement_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {activeTab === "connectors" && (
            <Card className="bg-[#111] border border-gray-700">
              <CardHeader>
                <CardTitle className="text-yellow-400">
                  🤝 Top Connectors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="p-2">Rank</th>
                      <th className="p-2">Name</th>
                      <th className="p-2 text-right">Endorsements Given</th>
                    </tr>
                  </thead>
                  <tbody>
                    {connectors.map((c, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-800 hover:bg-gray-800/40 transition"
                      >
                        <td className="p-2 text-gray-500">{i + 1}</td>
                        <td className="p-2 capitalize">{c.user_name}</td>
                        <td className="p-2 text-right text-cyan-400 animate-fade-in">
                          {c.total_given}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
