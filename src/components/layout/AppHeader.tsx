import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { LogOut, Bell, Check, X } from "lucide-react";
import { Toaster, toast } from "@/components/ui/sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Connection } from "@shared/types";

// 🔔 Notifications Popover Component
function NotificationsPopover() {
  const notifications = useAuthStore((s) => s.notifications);
  const handleConnectionRequest = useAuthStore((s) => s.handleConnectionRequest);

  const onAccept = (connection: Connection) => {
    handleConnectionRequest(connection, "accepted");
    toast.success("Connection accepted!");
  };

  const onDecline = (connection: Connection) => {
    handleConnectionRequest(connection, "declined");
    toast.info("Connection declined.");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-foreground/80 hover:text-cyan"
        >
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className="absolute top-1 right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan text-xs items-center justify-center text-background">
                {notifications.length}
              </span>
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 mr-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none text-gold">
              Connection Requests
            </h4>
            <p className="text-sm text-muted-foreground">
              You have {notifications.length} pending request
              {notifications.length !== 1 ? "s" : ""}.
            </p>
          </div>

          <div className="grid gap-2">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={notif.profiles.image_url || undefined} />
                      <AvatarFallback>
                        {notif.profiles.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {notif.profiles.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-green-400 hover:bg-green-400/10 hover:text-green-400"
                      onClick={() => onAccept(notif)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-400 hover:bg-red-400/10 hover:text-red-400"
                      onClick={() => onDecline(notif)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No new notifications.
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// 🧭 Main Header Component
export function AppHeader() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);

  const handleLogout = async () => {
    try {
      await signOut(); // Clears session from Supabase + store
      toast.info("You have been signed out.");
      navigate("/login", { replace: true }); // ✅ Redirects to login
    } catch (err: any) {
      console.error("❌ Error signing out:", err);
      toast.error("Sign out failed.");
    }
  };

  return (
    <>
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <h1
            onClick={() => navigate("/network")}
            className="text-2xl font-bold text-gold font-display cursor-pointer hover:text-gold/90 transition"
          >
            Synapse Link
          </h1>

          <div className="flex items-center gap-4">
            {profile ? (
              <>
                <NotificationsPopover />
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {profile.email}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-gold/50 text-gold/80 hover:bg-gold/10 hover:text-gold"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Not authenticated
              </p>
            )}
          </div>
        </div>
      </header>

      <Toaster theme="dark" richColors />
    </>
  );
}
