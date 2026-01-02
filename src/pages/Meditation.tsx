import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Wind, Play, Pause, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';

type BreathingTechnique = {
  name: string;
  description: string;
  phases: { action: string; duration: number }[];
  color: string;
};

const TECHNIQUES: BreathingTechnique[] = [
  {
    name: 'Box Breathing',
    description: 'Equal breathing pattern used by Navy SEALs for stress relief',
    phases: [
      { action: 'Inhale', duration: 4 },
      { action: 'Hold', duration: 4 },
      { action: 'Exhale', duration: 4 },
      { action: 'Hold', duration: 4 },
    ],
    color: 'from-blue-500 to-indigo-500'
  },
  {
    name: '4-7-8 Breathing',
    description: 'Relaxing breath technique for better sleep and anxiety relief',
    phases: [
      { action: 'Inhale', duration: 4 },
      { action: 'Hold', duration: 7 },
      { action: 'Exhale', duration: 8 },
    ],
    color: 'from-teal-500 to-emerald-500'
  },
  {
    name: 'Deep Calm',
    description: 'Simple deep breathing for quick relaxation',
    phases: [
      { action: 'Inhale', duration: 5 },
      { action: 'Exhale', duration: 5 },
    ],
    color: 'from-purple-500 to-pink-500'
  },
];

export default function Meditation() {
  const [selectedTechnique, setSelectedTechnique] = useState<BreathingTechnique>(TECHNIQUES[0]);
  const [isActive, setIsActive] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [totalSessions, setTotalSessions] = useState(3);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentPhase = selectedTechnique.phases[currentPhaseIndex];

  useEffect(() => {
    if (isActive) {
      setTimeRemaining(currentPhase.duration);
      
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Move to next phase
            const nextIndex = (currentPhaseIndex + 1) % selectedTechnique.phases.length;
            setCurrentPhaseIndex(nextIndex);
            
            if (nextIndex === 0) {
              setCyclesCompleted(c => c + 1);
            }
            
            return selectedTechnique.phases[nextIndex].duration;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, currentPhaseIndex, selectedTechnique]);

  const toggleSession = () => {
    if (!isActive) {
      setCurrentPhaseIndex(0);
      setCyclesCompleted(0);
    }
    setIsActive(!isActive);
  };

  const resetSession = () => {
    setIsActive(false);
    setCurrentPhaseIndex(0);
    setTimeRemaining(0);
    setCyclesCompleted(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const selectTechnique = (technique: BreathingTechnique) => {
    resetSession();
    setSelectedTechnique(technique);
  };

  // Calculate circle scale based on breathing phase
  const getScale = () => {
    if (!isActive) return 1;
    const phase = currentPhase.action.toLowerCase();
    if (phase === 'inhale') {
      return 1 + (1 - timeRemaining / currentPhase.duration) * 0.3;
    } else if (phase === 'exhale') {
      return 1.3 - (1 - timeRemaining / currentPhase.duration) * 0.3;
    }
    return phase === 'hold' && currentPhaseIndex > 0 ? 1.3 : 1;
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 mb-4">
            <Wind className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Meditation & Breathing
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Find your calm with guided breathing exercises and mindfulness techniques
          </p>
        </div>

        {/* Technique Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {TECHNIQUES.map((technique) => (
            <Card
              key={technique.name}
              className={`mined-card cursor-pointer transition-all ${
                selectedTechnique.name === technique.name
                  ? 'ring-2 ring-primary'
                  : 'hover:shadow-lg'
              }`}
              onClick={() => selectTechnique(technique)}
            >
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${technique.color} flex items-center justify-center mb-3`}>
                  <Wind className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1">{technique.name}</h3>
                <p className="text-xs text-muted-foreground">{technique.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Breathing Animation */}
        <Card className="mined-card mb-8">
          <CardContent className="py-12">
            <div className="flex flex-col items-center">
              {/* Breathing Circle */}
              <div className="relative mb-8">
                <motion.div
                  animate={{ scale: getScale() }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className={`w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br ${selectedTechnique.color} opacity-20`}
                />
                <motion.div
                  animate={{ scale: getScale() * 0.8 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className={`absolute inset-0 m-auto w-36 h-36 md:w-48 md:h-48 rounded-full bg-gradient-to-br ${selectedTechnique.color} opacity-40 flex items-center justify-center`}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    {isActive ? (
                      <>
                        <motion.p
                          key={currentPhase.action}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-2xl md:text-3xl font-display font-bold text-foreground"
                        >
                          {currentPhase.action}
                        </motion.p>
                        <p className="text-4xl md:text-5xl font-bold mined-text-gradient mt-2">
                          {timeRemaining}
                        </p>
                      </>
                    ) : (
                      <p className="text-lg text-muted-foreground">Press Start</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                <Button
                  size="lg"
                  onClick={toggleSession}
                  className={`gap-2 px-8 bg-gradient-to-r ${selectedTechnique.color} text-white hover:opacity-90`}
                >
                  {isActive ? (
                    <>
                      <Pause className="w-5 h-5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Start
                    </>
                  )}
                </Button>
                <Button variant="outline" size="lg" onClick={resetSession}>
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </div>

              {/* Cycles Counter */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Cycles completed: <span className="font-bold text-foreground">{cyclesCompleted}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phase Indicators */}
        <Card className="mined-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">Breathing Phases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-4 flex-wrap">
              {selectedTechnique.phases.map((phase, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    isActive && currentPhaseIndex === index
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <span className="font-medium">{phase.action}</span>
                  <span className="text-sm opacity-70">{phase.duration}s</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Session History */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Sessions Today', value: totalSessions },
            { label: 'Total Minutes', value: 15 },
            { label: 'Current Streak', value: '3 days' },
            { label: 'Favorite', value: 'Box' },
          ].map((stat) => (
            <Card key={stat.label} className="mined-card">
              <CardContent className="p-4 text-center">
                <div className="font-display text-2xl font-bold mined-text-gradient">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </Layout>
  );
}
