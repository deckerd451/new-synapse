import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronRight, Calendar, Users, Tag, Trash2, X } from 'lucide-react';
import { useInnovation360Store } from '@/stores/innovation360Store';
import { INNOVATION_STAGES } from '@/types/innovation360';
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
    setActiveProject,
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

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Projects</h2>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Innovation Project</DialogTitle>
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
                  placeholder="e.g., AI, Medical Device, Software"
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
              <p className="text-sm text-muted-foreground mb-2">No projects yet</p>
              <p className="text-xs text-muted-foreground">
                Create your first innovation project to get started
              </p>
            </div>
          ) : (
            projects.map((project) => {
              const currentStage = INNOVATION_STAGES.find((s) => s.id === project.currentStage);
              const isActive = activeProjectId === project.id;
              const progress = (project.completedStages.length / INNOVATION_STAGES.length) * 100;

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={cn(
                      'p-4 cursor-pointer transition-all hover:shadow-md',
                      isActive && 'ring-2 ring-primary shadow-lg'
                    )}
                    onClick={() => setActiveProject(isActive ? null : project.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1 pr-2">
                          {project.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleDeleteProject(project.id, e)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Current Stage */}
                    {currentStage && (
                      <div className="flex items-center gap-2 mb-3 text-xs">
                        <ChevronRight className="w-3 h-3 text-primary" />
                        <span className="font-medium text-primary">
                          Stage {currentStage.id}: {currentStage.title}
                        </span>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-cyan-500 via-amber-500 to-pink-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {project.team && project.team.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{project.team.length}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {project.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {project.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{project.tags.length - 3}
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
      <div className="p-4 border-t border-border bg-muted/50">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold text-foreground">{projects.length}</div>
            <div className="text-xs text-muted-foreground">Total Projects</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {projects.filter((p) => p.completedStages.length === INNOVATION_STAGES.length).length}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
