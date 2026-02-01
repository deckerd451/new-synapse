import { useEffect, useState } from 'react';
import { CircularRing } from '@/components/innovation360/CircularRing';
import { StageDetail } from '@/components/innovation360/StageDetail';
import { ProjectSidebar } from '@/components/innovation360/ProjectSidebar';
import { useInnovation360Store } from '@/stores/innovation360Store';
import { Button } from '@/components/ui/button';
import { Menu, X, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Innovation360Page() {
  const {
    selectedStageId,
    setSelectedStage,
    isRingRotating,
    setRingRotating,
  } = useInnovation360Store();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ESC key to close detail view
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedStageId) {
        setSelectedStage(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedStageId, setSelectedStage]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-pink-500 rounded-lg" />
            <div>
              <h1 className="text-lg font-bold text-foreground">MUSC Innovation 360°</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Human-Centered Design Program
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRingRotating(!isRingRotating)}
            className="hidden sm:flex"
          >
            {isRingRotating ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause Rotation
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Auto Rotate
              </>
            )}
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-full pt-16">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute lg:relative z-30 h-full w-80 border-r border-border bg-background shadow-xl lg:shadow-none"
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
              onStageClick={(stageId) => setSelectedStage(stageId)}
            />
          </div>

          {/* Background Decoration */}
          <div className="absolute inset-0 pointer-events-none opacity-5">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-cyan-500/20 via-transparent to-transparent rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-pink-500/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse" />
          </div>
        </div>
      </div>

      {/* Stage Detail Modal */}
      {selectedStageId && (
        <StageDetail
          stageId={selectedStageId}
          onClose={() => setSelectedStage(null)}
        />
      )}

      {/* Instructions Overlay (for first-time users) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
      >
        <div className="bg-background/90 backdrop-blur-sm border border-border rounded-full px-6 py-3 shadow-lg">
          <p className="text-sm text-muted-foreground text-center">
            Click any stage to learn more • Select a project to track progress
          </p>
        </div>
      </motion.div>
    </div>
  );
}
