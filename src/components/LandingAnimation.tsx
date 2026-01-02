import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import minedLogo from '@/assets/mined-logo.png';

interface LandingAnimationProps {
  onComplete: () => void;
}

export default function LandingAnimation({ onComplete }: LandingAnimationProps) {
  const [phase, setPhase] = useState<'blur' | 'logo' | 'glow' | 'fade'>('blur');

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('logo'), 500),
      setTimeout(() => setPhase('glow'), 1500),
      setTimeout(() => setPhase('fade'), 2800),
      setTimeout(() => onComplete(), 3500),
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.7 }}
      >
        {/* Animated Gradient Background */}
        <motion.div
          className="absolute inset-0 mined-gradient-bg"
          initial={{ filter: 'blur(0px)' }}
          animate={{ 
            filter: phase === 'fade' ? 'blur(20px)' : 'blur(0px)',
          }}
          transition={{ duration: 0.8 }}
        />

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-accent/40"
              initial={{ 
                x: Math.random() * window.innerWidth,
                y: window.innerHeight + 20,
                opacity: 0 
              }}
              animate={{ 
                y: -20,
                opacity: [0, 0.8, 0],
              }}
              transition={{ 
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          ))}
        </div>

        {/* Logo Container */}
        <div className="relative flex flex-col items-center">
          {/* Glow Effect */}
          <motion.div
            className="absolute w-48 h-48 rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(42 85% 55% / 0.4) 0%, transparent 70%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={phase === 'glow' || phase === 'fade' ? { 
              scale: [1, 2, 2.5],
              opacity: [0.8, 0.4, 0],
            } : {}}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0, rotate: -20 }}
            animate={phase !== 'blur' ? { 
              scale: phase === 'fade' ? 1.2 : 1,
              opacity: phase === 'fade' ? 0 : 1,
              rotate: 0,
            } : {}}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 15,
              duration: 0.8 
            }}
          >
            <motion.img
              src={minedLogo}
              alt="MINED"
              className="w-36 h-36 md:w-48 md:h-48 drop-shadow-2xl"
              animate={phase === 'logo' ? { 
                filter: ['drop-shadow(0 0 20px hsl(42 85% 55% / 0.5))', 'drop-shadow(0 0 40px hsl(42 85% 55% / 0.8))']
              } : {}}
              transition={{ duration: 0.5, repeat: 2, repeatType: "reverse" }}
            />
          </motion.div>

          {/* Tagline */}
          <motion.p
            className="mt-6 text-xl md:text-2xl font-display text-primary-foreground/90 tracking-wide"
            initial={{ opacity: 0, y: 20 }}
            animate={phase === 'glow' || phase === 'fade' ? { 
              opacity: phase === 'fade' ? 0 : 1,
              y: 0,
            } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Unearth Your Peace
          </motion.p>
        </div>

        {/* Blur Overlay for Transition */}
        <motion.div
          className="absolute inset-0 bg-background"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'fade' ? 1 : 0 }}
          transition={{ duration: 0.7 }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
