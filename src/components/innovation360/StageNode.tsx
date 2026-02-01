import { motion } from 'framer-motion';
import { DEPARTMENT_COLORS, type Innovation360Stage } from '@/types/innovation360';
import { cn } from '@/lib/utils';

interface StageNodeProps {
  stage: Innovation360Stage;
  isSelected: boolean;
  isActive?: boolean;
  isCompleted?: boolean;
  onClick: () => void;
  angle: number;
  radius: number;
  scale?: number;
}

export function StageNode({
  stage,
  isSelected,
  isActive,
  isCompleted,
  onClick,
  angle,
  radius,
  scale = 1,
}: StageNodeProps) {
  // Calculate position on circle
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;

  const color = DEPARTMENT_COLORS[stage.department];

  // Determine node size based on state
  const baseSize = 80;
  const nodeSize = isSelected ? baseSize * 1.4 : isActive ? baseSize * 1.2 : baseSize;

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: scale,
        opacity: 1,
        x: isSelected ? 0 : 0,
        y: isSelected ? 0 : 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay: stage.id * 0.05,
      }}
      whileHover={{ scale: scale * 1.1 }}
      whileTap={{ scale: scale * 0.95 }}
      onClick={onClick}
    >
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full transition-all duration-300',
          'border-4',
          isSelected && 'ring-4 ring-white/50 ring-offset-4 ring-offset-background',
          isCompleted && 'ring-2 ring-green-500'
        )}
        style={{
          width: nodeSize,
          height: nodeSize,
          backgroundColor: color,
          borderColor: isActive ? '#fff' : color,
          transform: `translateX(-50%) translateY(-50%)`,
        }}
      >
        {/* Stage Number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            'font-bold text-white drop-shadow-lg',
            isSelected ? 'text-3xl' : 'text-xl'
          )}>
            {stage.id}
          </span>
        </div>

        {/* Completed Checkmark */}
        {isCompleted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-green-500 rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-lg"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}

        {/* Active Pulse */}
        {isActive && !isSelected && (
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-white"
            initial={{ scale: 1, opacity: 1 }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.8, 0, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </div>

      {/* Stage Label */}
      {!isSelected && (
        <motion.div
          className="absolute top-full mt-2 w-32 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: stage.id * 0.05 + 0.2 }}
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <p className="text-xs font-semibold text-foreground/90 leading-tight line-clamp-2">
            {stage.title}
          </p>
          {stage.subLabel && (
            <p className="text-[10px] text-muted-foreground mt-1 italic">
              {stage.subLabel}
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
