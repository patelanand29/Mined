import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Home,
  Calendar, 
  TrendingUp, 
  BookOpen, 
  Brain, 
  Heart, 
  Wind, 
  Users, 
  Shield,
  UserCircle,
  Clock,
  Settings,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import minedLogo from '@/assets/mined-logo.png';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();

  const mainLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/mood-calendar', label: 'Mood Calendar', icon: Calendar },
    { path: '/mood-trends', label: 'Mood Trends', icon: TrendingUp },
    { path: '/journal', label: 'Journal', icon: BookOpen },
    { path: '/emotion-alchemist', label: 'Emotion Alchemist', icon: Brain },
    { path: '/cbt-tools', label: 'CBT Tools', icon: Heart },
    { path: '/meditation', label: 'Meditation', icon: Wind },
    { path: '/community', label: 'Community', icon: Users },
    { path: '/resources', label: 'Resources', icon: Shield },
    { path: '/time-capsule', label: 'Time Capsule', icon: Clock },
    { path: '/counsellors', label: 'Book Counsellor', icon: UserCircle },
  ];

  const bottomLinks = [
    { path: '/profile', label: 'Profile', icon: Settings },
    { path: '/help', label: 'Help & Support', icon: HelpCircle },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />

          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-card border-r border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Link to="/" onClick={onClose} className="flex items-center gap-2">
                <img src={minedLogo} alt="MINED" className="w-8 h-8" />
                <span className="font-display text-lg font-bold mined-text-gradient">MINED</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
              <div className="space-y-1 px-3">
                {mainLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link key={link.path} to={link.path} onClick={onClose}>
                      <div
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                          isActive(link.path)
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{link.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Bottom Links */}
            <div className="border-t border-border py-4 px-3 space-y-1">
              {bottomLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.path} to={link.path} onClick={onClose}>
                    <div
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        isActive(link.path)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{link.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
