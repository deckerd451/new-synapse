import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, ServerCrash } from 'lucide-react';
import { UserCard } from './UserCard';
import { Profile } from '@shared/types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

export function SearchTab() {
  const [searchType, setSearchType] = useState<'name' | 'skills'>('name');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.info('Please enter a search query.');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);
    setResults([]);

    try {
      let data: Profile[] | null = [];

      if (searchType === 'name') {
        // 🔍 Search by name (case-insensitive)
        const { data: nameResults, error: nameError } = await supabase
          .from('community')
          .select('*')
          .ilike('name', `%${query}%`);

        if (nameError) throw nameError;
        data = nameResults;
      } else {
        // 🔍 Search by skills (matches any skill substring)
        const { data: skillsResults, error: skillsError } = await supabase
          .from('community')
          .select('*')
          .or(
            query
              .split(',')
              .map((skill) => `skills.cs.{${skill.trim()}}`)
              .join(',')
          );

        if (skillsError) throw skillsError;
        data = skillsResults;
      }

      setResults(data || []);
      if (!data || data.length === 0) {
        toast.info('No profiles found for your search.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred.');
      toast.error(err.message || 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-cyan/20 bg-background/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan">
            <Search />
            Find Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-grow flex items-center gap-2">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'name' | 'skills')}
                className="bg-input border border-border rounded-md px-3 h-10 text-sm"
              >
                <option value="name">By Name</option>
                <option value="skills">By Skills</option>
              </select>
              <Input
                placeholder={
                  searchType === 'name'
                    ? 'Enter a name...'
                    : 'e.g., react, node, python'
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-grow"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-cyan text-background hover:bg-cyan/90"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        {loading && (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 text-cyan animate-spin" />
            <p className="ml-4 text-muted-foreground">Searching the network...</p>
          </div>
        )}

        {error && (
          <div className="text-center p-8 bg-destructive/10 rounded-lg">
            <ServerCrash className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-destructive-foreground font-semibold">Search Failed</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {!loading && !error && searched && results.length === 0 && (
          <div className="text-center p-8">
            <p className="text-lg font-medium">No profiles found.</p>
            <p className="text-muted-foreground">Try a different search query.</p>
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {results.map((profile) => (
              <UserCard key={profile.id} profile={profile} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
