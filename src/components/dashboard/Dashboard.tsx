// src/components/dashboard/Dashboard.tsx
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileTab } from "./ProfileTab";
import { SearchTab } from "./SearchTab";
import { LeaderboardTab } from "./LeaderboardTab";
import { SynapseTab } from "./SynapseTab";
import { User, Search, Trophy, Zap } from "lucide-react";

interface DashboardProps {
  defaultTab?: string;
}

export function Dashboard({ defaultTab = "profile" }: DashboardProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-muted/50">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" /> Profile
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search className="w-4 h-4 mr-2" /> Search
          </TabsTrigger>
          <TabsTrigger value="leaderboards">
            <Trophy className="w-4 h-4 mr-2" /> Leaderboards
          </TabsTrigger>
          <TabsTrigger value="synapse">
            <Zap className="w-4 h-4 mr-2" /> Synapse
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="search" className="mt-6">
          <SearchTab />
        </TabsContent>
        <TabsContent value="leaderboards" className="mt-6">
          <LeaderboardTab />
        </TabsContent>
        <TabsContent value="synapse" className="mt-6">
          <SynapseTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
