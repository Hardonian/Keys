'use client';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  showPercentage?: boolean;
  color?: string;
  animated?: boolean;
}

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 8,
  label,
  showPercentage = true,
  color = 'rgb(37, 99, 235)',
  animated = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={animated ? 'transition-all duration-500 ease-out' : ''}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <span className="text-lg font-bold text-slate-900 dark:text-slate-50">{Math.round(progress)}%</span>
        )}
        {label && (
          <span className="text-xs text-slate-600 dark:text-slate-400 mt-1">{label}</span>
        )}
      </div>
    </div>
  );
}
