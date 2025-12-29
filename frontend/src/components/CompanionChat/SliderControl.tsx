'use client';

interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

export function SliderControl({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  description,
}: SliderControlProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  const sliderId = `slider-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <label 
          htmlFor={sliderId}
          className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
        <span 
          className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 min-w-[2.5rem] text-right"
          aria-live="polite"
          aria-atomic="true"
        >
          {value}
        </span>
      </div>
      {description && (
        <p 
          id={`${sliderId}-description`}
          className="text-xs text-slate-500 dark:text-slate-400 mb-2 hidden sm:block"
        >
          {description}
        </p>
      )}
      <div className="relative">
        <input
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 sm:h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          style={{
            background: `linear-gradient(to right, rgb(37, 99, 235) 0%, rgb(37, 99, 235) ${percentage}%, rgb(226, 232, 240) ${percentage}%, rgb(226, 232, 240) 100%)`,
          }}
          aria-label={label}
          aria-describedby={description ? `${sliderId}-description` : undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />
        <style jsx>{`
          .slider-thumb::-webkit-slider-thumb {
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: rgb(37, 99, 235);
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
            transition: transform 0.1s ease;
          }
          .slider-thumb::-webkit-slider-thumb:hover {
            transform: scale(1.1);
          }
          .slider-thumb::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: rgb(37, 99, 235);
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
            transition: transform 0.1s ease;
          }
          .slider-thumb::-moz-range-thumb:hover {
            transform: scale(1.1);
          }
        `}</style>
      </div>
    </div>
  );
}
