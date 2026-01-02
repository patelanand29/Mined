import { Link, useLocation } from 'react-router-dom';
import { Menu, User, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import minedLogo from '@/assets/mined-logo.png';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
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
              <img src={minedLogo} alt="MINED" className="w-9 h-9" />
              <span className="font-display text-xl font-bold mined-text-gradient hidden sm:inline">
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
              onClick={toggleTheme}
              className="hover:bg-primary/10"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            
            <Link to="/auth">
              <Button className="gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
