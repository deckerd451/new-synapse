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
    <div className="mobile-innovation-layout">
      {/* Header */}
      <header className="mobile-innovation-header">
        <div className="mobile-innovation-header-content">
          <div className="mobile-innovation-title-group">
            <div className="mobile-innovation-logo" />
            <h1 className="mobile-innovation-title">
              MUSC Innovation 360°
            </h1>
          </div>

          <button
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              updateLastInteraction();
            }}
            className="mobile-innovation-icon-button lg:hidden"
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <div className="mobile-innovation-theme-toggle">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <div className="mobile-innovation-main">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="mobile-innovation-sidebar"
            >
              <ProjectSidebar onClose={() => setSidebarOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Circular Ring Visualization */}
        <div className="mobile-innovation-viz-container">
          <div className="w-full h-full">
            <CircularRing
              onStageClick={(stageId) => {
                setSelectedStage(stageId);
                updateLastInteraction();
              }}
            />
          </div>

          {/* Subtle Background Decoration */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] -z-10">
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
