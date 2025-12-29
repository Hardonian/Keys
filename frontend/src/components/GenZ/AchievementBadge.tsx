'use client';

import { useState, useEffect } from 'react';

interface AchievementBadgeProps {
  achievement: {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt?: Date;
  };
  showAnimation?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AchievementBadge({ achievement, showAnimation = false, size = 'md' }: AchievementBadgeProps) {
  const [isAnimating, setIsAnimating] = useState(showAnimation);

  useEffect(() => {
    if (showAnimation) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showAnimation]);

  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-24 h-24 text-4xl',
  };

  return (
    <div
      className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 flex items-center justify-center shadow-lg transition-all ${
        isAnimating ? 'animate-bounce scale-110' : 'hover:scale-105'
      }`}
      title={`${achievement.name}: ${achievement.description}`}
    >
      <div className="text-2xl sm:text-3xl">{achievement.icon}</div>
      {isAnimating && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-pink-500 animate-ping opacity-75"></div>
      )}
      {achievement.unlockedAt && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
      )}
    </div>
  );
}
