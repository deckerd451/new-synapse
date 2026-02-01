import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, Users, Trash2, X } from 'lucide-react';
import { useInnovation360Store } from '@/stores/innovation360Store';
import { INNOVATION_STAGES, DEPARTMENT_COLORS } from '@/types/innovation360';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ProjectSidebarProps {
  onClose?: () => void;
}

export function ProjectSidebar({ onClose }: ProjectSidebarProps) {
  const {
    projects,
    activeProjectId,
    interactionContext,
    setActiveProject,
    setHoveredProject,
    setInteractionContext,
    updateLastInteraction,
    addProject,
    deleteProject,
  } = useInnovation360Store();

  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    description: '',
    tags: '',
  });

  const handleCreateProject = () => {
    if (!newProjectForm.name.trim()) return;

    addProject({
      name: newProjectForm.name,
      description: newProjectForm.description,
      currentStage: 1,
      completedStages: [],
      team: [],
      tags: newProjectForm.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });

    setNewProjectForm({ name: '', description: '', tags: '' });
    setNewProjectDialogOpen(false);
  };

  const handleDeleteProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProject(projectId);
    }
  };

  const handleProjectClick = (projectId: string) => {
    updateLastInteraction();
    setInteractionContext('sidebar');
    setActiveProject(activeProjectId === projectId ? null : projectId);
  };

  const handleProjectHover = (projectId: string | null) => {
    // On hover, show project-specific state on the ring
    setHoveredProject(projectId);
  };

  const handleSidebarInteraction = () => {
    updateLastInteraction();
    setInteractionContext('sidebar');
  };

  return (
    <div
      className="flex flex-col h-full bg-background transition-opacity duration-300"
      style={{ opacity: interactionContext === 'ring' ? 0.5 : 1 }}
      onMouseEnter={handleSidebarInteraction}
      onClick={handleSidebarInteraction}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Projects</h2>
            <p className="text-xs text-muted-foreground">Track your innovation journey</p>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" size="sm" variant="default">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Innovation Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="e.g., AI Diagnostic Tool"
                  value={newProjectForm.name}
                  onChange={(e) =>
                    setNewProjectForm({ ...newProjectForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  placeholder="Describe your innovation..."
                  value={newProjectForm.description}
                  onChange={(e) =>
                    setNewProjectForm({ ...newProjectForm, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="project-tags">Tags (comma-separated)</Label>
                <Input
                  id="project-tags"
                  placeholder="e.g., AI, Medical Device"
                  value={newProjectForm.tags}
                  onChange={(e) =>
                    setNewProjectForm({ ...newProjectForm, tags: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleCreateProject} className="w-full">
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Project List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">No projects yet</p>
              <p className="text-xs text-muted-foreground">
                Create your first innovation project
              </p>
            </div>
          ) : (
            projects.map((project) => {
              const currentStage = INNOVATION_STAGES.find((s) => s.id === project.currentStage);
              const isActive = activeProjectId === project.id;
              const progress = (project.completedStages.length / INNOVATION_STAGES.length) * 100;
              const stageColor = currentStage ? DEPARTMENT_COLORS[currentStage.department] : '#888';

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                >
                  <Card
                    className={cn(
                      'p-4 cursor-pointer transition-all',
                      isActive
                        ? 'ring-2 ring-primary shadow-lg bg-accent/50'
                        : 'hover:shadow-md hover:bg-accent/20'
                    )}
                    onClick={() => handleProjectClick(project.id)}
                    onMouseEnter={() => handleProjectHover(project.id)}
                    onMouseLeave={() => handleProjectHover(null)}
                  >
                    {/* Project Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 pr-2">
                        <div className="flex items-center gap-2 mb-1">
                          {/* Stage color indicator */}
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: stageColor }}
                          />
                          <h3 className="font-semibold text-sm text-foreground leading-tight">
                            {project.name}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 ml-4">
                          {project.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                        onClick={(e) => handleDeleteProject(project.id, e)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Current Stage */}
                    {currentStage && (
                      <div className="mb-3 ml-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-medium" style={{ color: stageColor }}>
                            Stage {currentStage.id}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {currentStage.title}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                        <span className="font-medium">Progress</span>
                        <span>{project.completedStages.length} / {INNOVATION_STAGES.length}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(to right, #0EA5E9, #FFC107, #E91E63, #FF6B35)`,
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
                      {project.team && project.team.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{project.team.length}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(project.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                        {project.tags.length > 2 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            +{project.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold text-foreground">{projects.length}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Active</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {projects.filter((p) => p.completedStages.length === INNOVATION_STAGES.length).length}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Complete</div>
          </div>
        </div>
      </div>
    </div>
  );
}
