import { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { StageNode } from './StageNode';
import { INNOVATION_STAGES } from '@/types/innovation360';
import { useInnovation360Store } from '@/stores/innovation360Store';

interface CircularRingProps {
  radius?: number;
  onStageClick?: (stageId: number) => void;
}

export function CircularRing({ radius = 280, onStageClick }: CircularRingProps) {
  const controls = useAnimation();
  const ringRef = useRef<HTMLDivElement>(null);

  const {
    selectedStageId,
    isRingRotating,
    currentRotation,
    setRotation,
    projects,
    activeProjectId,
  } = useInnovation360Store();

  const activeProject = projects.find((p) => p.id === activeProjectId);

  // Auto-rotate functionality
  useEffect(() => {
    if (isRingRotating) {
      const animate = async () => {
        await controls.start({
          rotate: currentRotation + 360,
          transition: {
            duration: 20,
            ease: 'linear',
            repeat: Infinity,
          },
        });
      };
      animate();
    } else {
      controls.stop();
    }
  }, [isRingRotating, controls, currentRotation]);

  const handleStageClick = (stageId: number) => {
    if (selectedStageId === stageId) {
      // Deselect if clicking the same stage
      onStageClick?.(null);
    } else {
      onStageClick?.(stageId);
    }
  };

  // Calculate angle for each stage (starting at top, going clockwise)
  const getAngleForStage = (stageId: number) => {
    // Start at top (-90 degrees) and distribute evenly
    const angleStep = 360 / INNOVATION_STAGES.length;
    return -90 + (stageId - 1) * angleStep;
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Central Logo/Title */}
      <motion.div
        className="absolute z-10 flex flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-500 via-amber-500 to-pink-500 bg-clip-text text-transparent mb-2">
            MUSC
          </h1>
          <h2 className="text-5xl font-bold text-foreground mb-2">
            Innovation 360°
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Your journey from discovery to deployment
          </p>

          {/* Active Project Indicator */}
          {activeProject && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20"
            >
              <p className="text-xs text-muted-foreground">Active Project</p>
              <p className="text-sm font-semibold text-foreground">{activeProject.name}</p>
              <p className="text-xs text-primary">Stage {activeProject.currentStage}</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Circular Background Ring */}
      <motion.div
        ref={ringRef}
        className="absolute"
        style={{
          width: radius * 2 + 200,
          height: radius * 2 + 200,
        }}
        animate={controls}
      >
        {/* Decorative Circle */}
        <svg
          className="absolute inset-0"
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          {/* Outer Ring */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-border opacity-30"
            strokeDasharray="10 10"
          />

          {/* Inner Ring */}
          <circle
            cx="50%"
            cy="50%"
            r={radius - 20}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-border opacity-20"
          />

          {/* Progress Ring for Active Project */}
          {activeProject && (
            <motion.circle
              cx="50%"
              cy="50%"
              r={radius}
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              className="opacity-80"
              initial={{ pathLength: 0 }}
              animate={{
                pathLength: activeProject.completedStages.length / INNOVATION_STAGES.length,
              }}
              transition={{ duration: 1, ease: 'easeInOut' }}
              style={{
                transformOrigin: 'center',
                transform: 'rotate(-90deg)',
              }}
              strokeDasharray="1 1"
            />
          )}

          {/* Gradient Definition */}
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0EA5E9" />
              <stop offset="33%" stopColor="#FFC107" />
              <stop offset="66%" stopColor="#E91E63" />
              <stop offset="100%" stopColor="#FF6B35" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Stage Nodes */}
      <div className="absolute inset-0">
        {INNOVATION_STAGES.map((stage) => {
          const angle = getAngleForStage(stage.id);
          const isSelected = selectedStageId === stage.id;
          const isActive = activeProject?.currentStage === stage.id;
          const isCompleted = activeProject?.completedStages.includes(stage.id);

          return (
            <StageNode
              key={stage.id}
              stage={stage}
              angle={angle}
              radius={radius}
              isSelected={isSelected}
              isActive={isActive}
              isCompleted={isCompleted}
              onClick={() => handleStageClick(stage.id)}
            />
          );
        })}
      </div>

      {/* Connection Lines between stages (optional - can be enabled later) */}
      {activeProject && (
        <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
          {activeProject.completedStages.map((stageId, index) => {
            if (index === 0) return null;
            const prevStageId = activeProject.completedStages[index - 1];
            const angle1 = getAngleForStage(prevStageId);
            const angle2 = getAngleForStage(stageId);

            const x1 = Math.cos((angle1 * Math.PI) / 180) * radius;
            const y1 = Math.sin((angle1 * Math.PI) / 180) * radius;
            const x2 = Math.cos((angle2 * Math.PI) / 180) * radius;
            const y2 = Math.sin((angle2 * Math.PI) / 180) * radius;

            return (
              <motion.line
                key={`${prevStageId}-${stageId}`}
                x1={`calc(50% + ${x1}px)`}
                y1={`calc(50% + ${y1}px)`}
                x2={`calc(50% + ${x2}px)`}
                y2={`calc(50% + ${y2}px)`}
                stroke="#10b981"
                strokeWidth="3"
                strokeDasharray="5 5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.4 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              />
            );
          })}
        </svg>
      )}
    </div>
  );
}
