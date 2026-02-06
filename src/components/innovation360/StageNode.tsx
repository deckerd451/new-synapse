import { motion } from 'framer-motion';
import { DEPARTMENT_COLORS, INNOVATION_STAGES, type Innovation360Stage } from '@/types/innovation360';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface StageNodeProps {
  stage: Innovation360Stage;
  isSelected: boolean;
  isActive?: boolean;
  isCompleted?: boolean;
  onClick: () => void;
  angle: number;
  radius: number;
  shouldPulse?: boolean;
  justCompleted?: boolean;
  hasActiveProject: boolean; // NEW: indicates if any project is selected
}

export function StageNode({
  stage,
  isSelected,
  isActive,
  isCompleted,
  onClick,
  angle,
  radius,
  shouldPulse = false,
  justCompleted = false,
  hasActiveProject,
}: StageNodeProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate position on circle
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;

  const color = DEPARTMENT_COLORS[stage.department];

  // Determine stage status for rendering
  // CRITICAL: Mutually exclusive states
  const stageStatus = (() => {
    if (!hasActiveProject) return 'neutral'; // Initial state: all dashed
    if (isCompleted || isActive) return 'reached'; // Solid
    return 'pending'; // Dashed
  })();

  // Visual properties based on status - responsive sizing
  const getBaseSize = () => {
    const width = window.innerWidth;
    if (width < 640) return 50; // Mobile
    if (width < 1024) return 60; // Tablet
    return 70; // Desktop
  };

  const baseSize = getBaseSize();
  let nodeSize = baseSize;
  if (isActive && hasActiveProject) nodeSize = baseSize * 1.25;
  if (isSelected) nodeSize = baseSize * 1.4;

  // Determine if this circle should be dashed
  const isDashed = stageStatus === 'neutral' || stageStatus === 'pending';

  // Determine if this circle should be filled
  const isFilled = stageStatus === 'reached';

  // Get stage context for tooltip
  const stageContext = getStageContext(stage.id);

  return (
    <motion.div
      className="absolute cursor-pointer group"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay: stage.id * 0.03,
      }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tooltip */}
      {isHovered && !isSelected && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute z-50 px-2 sm:px-3 py-1.5 sm:py-2 bg-popover border border-border rounded-lg shadow-lg pointer-events-none max-w-[200px] sm:max-w-[220px]"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            top: nodeSize / 2 + 12,
          }}
        >
          <p className="text-[10px] sm:text-xs font-semibold text-foreground mb-0.5 sm:mb-1 leading-tight">
            {stage.title}
          </p>
          <p className="text-[9px] sm:text-[10px] text-muted-foreground mb-1 line-clamp-2 leading-snug">
            {stage.description.split('.')[0]}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wide">
              {stage.department}
            </span>
          </div>
          {stageContext.deliverables && (
            <p className="text-[8px] sm:text-[9px] text-muted-foreground mt-0.5 sm:mt-1 italic leading-tight">
              {stageContext.deliverables}
            </p>
          )}
        </motion.div>
      )}

      {/* Stage Node Circle - SINGLE SOURCE OF TRUTH */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full transition-all duration-300',
          isSelected && 'ring-4 ring-white/40 ring-offset-4 ring-offset-background'
        )}
        style={{
          width: nodeSize,
          height: nodeSize,
          // Fill color based on status
          backgroundColor: isFilled ? color : 'transparent',
          // Border style: dashed or solid
          borderWidth: '3px',
          borderStyle: isDashed ? 'dashed' : 'solid',
          borderColor: color,
          // Opacity adjustments
          opacity: stageStatus === 'neutral' ? 0.4 : stageStatus === 'pending' ? 0.5 : isCompleted ? 0.75 : 1,
          transform: `translateX(-50%) translateY(-50%)`,
        }}
      >
        {/* Stage Number - only show on hover or selection */}
        {(isHovered || isSelected) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                'font-bold drop-shadow-lg transition-all',
                isFilled ? 'text-white' : 'text-muted-foreground',
                isSelected ? 'text-xl sm:text-2xl' : isActive ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
              )}
            >
              {stage.id}
            </span>
          </div>
        )}

        {/* Completed Checkmark - Only show for completed stages when project is active */}
        {isCompleted && hasActiveProject && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 bg-green-600 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center border-2 border-background shadow-md"
          >
            <svg
              className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}

        {/* Just Completed Animation */}
        {justCompleted && hasActiveProject && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              border: '3px solid #10b981',
            }}
            initial={{ scale: 1, opacity: 1 }}
            animate={{
              scale: 1.6,
              opacity: 0,
            }}
            transition={{
              duration: 0.5,
              ease: 'easeOut',
            }}
          />
        )}

        {/* Active Stage Pulse - Only when project is selected */}
        {isActive && shouldPulse && hasActiveProject && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              border: '3px solid white',
            }}
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.8, 0, 0.8],
            }}
            transition={{
              duration: 1.2,
              times: [0, 0.5, 1],
              repeat: 1,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Active Stage Glow - Persistent but subtle */}
        {isActive && hasActiveProject && isFilled && (
          <div
            className="absolute inset-0 rounded-full blur-md opacity-40"
            style={{
              backgroundColor: color,
              transform: 'scale(1.1)',
            }}
          />
        )}
      </div>
    </motion.div>
  );
}

// Stage context helper
function getStageContext(stageId: number): { deliverables?: string } {
  const contexts: Record<number, { deliverables?: string }> = {
    1: { deliverables: 'User research, needs assessment' },
    2: { deliverables: 'Market analysis, viability report' },
    3: { deliverables: 'Prototypes, user testing results' },
    4: { deliverables: 'Invention disclosure form' },
    5: { deliverables: 'Patent application, IP strategy' },
    6: { deliverables: 'Mentor matching, advisory plan' },
    7: { deliverables: 'Regulatory pathway, compliance plan' },
    8: { deliverables: 'Program enrollment, milestone plan' },
    9: { deliverables: 'Funding proposal, resource plan' },
    10: { deliverables: 'Working prototype, test results' },
    11: { deliverables: 'Clinical data, pilot outcomes' },
    12: { deliverables: 'Business plan, go-to-market strategy' },
  };
  return contexts[stageId] || {};
}
