'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import IntroLoader from './IntroLoader';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showIntro, setShowIntro] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none'; // prevent swipe movements
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isSidebarOpen]);

  if (showIntro) {
    return <IntroLoader onComplete={() => setShowIntro(false)} />;
  }

  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage) {
    return <div className="auth-wrapper" style={{ width: '100%' }}>{children}</div>;
  }

  return (
    <div className="layout-container">
      {/* Mobile Top Header Bar */}
      <header className="mobile-header">
        <button 
          className="hamburger-btn" 
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>
        <span className="mobile-logo">SpendWise</span>
        <div style={{ width: 32 }} /> {/* balance spacing */}
      </header>

      {/* Slide-out Sidebar Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Sidebar Drawer */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Page Area */}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}
