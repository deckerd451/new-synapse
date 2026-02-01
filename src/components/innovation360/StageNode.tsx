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
}: StageNodeProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate position on circle
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;

  const color = DEPARTMENT_COLORS[stage.department];

  // Determine visual state and size
  const baseSize = 70;
  const isFuture = !isActive && !isCompleted;

  let nodeSize = baseSize;
  if (isActive) nodeSize = baseSize * 1.25; // Active is larger
  if (isSelected) nodeSize = baseSize * 1.4; // Selected is largest

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
          className="absolute z-50 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg pointer-events-none"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            top: nodeSize / 2 + 16,
            width: '220px',
          }}
        >
          <p className="text-xs font-semibold text-foreground mb-1">{stage.title}</p>
          <p className="text-[10px] text-muted-foreground mb-1 line-clamp-2">
            {stage.description.split('.')[0]}
          </p>
          <div className="flex items-center gap-1 mt-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[9px] text-muted-foreground uppercase tracking-wide">
              {stage.department}
            </span>
          </div>
          {stageContext.deliverables && (
            <p className="text-[9px] text-muted-foreground mt-1 italic">
              {stageContext.deliverables}
            </p>
          )}
        </motion.div>
      )}

      {/* Stage Node Circle */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full transition-all duration-300 border-3',
          isSelected && 'ring-4 ring-white/40 ring-offset-4 ring-offset-background'
        )}
        style={{
          width: nodeSize,
          height: nodeSize,
          backgroundColor: isFuture ? 'transparent' : color,
          borderColor: color,
          borderStyle: 'solid',
          opacity: isFuture ? 0.5 : isCompleted ? 0.75 : 1,
          transform: `translateX(-50%) translateY(-50%)`,
        }}
      >
        {/* Stage Number - only show on hover or selection */}
        {(isHovered || isSelected) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                'font-bold drop-shadow-lg transition-all',
                isFuture ? 'text-muted-foreground' : 'text-white',
                isSelected ? 'text-2xl' : isActive ? 'text-xl' : 'text-lg'
              )}
            >
              {stage.id}
            </span>
          </div>
        )}

        {/* Completed Checkmark - Subtle */}
        {isCompleted && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute -top-1 -right-1 bg-green-600 rounded-full w-6 h-6 flex items-center justify-center border-2 border-background shadow-md"
          >
            <svg
              className="w-3.5 h-3.5 text-white"
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

        {/* Just Completed Animation - Brief celebration */}
        {justCompleted && (
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

        {/* Active Stage Pulse - Happens ONLY on project selection or stage advancement */}
        {isActive && shouldPulse && (
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
        {isActive && !isFuture && (
          <div
            className="absolute inset-0 rounded-full blur-md opacity-40"
            style={{
              backgroundColor: color,
              transform: 'scale(1.1)',
            }}
          />
        )}
      </div>

      {/* Stage Label removed - only shows on hover via tooltip */}
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
