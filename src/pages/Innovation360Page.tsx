import { useEffect } from 'react';
import { CircularRing } from '@/components/innovation360/CircularRing';
import { StageDetail } from '@/components/innovation360/StageDetail';
import { ProjectSidebar } from '@/components/innovation360/ProjectSidebar';
import { useInnovation360Store } from '@/stores/innovation360Store';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useState } from 'react';

export default function Innovation360Page() {
  const {
    selectedStageId,
    setSelectedStage,
    updateLastInteraction,
  } = useInnovation360Store();

  // Sidebar open by default on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  // ESC key to close detail view
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedStageId) {
        setSelectedStage(null);
        updateLastInteraction();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedStageId, setSelectedStage, updateLastInteraction]);

  // Track any user interaction
  useEffect(() => {
    const handleInteraction = () => {
      updateLastInteraction();
    };

    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('scroll', handleInteraction);
    window.addEventListener('click', handleInteraction);

    return () => {
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, [updateLastInteraction]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-cyan-500 via-amber-500 to-pink-500 rounded-lg flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-foreground truncate">
                MUSC Innovation 360°
              </h1>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground hidden sm:block">
                Human-Centered Design Program
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              updateLastInteraction();
            }}
            className="lg:hidden flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
          >
            {sidebarOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
          </Button>
        </div>

        <ThemeToggle />
      </header>

      {/* Main Content */}
      <div className="flex h-full pt-12 sm:pt-14">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute lg:relative z-30 h-full w-[280px] sm:w-80 border-r border-border bg-background shadow-2xl lg:shadow-none"
            >
              <ProjectSidebar onClose={() => setSidebarOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Circular Ring Visualization */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <CircularRing
              onStageClick={(stageId) => {
                setSelectedStage(stageId);
                updateLastInteraction();
              }}
            />
          </div>

          {/* Subtle Background Decoration */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-cyan-500/30 via-transparent to-transparent rounded-full blur-3xl" />
          </div>
        </div>
      </div>

      {/* Stage Detail Modal */}
      {selectedStageId && (
        <StageDetail
          stageId={selectedStageId}
          onClose={() => {
            setSelectedStage(null);
            updateLastInteraction();
          }}
        />
      )}
    </div>
  );
}
