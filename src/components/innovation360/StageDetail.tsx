import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Users, Calendar, Tag } from 'lucide-react';
import { DEPARTMENT_COLORS, INNOVATION_STAGES, type Innovation360Stage } from '@/types/innovation360';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useInnovation360Store } from '@/stores/innovation360Store';
import { cn } from '@/lib/utils';

interface StageDetailProps {
  stageId: number | null;
  onClose: () => void;
}

export function StageDetail({ stageId, onClose }: StageDetailProps) {
  const { projects, activeProjectId, advanceProjectStage } = useInnovation360Store();

  const stage = stageId ? INNOVATION_STAGES.find((s) => s.id === stageId) : null;
  const activeProject = projects.find((p) => p.id === activeProjectId);

  if (!stage) return null;

  const color = DEPARTMENT_COLORS[stage.department];
  const isCurrentStage = activeProject?.currentStage === stageId;
  const isCompleted = activeProject?.completedStages.includes(stageId);
  const canAdvance = activeProject && !isCurrentStage && !isCompleted;

  const handleAdvanceToStage = () => {
    if (activeProject && canAdvance) {
      advanceProjectStage(activeProject.id, stageId);
    }
  };

  // Get projects at this stage
  const projectsAtStage = projects.filter((p) => p.currentStage === stageId);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <Card className="p-4 sm:p-6 border-2" style={{ borderColor: color }}>
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 sm:top-4 sm:right-4 h-8 w-8 sm:h-10 sm:w-10"
              onClick={onClose}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            {/* Header */}
            <div className="mb-4 sm:mb-6 pr-8 sm:pr-0">
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <motion.div
                  className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg"
                  style={{ backgroundColor: color }}
                  whileHover={{ scale: 1.05 }}
                >
                  {stage.id}
                </motion.div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold text-foreground mb-1 sm:mb-2 leading-tight">
                    {stage.title}
                  </h2>

                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                    <Badge
                      variant="outline"
                      className="font-semibold text-[10px] sm:text-xs"
                      style={{
                        borderColor: color,
                        color: color,
                      }}
                    >
                      {stage.department}
                    </Badge>
                  </div>

                  {stage.subLabel && (
                    <p className="text-xs sm:text-sm text-muted-foreground italic">
                      {stage.subLabel}
                    </p>
                  )}
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {isCompleted && (
                  <Badge variant="default" className="bg-green-500 text-xs">
                    ✓ Completed
                  </Badge>
                )}
                {isCurrentStage && (
                  <Badge variant="default" className="bg-blue-500 text-xs">
                    Current Stage
                  </Badge>
                )}
                {projectsAtStage.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {projectsAtStage.length} {projectsAtStage.length === 1 ? 'Project' : 'Projects'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-1.5 sm:mb-2">Description</h3>
              <p className="text-sm sm:text-base text-foreground leading-relaxed">
                {stage.description}
              </p>
            </div>

            {/* Active Project Info */}
            {activeProject && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2 sm:mb-3">Active Project</h3>
                <Card className="p-3 sm:p-4 bg-accent/50">
                  <h4 className="font-semibold text-sm sm:text-base text-foreground mb-1.5 sm:mb-2">
                    {activeProject.name}
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                    {activeProject.description}
                  </p>

                  <div className="flex flex-wrap gap-3 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
                    {activeProject.team && activeProject.team.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{activeProject.team.length} team members</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Updated {new Date(activeProject.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {activeProject.tags && activeProject.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                      <Tag className="w-3 h-3 text-muted-foreground" />
                      <div className="flex flex-wrap gap-1">
                        {activeProject.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] sm:text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {canAdvance && (
                    <Button
                      onClick={handleAdvanceToStage}
                      className="w-full mt-3 sm:mt-4 text-sm"
                      style={{ backgroundColor: color }}
                    >
                      Advance to This Stage
                    </Button>
                  )}
                </Card>
              </div>
            )}

            {/* Projects at this stage */}
            {projectsAtStage.length > 0 && (
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2 sm:mb-3">
                  Projects at This Stage
                </h3>
                <div className="space-y-2">
                  {projectsAtStage.map((project) => (
                    <Card
                      key={project.id}
                      className={cn(
                        'p-2.5 sm:p-3 cursor-pointer transition-all hover:shadow-md',
                        activeProjectId === project.id && 'ring-2 ring-primary'
                      )}
                    >
                      <h4 className="font-semibold text-xs sm:text-sm text-foreground mb-0.5 sm:mb-1">
                        {project.name}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Hint */}
            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border">
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                Click outside or press ESC to close
              </p>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
