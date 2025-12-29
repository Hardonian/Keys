'use client';

import { useEffect, useState } from 'react';

interface ConfettiProps {
  trigger?: boolean;
  duration?: number;
  colors?: string[];
}

export function Confetti({ trigger = false, duration = 3000, colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'] }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; rotation: number; delay: number }>>([]);

  useEffect(() => {
    if (!trigger) return;

    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      delay: Math.random() * 500,
    }));

    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
    }, duration);

    return () => clearTimeout(timer);
  }, [trigger, duration, colors]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            animation: `confetti-fall ${duration}ms ease-out ${particle.delay}ms forwards`,
            transform: `rotate(${particle.rotation}deg)`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
