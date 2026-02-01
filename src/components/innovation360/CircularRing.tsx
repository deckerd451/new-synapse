import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { StageNode } from './StageNode';
import { INNOVATION_STAGES } from '@/types/innovation360';
import { useInnovation360Store } from '@/stores/innovation360Store';
import { cn } from '@/lib/utils';

interface CircularRingProps {
  radius?: number;
  onStageClick?: (stageId: number) => void;
}

const IDLE_TIMEOUT = 15000; // 15 seconds before idle rotation starts

export function CircularRing({ radius = 280, onStageClick }: CircularRingProps) {
  const sweepControls = useAnimation();
  const ringRef = useRef<HTMLDivElement>(null);

  const {
    selectedStageId,
    isRingRotating,
    currentRotation,
    projects,
    activeProjectId,
    hoveredProjectId,
    interactionContext,
    lastInteractionTime,
    isOrientationAnimating,
    justAdvancedStage,
    setInteractionContext,
    updateLastInteraction,
    setOrientationAnimating,
  } = useInnovation360Store();

  // Display project: prioritize hovered over active
  const displayProjectId = hoveredProjectId || activeProjectId;
  const activeProject = projects.find((p) => p.id === displayProjectId);
  const [shouldPulse, setShouldPulse] = useState(false);
  const [prevActiveProjectId, setPrevActiveProjectId] = useState<string | null>(null);

  // Calculate angle for each stage (starting at top, going clockwise)
  const getAngleForStage = (stageId: number) => {
    const angleStep = 360 / INNOVATION_STAGES.length;
    return -90 + (stageId - 1) * angleStep;
  };

  // Orientation sweep animation when project is selected
  useEffect(() => {
    if (activeProject && activeProject.id !== prevActiveProjectId) {
      setPrevActiveProjectId(activeProject.id);
      setOrientationAnimating(true);
      setShouldPulse(false);

      const targetAngle = getAngleForStage(activeProject.currentStage);

      // Perform sweep animation
      sweepControls.start({
        rotate: [0, 360],
        transition: {
          duration: 1.2,
          ease: 'easeInOut',
        },
      }).then(() => {
        setOrientationAnimating(false);
        setShouldPulse(true);
        setTimeout(() => setShouldPulse(false), 1300);
      });
    }
  }, [activeProject?.id, activeProject?.currentStage]);


  const handleStageClick = (stageId: number) => {
    updateLastInteraction();
    setInteractionContext('ring');

    if (selectedStageId === stageId) {
      onStageClick?.(null);
    } else {
      onStageClick?.(stageId);
    }
  };

  const handleRingInteraction = () => {
    updateLastInteraction();
    setInteractionContext('ring');
  };

  // Get contextual subtitle based on active stage
  const getActiveStageContext = () => {
    if (!activeProject) return null;
    const stage = INNOVATION_STAGES.find((s) => s.id === activeProject.currentStage);
    if (!stage) return null;

    const verbs: Record<number, string> = {
      1: 'Discovering clinical needs',
      2: 'Validating market opportunity',
      3: 'Ideating solutions',
      4: 'Disclosing invention',
      5: 'Developing IP protection',
      6: 'Connecting with mentors',
      7: 'Mapping regulatory path',
      8: 'Accelerating development',
      9: 'Securing resources',
      10: 'Building and testing',
      11: 'Evaluating in clinic',
      12: 'Preparing to launch',
    };

    return {
      stage,
      verb: verbs[stage.id] || stage.title,
    };
  };

  const stageContext = getActiveStageContext();

  return (
    <div
      className="relative w-full h-full flex items-center justify-center transition-opacity duration-300"
      style={{ opacity: interactionContext === 'sidebar' ? 0.5 : 1 }}
      onMouseEnter={handleRingInteraction}
      onClick={handleRingInteraction}
    >
      {/* Central Content - Contextual */}
      <motion.div
        className="absolute z-10 flex flex-col items-center justify-center pointer-events-none"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
      >
        <div className="text-center max-w-xs">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 via-amber-500 to-pink-500 bg-clip-text text-transparent mb-1">
            Innovation 360°
          </h1>

          <AnimatePresence mode="wait">
            {stageContext ? (
              <motion.div
                key={`context-${activeProject?.id}-${activeProject?.currentStage}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mt-3"
              >
                <p className="text-sm text-muted-foreground mb-1">
                  Stage {stageContext.stage.id} of 12
                </p>
                <p className="text-base font-medium text-foreground">
                  {stageContext.verb}
                </p>
                {activeProject && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    {activeProject.name}
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="no-project"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2"
              >
                <p className="text-sm text-muted-foreground">
                  Select a project to begin
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Orientation Sweep Indicator */}
      {isOrientationAnimating && (
        <motion.div
          className="absolute"
          style={{
            width: radius * 2,
            height: radius * 2,
          }}
          animate={sweepControls}
        >
          <svg className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="sweepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="currentColor" stopOpacity="0.6" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              fill="none"
              stroke="url(#sweepGradient)"
              strokeWidth="4"
              strokeDasharray={`${Math.PI * radius * 0.15} ${Math.PI * radius * 2}`}
              className="text-primary"
            />
          </svg>
        </motion.div>
      )}

      {/* Circular Background Rings */}
      <div
        className="absolute"
        style={{
          width: radius * 2 + 200,
          height: radius * 2 + 200,
        }}
      >
        <svg className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
          {/* Outer reference ring */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-border opacity-20"
          />

          {/* Progress Arc - cumulative, not animated unless changing */}
          {activeProject && (
            <motion.circle
              cx="50%"
              cy="50%"
              r={radius - 8}
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              className="opacity-60"
              initial={false}
              animate={{
                strokeDashoffset: (1 - activeProject.completedStages.length / INNOVATION_STAGES.length) * (2 * Math.PI * (radius - 8)),
              }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              style={{
                transformOrigin: 'center',
                transform: 'rotate(-90deg)',
                strokeDasharray: 2 * Math.PI * (radius - 8),
              }}
            />
          )}

          {/* Gradient Definition */}
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.8" />
              <stop offset="33%" stopColor="#FFC107" stopOpacity="0.8" />
              <stop offset="66%" stopColor="#E91E63" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Stage Nodes */}
      <div className="absolute inset-0">
        {INNOVATION_STAGES.map((stage) => {
          const angle = getAngleForStage(stage.id);
          const isSelected = selectedStageId === stage.id;
          const isActive = activeProject?.currentStage === stage.id;
          const isCompleted = activeProject?.completedStages.includes(stage.id);
          const justCompleted = justAdvancedStage && isCompleted && activeProject?.completedStages[activeProject.completedStages.length - 1] === stage.id;

          return (
            <StageNode
              key={stage.id}
              stage={stage}
              angle={angle}
              radius={radius}
              isSelected={isSelected}
              isActive={isActive}
              isCompleted={isCompleted}
              shouldPulse={shouldPulse && isActive}
              justCompleted={justCompleted}
              hasActiveProject={!!activeProject}
              onClick={() => handleStageClick(stage.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
