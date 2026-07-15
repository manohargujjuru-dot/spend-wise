'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ReceiptText, 
  PiggyBank, 
  Wallet, 
  BarChart3, 
  Settings, 
  LogOut,
  CreditCard,
  User as UserIcon,
  X
} from 'lucide-react';
import styles from './Sidebar.module.css';

interface User {
  fullName: string;
  email: string;
  profilePhoto?: string | null;
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/profile');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        console.error('Error fetching user profile in sidebar:', err);
      }
    };
    fetchUser();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'DELETE',
      });
      if (res.ok) {
        if (onClose) onClose();
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const links = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, color: '#3b82f6' }, // Saturated Blue
    { href: '/transactions', label: 'Transactions', icon: ReceiptText, color: '#7c3aed' }, // Saturated Purple
    { href: '/accounts', label: 'Accounts', icon: Wallet, color: '#059669' }, // Saturated Emerald
    { href: '/cards', label: 'My Cards', icon: CreditCard, color: '#ea580c' }, // Saturated Orange
    { href: '/budgets', label: 'Budgets & Goals', icon: PiggyBank, color: '#0ea5e9' }, // Saturated Sky Blue
    { href: '/reports', label: 'Reports', icon: BarChart3, color: '#e11d48' }, // Saturated Rose/Pink
    { href: '/settings', label: 'Settings', icon: Settings, color: '#475569' }, // Saturated Slate
  ];

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.logoContainer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Wallet size={28} style={{ color: '#4f46e5' }} />
          <span className={styles.logoText}>SpendWise</span>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close sidebar">
          <X size={18} />
        </button>
      </div>
      
      <nav className={styles.navLinks}>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${isActive ? styles.activeLink : ''}`}
              onClick={onClose}
            >
              <Icon size={18} style={{ color: isActive ? '#0f172a' : link.color }} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* User profile details at bottom */}
      {user && (
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(0, 0, 0, 0.05)',
            marginTop: 'auto'
          }}
        >
          <Link 
            href="/settings"
            onClick={onClose}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              padding: '0.4rem 0.5rem',
              borderRadius: '8px',
              transition: 'background 0.2s',
              cursor: 'pointer',
              textDecoration: 'none',
              width: '100%'
            }}
            className={styles.profileLink}
          >
            <div 
              style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4f46e5',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                flexShrink: 0
              }}
            >
              {user.profilePhoto ? (
                <img 
                  src={user.profilePhoto} 
                  alt={user.fullName} 
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                />
              ) : (
                <UserIcon size={16} />
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flexGrow: 1 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.fullName}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                View & Edit Profile
              </span>
            </div>
          </Link>
          
          <button 
            onClick={handleLogout}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              width: '100%',
              padding: '0.65rem 0.75rem',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(225, 29, 72, 0.06)',
              color: '#e11d48',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(225, 29, 72, 0.12)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(225, 29, 72, 0.06)'}
          >
            <LogOut size={14} />
            Logout
          </button>
          <div 
            style={{ 
              textAlign: 'center', 
              fontSize: '0.68rem', 
              color: 'var(--text-muted)', 
              opacity: 0.65,
              marginTop: '0.5rem',
              letterSpacing: '0.2px'
            }}
          >
            Designed by @ManoharGujjuru
          </div>
        </div>
      )}
    </aside>
  );
}
