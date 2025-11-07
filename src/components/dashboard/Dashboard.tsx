// This is a modified version of the Dashboard component from the original Synapse Link project.
// The primary change is to make the "Profile" tab navigate to the dedicated `/profile` route
// instead of simply selecting the ProfileTab within the dashboard.  This ensures that users
// visiting the Profile tab are taken to the persistent profile editor rather than the old
// inline tab.  The rest of the component remains functionally the same.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileTab } from "./ProfileTab";
import { SearchTab } from "./SearchTab";
import { LeaderboardTab } from "./LeaderboardTab";
import { SynapseTab } from "./SynapseTab";
import { User, Search, Trophy, Zap } from "lucide-react";

interface DashboardProps {
  /**
   * When provided, this tab will be selected initially.  Valid values include
   * "profile", "search", "leaderboards", and "synapse".  Defaults to "profile".
   */
  defaultTab?: string;
}

export function Dashboard({ defaultTab = "profile" }: DashboardProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  // useNavigate hook to allow routing when a tab should navigate to a separate page
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-muted/50">
          {/*
            The Profile tab normally switches to the ProfileTab within the dashboard.  However,
            we want clicking on "Profile" in the tab list to navigate to the dedicated `/profile`
            route instead of simply selecting the tab.  We still render the ProfileTab in
            TabsContent below so that deep linking and defaultTab logic continue to work, but
            the onClick handler will redirect to /profile on click.  Without the handler the
            component would just set the active tab.
          */}
          <TabsTrigger
            value="profile"
            onClick={() => {
              // Navigate to the dedicated profile route
              navigate("/profile");
            }}
          >
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
