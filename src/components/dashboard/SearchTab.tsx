import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@shared/types';

export function SearchTab() {
  const [searchType, setSearchType] = useState<'name' | 'skills'>('name');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [endorsed, setEndorsed] = useState<{ [key: string]: string[] }>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.info('Please enter a search term');
      return;
    }

    setLoading(true);
    const column = searchType === 'name' ? 'name' : 'skills';
    const { data, error } = await supabase
      .from('community')
      .select('*')
      .ilike(column, `%${query}%`)
      .limit(24);

    if (error) toast.error(error.message);
    else setResults(data || []);
    setLoading(false);
  };

  const fetchConnections = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('connections')
      .select('from_user_id, to_user_id, status')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);
    if (!error && data) setConnections(data);
  };

  useEffect(() => {
    fetchConnections();
  }, [user]);

  const handleConnect = async (target: any) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        toast.error("Please log in first");
        return;
      }

      const user = authData.user;

      const { data: sourceProfile, error: sourceError } = await supabase
        .from("community")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();

      if (sourceError) throw sourceError;
      if (!sourceProfile) {
        toast.error("Your community profile is missing.");
        return;
      }

      const toId = target.id || target.user_id;
      if (!toId) {
        toast.error("Target user not found.");
        return;
      }

      const { data: existing, error: checkError } = await supabase
        .from("connections")
        .select("*")
        .or(`from_user_id.eq.${sourceProfile.id},to_user_id.eq.${sourceProfile.id}`)
        .or(`from_user_id.eq.${toId},to_user_id.eq.${toId}`)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) {
        toast.info("You are already connected or pending.");
        return;
      }

      const { error: insertError } = await supabase.from("connections").insert({
        from_user_id: sourceProfile.id,
        to_user_id: toId,
        status: "pending",
        type: "generic",
        created_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      toast.success(`Connection request sent to ${target.name}!`);
      fetchConnections();
    } catch (err: any) {
      console.error("Connection error:", err);
      toast.error(err.message || "Failed to connect.");
    }
  };

  const handleEndorse = async (skill: string, target: any) => {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      toast.error("Please log in to endorse.");
      return;
    }

    const { data: sourceProfile, error: profileError } = await supabase
      .from("community")
      .select("id")
      .eq("email", authData.user.email)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!sourceProfile) {
      toast.error("Your community profile is missing.");
      return;
    }

    const fromId = sourceProfile.id;
    const toId = target.user_id || target.id;

    // NEW: check server-side for existing endorsement
    const { data: existing, error: checkError } = await supabase
      .from("endorsements")
      .select("id")
      .eq("endorsed_by_user_id", fromId)
      .eq("endorsed_user_id", toId)
      .eq("skill", skill)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) {
      toast.info(`You already endorsed ${target.name} for ${skill}.`);
      return;
    }

    const { error: insertError } = await supabase.from("endorsements").insert({
      endorsed_by_user_id: fromId,
      endorsed_user_id: toId,
      skill,
    });

    if (insertError) throw insertError;

    toast.success(`You endorsed ${target.name} for ${skill}!`);
    setEndorsed((prev) => ({
      ...prev,
      [toId]: [...(prev[toId] || []), skill],
    }));
  } catch (err: any) {
    console.error("Endorsement error:", err);
    toast.error(err.message || "Failed to endorse.");
  }
};


  const getConnectionStatus = (target: any) => {
    const toId = target.user_id || target.id;
    const match = connections.find(
      (c) =>
        (c.from_user_id === user?.id && c.to_user_id === toId) ||
        (c.to_user_id === user?.id && c.from_user_id === toId)
    );
    return match?.status || 'none';
  };

  const renderSkills = (profile: any) => {
    if (!profile.skills) return null;

    let skillsArray: string[] = [];
    if (typeof profile.skills === 'string') {
      try {
        skillsArray = JSON.parse(profile.skills);
      } catch {
        skillsArray = profile.skills.split(',').map((s: string) => s.trim());
      }
    } else if (Array.isArray(profile.skills)) {
      skillsArray = profile.skills;
    }

    return (
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {skillsArray.map((skill, i) => {
          const isEndorsed = endorsed[profile.id]?.includes(skill);
          return (
            <button
              key={i}
              onClick={() => handleEndorse(skill, profile)}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${
                isEndorsed
                  ? 'bg-green-600/60 border-green-400 text-white'
                  : 'bg-blue-700/40 border-blue-500 text-blue-200 hover:bg-blue-600/60'
              } transition`}
            >
              <Star className="h-3 w-3" />
              {skill}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 text-white">
      <div className="mb-6 flex flex-col items-center gap-4">
        <h2 className="text-2xl font-bold text-yellow-400">Find Connections</h2>
        <form onSubmit={handleSearch} className="flex gap-3 w-full max-w-lg">
          <select
            className="bg-black border border-gray-600 rounded p-2 text-white"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as 'name' | 'skills')}
          >
            <option value="name">By Name</option>
            <option value="skills">By Skills</option>
          </select>
          <Input
            placeholder={`Search ${searchType}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow border-yellow-400 text-white"
          />
          <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
            {loading ? <Loader2 className="animate-spin" /> : <Search />}
          </Button>
        </form>
      </div>

      {loading && (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-cyan" />
          <p className="ml-3 text-gray-400">Searching the network...</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {!loading &&
          results.map((person) => {
            const status = getConnectionStatus(person);
            return (
              <Card
                key={person.id}
                className="bg-[#111] border border-gray-700 text-center p-4"
              >
                <CardHeader>
                  <img
                    src={person.image_url || '/images/default-avatar.png'}
                    alt={person.name}
                    className="w-20 h-20 rounded-full mx-auto mb-3 border border-yellow-400"
                  />
                  <CardTitle className="text-yellow-400">{person.name}</CardTitle>
                  <p className="text-gray-400 text-sm">{person.email}</p>
                </CardHeader>
                <CardContent>
                  {renderSkills(person)}
                  {person.bio ? (
                    <p
                      className="text-gray-500 text-sm mt-3 cursor-pointer hover:text-gray-300 transition"
                      title={person.bio}
                      onClick={(e) => {
                        const p = e.currentTarget;
                        if (p.dataset.expanded === "true") {
                          p.innerText =
                            person.bio.length > 100
                              ? person.bio.slice(0, 100).trim() + "..."
                              : person.bio;
                          p.dataset.expanded = "false";
                        } else {
                          p.innerText = person.bio.trim();
                          p.dataset.expanded = "true";
                        }
                      }}
                    >
                      {person.bio.length > 100
                        ? person.bio.slice(0, 100).trim() + "..."
                        : person.bio}
                    </p>
                  ) : (
                    <p className="text-gray-600 text-sm mt-3 italic">No bio available.</p>
                  )}

                  {status === 'none' ? (
                    <Button
                      className="bg-blue-500 hover:bg-blue-600 w-full mt-4"
                      onClick={() => handleConnect(person)}
                    >
                      <i className="fa-solid fa-user-plus mr-2" /> Connect
                    </Button>
                  ) : (
                    <Button
                      className={`w-full mt-4 ${
                        status === 'accepted'
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-yellow-600 hover:bg-yellow-700'
                      }`}
                      disabled
                    >
                      {status === 'accepted' ? 'Connected' : 'Pending'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
