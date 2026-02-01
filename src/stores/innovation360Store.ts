import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { InnovationProject } from '@/types/innovation360';

interface Innovation360State {
  // UI State
  selectedStageId: number | null;
  isRingRotating: boolean;
  currentRotation: number;

  // Animation & Interaction State
  interactionContext: 'ring' | 'sidebar' | null;
  lastInteractionTime: number;
  isOrientationAnimating: boolean;
  justAdvancedStage: boolean;

  // Project Management
  projects: InnovationProject[];
  activeProjectId: string | null;
  hoveredProjectId: string | null;

  // Actions
  setSelectedStage: (stageId: number | null) => void;
  setRingRotating: (rotating: boolean) => void;
  setRotation: (degrees: number) => void;

  // Interaction Actions
  setInteractionContext: (context: 'ring' | 'sidebar' | null) => void;
  updateLastInteraction: () => void;
  setOrientationAnimating: (animating: boolean) => void;
  setJustAdvancedStage: (advanced: boolean) => void;

  // Project Actions
  addProject: (project: Omit<InnovationProject, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<InnovationProject>) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;
  setHoveredProject: (id: string | null) => void;
  advanceProjectStage: (projectId: string, stageId: number) => void;
}

export const useInnovation360Store = create<Innovation360State>()(
  persist(
    (set, get) => ({
      // Initial UI State
      selectedStageId: null,
      isRingRotating: false,
      currentRotation: 0,

      // Animation & Interaction State
      interactionContext: null,
      lastInteractionTime: Date.now(),
      isOrientationAnimating: false,
      justAdvancedStage: false,

      // Initial Project State
      projects: [
        {
          id: 'demo-1',
          name: 'AI-Powered Diagnostic Assistant',
          description: 'Machine learning system to assist radiologists in detecting early-stage lung cancer from CT scans.',
          currentStage: 3,
          completedStages: [1, 2],
          createdAt: new Date('2025-01-15').toISOString(),
          updatedAt: new Date('2026-01-28').toISOString(),
          team: ['Dr. Sarah Chen', 'Dr. Michael Torres'],
          tags: ['AI', 'Radiology', 'Cancer Detection'],
        },
        {
          id: 'demo-2',
          name: 'Smart Insulin Pump',
          description: 'Wearable device with predictive algorithms for automated insulin delivery in Type 1 diabetes patients.',
          currentStage: 7,
          completedStages: [1, 2, 3, 4, 5, 6],
          createdAt: new Date('2024-09-20').toISOString(),
          updatedAt: new Date('2026-01-30').toISOString(),
          team: ['Dr. James Wilson', 'Dr. Emily Rodriguez', 'Alex Kim'],
          tags: ['Medical Device', 'Diabetes', 'IoT'],
        },
        {
          id: 'demo-3',
          name: 'Virtual Reality Pain Management',
          description: 'Immersive VR therapy system for chronic pain management without opioids.',
          currentStage: 11,
          completedStages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          createdAt: new Date('2023-06-10').toISOString(),
          updatedAt: new Date('2026-02-01').toISOString(),
          team: ['Dr. Linda Park', 'Tom Anderson', 'Dr. Kevin Zhang'],
          tags: ['VR', 'Pain Management', 'Digital Health'],
        },
      ],
      activeProjectId: null,
      hoveredProjectId: null,

      // UI Actions
      setSelectedStage: (stageId) => set({ selectedStageId: stageId }),
      setRingRotating: (rotating) => set({ isRingRotating: rotating }),
      setRotation: (degrees) => set({ currentRotation: degrees }),

      // Interaction Actions
      setInteractionContext: (context) => set({ interactionContext: context, lastInteractionTime: Date.now() }),
      updateLastInteraction: () => set({ lastInteractionTime: Date.now(), isRingRotating: false }),
      setOrientationAnimating: (animating) => set({ isOrientationAnimating: animating }),
      setJustAdvancedStage: (advanced) => set({ justAdvancedStage: advanced }),

      // Project Actions
      addProject: (projectData) => {
        const newProject: InnovationProject = {
          ...projectData,
          id: `project-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          projects: [...state.projects, newProject],
        }));
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id
              ? { ...project, ...updates, updatedAt: new Date().toISOString() }
              : project
          ),
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== id),
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        }));
      },

      setActiveProject: (id) => set({ activeProjectId: id }),
      setHoveredProject: (id) => set({ hoveredProjectId: id }),

      advanceProjectStage: (projectId, stageId) => {
        const { projects } = get();
        const project = projects.find((p) => p.id === projectId);
        if (!project) return;

        const updatedCompletedStages = [...new Set([...project.completedStages, project.currentStage])];

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  currentStage: stageId,
                  completedStages: updatedCompletedStages,
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
          justAdvancedStage: true,
        }));

        // Reset animation state after animation completes
        setTimeout(() => {
          set({ justAdvancedStage: false });
        }, 600);
      },
    }),
    {
      name: 'innovation360-storage',
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
      }),
    }
  )
);
