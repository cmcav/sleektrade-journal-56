
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface ConfettiPieceProps {
  color: string;
  x: number;
  delay: number;
  size: number;
}

const ConfettiPiece = ({ color, x, delay, size }: ConfettiPieceProps) => {
  return (
    <motion.div
      className="absolute top-0 z-50"
      initial={{ y: -20, x, opacity: 0 }}
      animate={{
        y: ['0vh', '100vh'],
        opacity: [0, 1, 0.5, 0],
        rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
      }}
      transition={{
        duration: 2 + Math.random() * 2,
        delay: delay,
        ease: "easeOut",
      }}
      style={{ width: size, height: size }}
    >
      {Math.random() > 0.6 ? (
        <Sparkles
          style={{ color }}
          className="w-full h-full"
        />
      ) : (
        <div
          className="rounded-sm"
          style={{
            backgroundColor: color,
            width: '100%',
            height: '100%',
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      )}
    </motion.div>
  );
};

export interface ConfettiProps {
  show: boolean;
  onComplete?: () => void;
  duration?: number;
  particleCount?: number;
}

export function Confetti({
  show,
  onComplete,
  duration = 3000,
  particleCount = 50,
}: ConfettiProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Colors for the confetti
  const colors = [
    '#8B5CF6', // purple
    '#D946EF', // pink
    '#F97316', // orange 
    '#0EA5E9', // blue
    '#FEF7CD', // yellow
    '#E5DEFF', // light purple
    '#FFDEE2', // light pink
  ];

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) {
          onComplete();
        }
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: particleCount }).map((_, index) => (
        <ConfettiPiece
          key={index}
          color={colors[index % colors.length]}
          x={Math.random() * window.innerWidth}
          delay={Math.random() * 0.5}
          size={Math.random() * 10 + 5}
        />
      ))}
    </div>
  );
}
