import { Link, useLocation } from 'react-router-dom';
import { Menu, User, Moon, Sun, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import minedLogo from '@/assets/mined-logo.png';

interface NavbarProps {
  onMenuClick: () => void;
}

type ThemeMode = 'light' | 'dark' | 'stranger-things';

export default function Navbar({ onMenuClick }: NavbarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('mined-theme') as ThemeMode | null;
    if (savedTheme && ['light', 'dark', 'stranger-things'].includes(savedTheme)) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (newTheme: ThemeMode) => {
    const root = document.documentElement;
    root.classList.remove('dark', 'stranger-things');
    
    // Remove monster particles
    document.querySelectorAll('.monster-particle').forEach(el => el.remove());
    
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'stranger-things') {
      root.classList.add('stranger-things');
      // Add monster particles for Stranger Things theme
      addMonsterParticles();
    }
  };

  const addMonsterParticles = () => {
    const monsters = ['👾', '🕷️', '🦇', '👻', '🔴', '⚫'];
    const container = document.body;
    
    for (let i = 0; i < 6; i++) {
      const particle = document.createElement('div');
      particle.className = 'monster-particle';
      particle.textContent = monsters[i % monsters.length];
      particle.style.animationDelay = `${i * 1.5}s`;
      container.appendChild(particle);
    }
  };

  const cycleTheme = () => {
    const themeOrder: ThemeMode[] = ['light', 'dark', 'stranger-things'];
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    const newTheme = themeOrder[nextIndex];
    
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('mined-theme', newTheme);
  };

  const getThemeIcon = () => {
    if (theme === 'stranger-things') {
      return <Zap className="w-5 h-5 text-red-500 st-flicker" />;
    }
    return theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />;
  };

  const getThemeTooltip = () => {
    switch (theme) {
      case 'light': return 'Dark Mode';
      case 'dark': return 'Stranger Things';
      case 'stranger-things': return 'Light Mode';
    }
  };

  const navLinks = [
    { path: '/mood-calendar', label: 'Mood Calendar' },
    { path: '/journal', label: 'Journal' },
    { path: '/community', label: 'Community' },
    { path: '/resources', label: 'Resources' },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        theme === 'stranger-things' ? 'blood-drip relative' : ''
      } ${
        scrolled 
          ? 'mined-glass border-b border-border/50 shadow-soft' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onMenuClick}
              className="hover:bg-primary/10"
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <Link to="/" className="flex items-center gap-2">
              <img 
                src={minedLogo} 
                alt="MINED" 
                className={`w-9 h-9 ${theme === 'stranger-things' ? 'st-flicker' : ''}`} 
              />
              <span className={`font-display text-xl font-bold mined-text-gradient hidden sm:inline ${
                theme === 'stranger-things' ? 'st-flicker' : ''
              }`}>
                MINED
              </span>
            </Link>
          </div>

          {/* Center: Nav Links (Desktop) */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <Button 
                  variant="ghost" 
                  className={`text-sm font-medium transition-all ${
                    location.pathname === link.path 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Right: Theme + Profile */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={cycleTheme}
              className={`hover:bg-primary/10 ${theme === 'stranger-things' ? 'animate-pulse-glow' : ''}`}
              title={getThemeTooltip()}
            >
              {getThemeIcon()}
            </Button>
            
            {user ? (
              <Link to="/profile">
                <Button className="gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button className="gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
