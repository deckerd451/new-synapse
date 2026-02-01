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

  const [sidebarOpen, setSidebarOpen] = useState(true);

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
      <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              updateLastInteraction();
            }}
            className="lg:hidden"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 via-amber-500 to-pink-500 rounded-lg" />
            <div>
              <h1 className="text-base font-bold text-foreground">MUSC Innovation 360°</h1>
              <p className="text-[10px] text-muted-foreground hidden sm:block">
                Human-Centered Design Program
              </p>
            </div>
          </div>
        </div>

        <ThemeToggle />
      </header>

      {/* Main Content */}
      <div className="flex h-full pt-14">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute lg:relative z-30 h-full w-80 border-r border-border bg-background shadow-2xl lg:shadow-none"
            >
              <ProjectSidebar onClose={() => setSidebarOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Circular Ring Visualization */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <CircularRing
              radius={280}
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
