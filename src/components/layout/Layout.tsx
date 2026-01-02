import { ReactNode, useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="container mx-auto px-4 pt-20 pb-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2026 MINED. Unearth Your Peace.</p>
          <p className="mt-2">Made with 💙 for students in India</p>
        </div>
      </footer>
    </div>
  );
}
