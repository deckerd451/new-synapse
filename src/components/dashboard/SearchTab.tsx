import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@shared/types';

export function SearchTab() {
  const [searchType, setSearchType] = useState<'name' | 'skills'>('name');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 🧠 Get current user
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // 🔍 Search by name or skills
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.info('Please enter a search term');
      return;
    }
    setLoading(true);

    const column = searchType === 'name' ? 'name' : 'interests';
    const { data, error } = await supabase
      .from('community')
      .select('*')
      .ilike(column, `%${query}%`)
      .limit(20);

    if (error) toast.error(error.message);
    else setResults(data || []);
    setLoading(false);
  };

  // 🧩 Load all existing connections for the user
  const fetchConnections = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('connections')
      .select('from_user_id, to_user_id, status')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);

    if (error) console.error(error);
    else setConnections(data || []);
  };

  useEffect(() => {
    fetchConnections();
  }, [user]);

  // ⚡ Create a connection
  const handleConnect = async (target: any) => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    const toId = target.user_id || target.id;
    const existing = connections.find(
      (c) =>
        (c.from_user_id === user.id && c.to_user_id === toId) ||
        (c.from_user_id === toId && c.to_user_id === user.id)
    );

    if (existing) {
      toast.info(`Already ${existing.status || 'connected'}`);
      return;
    }

    const { error } = await supabase.from('connections').insert({
      from_user_id: user.id,
      to_user_id: toId,
      type: 'generic',
      status: 'pending',
    });

    if (error) toast.error(error.message);
    else {
      toast.success(`Connection request sent to ${target.name}`);
      fetchConnections();
    }
  };

  // 🧩 Helper to get connection status
  const getConnectionStatus = (target: any) => {
    const toId = target.user_id || target.id;
    const match = connections.find(
      (c) =>
        (c.from_user_id === user?.id && c.to_user_id === toId) ||
        (c.to_user_id === user?.id && c.from_user_id === toId)
    );
    return match?.status || 'none';
  };

  return (
    <div className="p-6 text-white">
      <div className="mb-6 flex flex-col items-center gap-4">
        <h2 className="text-2xl font-bold text-blue-400">Find Connections</h2>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((person) => {
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
                <p className="mb-2 text-gray-500 text-sm">
                  {person.interests || 'No bio available.'}
                </p>
                {status === 'none' ? (
                  <Button
                    className="bg-blue-500 hover:bg-blue-600 w-full"
                    onClick={() => handleConnect(person)}
                  >
                    <i className="fa-solid fa-user-plus mr-2" /> Connect
                  </Button>
                ) : (
                  <Button
                    className={`w-full ${
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
