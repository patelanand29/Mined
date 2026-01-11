import { ReactNode, useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MentalHealthBanner from '@/components/MentalHealthBanner';
import { useAuth } from '@/hooks/useAuth';
import { useMentalHealthMonitor } from '@/hooks/useMentalHealthMonitor';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { runAnalysis, latestAlert } = useMentalHealthMonitor();

  // Run mental health analysis periodically (once per day)
  useEffect(() => {
    if (!user) return;

    const lastAnalysisKey = `mined_last_analysis_${user.id}`;
    const lastAnalysis = localStorage.getItem(lastAnalysisKey);
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    if (!lastAnalysis || parseInt(lastAnalysis) < oneDayAgo) {
      // Run analysis after a short delay to not block initial render
      const timer = setTimeout(() => {
        runAnalysis().then(() => {
          localStorage.setItem(lastAnalysisKey, Date.now().toString());
        });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [user, runAnalysis]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="container mx-auto px-4 pt-20 pb-12">
        <MentalHealthBanner />
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2026 MINED. Unearth Your Peace.</p>
          <p className="mt-2">Made with 💙 for students in IET DAVV</p>
        </div>
      </footer>
    </div>
  );
}
