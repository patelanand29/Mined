import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  Brain, 
  BookOpen,
  Wind,
  TrendingUp,
  Heart,
  Users,
  Shield,
  Clock,
  UserCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LandingAnimation from '@/components/LandingAnimation';
import Layout from '@/components/layout/Layout';
import minedLogo from '@/assets/mined-logo.png';

export default function Index() {
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    const hasSeenAnimation = sessionStorage.getItem('mined-animation-seen');
    if (!hasSeenAnimation) {
      setShowAnimation(true);
    } else {
      setAnimationComplete(true);
    }
  }, []);

  const handleAnimationComplete = () => {
    sessionStorage.setItem('mined-animation-seen', 'true');
    setShowAnimation(false);
    setAnimationComplete(true);
  };

  const features = [
    { 
      icon: Calendar, 
      title: 'Mood Calendar', 
      desc: 'Track your emotional journey day by day with Google Calendar sync',
      path: '/mood-calendar',
      gradient: 'from-blue-500/20 to-indigo-500/20',
      iconColor: 'text-blue-600'
    },
    { 
      icon: TrendingUp, 
      title: 'Mood Trends', 
      desc: 'Visualize patterns, stress correlations, and insights',
      path: '/mood-trends',
      gradient: 'from-emerald-500/20 to-teal-500/20',
      iconColor: 'text-emerald-600'
    },
    { 
      icon: BookOpen, 
      title: 'Journal', 
      desc: 'Express and reflect on your thoughts with AI insights',
      path: '/journal',
      gradient: 'from-cyan-500/20 to-sky-500/20',
      iconColor: 'text-cyan-600'
    },
    { 
      icon: Brain, 
      title: 'Emotion Alchemist', 
      desc: 'Transform feelings with AI-powered therapeutic guidance',
      path: '/emotion-alchemist',
      gradient: 'from-purple-500/20 to-violet-500/20',
      iconColor: 'text-purple-600'
    },
    { 
      icon: Heart, 
      title: 'CBT Tools', 
      desc: 'Evidence-based cognitive behavioral techniques',
      path: '/cbt-tools',
      gradient: 'from-rose-500/20 to-pink-500/20',
      iconColor: 'text-rose-600'
    },
    { 
      icon: Wind, 
      title: 'Meditation', 
      desc: 'Guided breathing exercises and mindfulness',
      path: '/meditation',
      gradient: 'from-teal-500/20 to-emerald-500/20',
      iconColor: 'text-teal-600'
    },
    { 
      icon: Users, 
      title: 'Peer Community', 
      desc: 'Connect with others who understand your journey',
      path: '/community',
      gradient: 'from-amber-500/20 to-orange-500/20',
      iconColor: 'text-amber-600'
    },
    { 
      icon: Shield, 
      title: 'Resources', 
      desc: 'Articles, videos, helplines & self-help guides',
      path: '/resources',
      gradient: 'from-slate-500/20 to-gray-500/20',
      iconColor: 'text-slate-600'
    },
    { 
      icon: Clock, 
      title: 'Time Capsule', 
      desc: 'Record messages to your future self',
      path: '/time-capsule',
      gradient: 'from-indigo-500/20 to-blue-500/20',
      iconColor: 'text-indigo-600'
    },
    { 
      icon: UserCircle, 
      title: 'Book Counsellor', 
      desc: 'Connect with verified mental health professionals',
      path: '/counsellors',
      gradient: 'from-green-500/20 to-emerald-500/20',
      iconColor: 'text-green-600'
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  if (!animationComplete && !showAnimation) {
    return null;
  }

  return (
    <>
      {showAnimation && (
        <LandingAnimation onComplete={handleAnimationComplete} />
      )}

      {animationComplete && (
        <Layout>
          {/* Hero Section */}
          <section className="relative py-8 md:py-16">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <img
                  src={minedLogo}
                  alt="MINED"
                  className="w-24 h-24 md:w-32 md:h-32 mx-auto drop-shadow-lg animate-float"
                />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-display text-5xl md:text-7xl font-bold mined-text-gradient mb-3"
              >
                MINED
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl md:text-2xl text-muted-foreground mb-3"
              >
                Unearth Your Peace
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-base md:text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-8"
              >
                A mental health and emotional wellness platform for students and young adults in India. 
                Mining the depths of your mind to discover clarity, resilience, and inner strength.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap justify-center gap-4"
              >
                <Link to="/auth">
                  <Button size="lg" className="gap-2 text-lg px-8 shadow-soft">
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/mood-calendar">
                  <Button size="lg" variant="outline" className="gap-2 text-lg px-8">
                    <Sparkles className="w-5 h-5" />
                    Explore Features
                  </Button>
                </Link>
              </motion.div>
            </div>
          </section>

          {/* Features Grid */}
          <section className="py-12 md:py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center mb-10"
            >
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                Your Wellness Toolkit
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need to understand, manage, and improve your mental well-being
              </p>
            </motion.div>

            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
            >
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <motion.div key={feature.title} variants={item}>
                    <Link to={feature.path}>
                      <Card className="mined-card group h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                        <CardContent className="p-5">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                            <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                          </div>
                          <h3 className="font-display text-base font-semibold text-foreground mb-1">
                            {feature.title}
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {feature.desc}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </section>

          {/* CTA Section */}
          <section className="py-12 md:py-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="mined-gradient-bg rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
            >
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                  Start Your Journey Today
                </h2>
                <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
                  Join thousands of students who are already discovering their inner peace with MINED.
                </p>
                <Link to="/auth">
                  <Button 
                    size="lg" 
                    className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 shadow-glow"
                  >
                    Create Free Account
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </section>

          {/* Stats Section */}
          <section className="py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: '10K+', label: 'Active Users' },
                { value: '50K+', label: 'Mood Entries' },
                { value: '500+', label: 'Counsellors' },
                { value: '24/7', label: 'Crisis Support' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  className="p-4"
                >
                  <div className="font-display text-3xl md:text-4xl font-bold mined-text-gradient mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </section>
        </Layout>
      )}
    </>
  );
}
