'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Percent, 
  Plus, 
  RefreshCw,
  ChevronRight,
  Bell,
  Sparkles,
  Wallet,
  Calendar,
  AlertOctagon
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import CategoryIcon from '@/components/CategoryIcon';
import styles from './page.module.css';

interface DashboardStats {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    totalSavings: number;
    savingsRate: number;
    todaySpending: number;
    weeklySpending: number;
    monthlySpending: number;
    monthlyBudget: number;
    budgetRemaining: number;
  };
  categoryDistribution: Array<{
    id: string;
    name: string;
    amount: number;
    color: string;
    icon: string;
  }>;
  budgetProgress: Array<{
    id: string;
    categoryId: string;
    categoryName: string;
    color: string;
    icon: string;
    limit: number;
    spent: number;
    percentage: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  date: string;
  category: {
    name: string;
    color: string;
    icon: string;
  };
}

interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface AIInsights {
  healthScore: number;
  insights: string[];
  alerts: string[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        padding: '0.65rem 0.85rem',
        borderRadius: '10px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.03)'
      }}>
        <p style={{ fontWeight: 700, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.3rem', fontFamily: 'var(--font-display)', letterSpacing: '0.5px' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', margin: '0.1rem 0' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: entry.color }} />
            <span style={{ color: '#475569' }}>{entry.name}:</span>
            <span>₹{Number(entry.value).toLocaleString('en-IN')}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        padding: '0.5rem 0.75rem',
        borderRadius: '8px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.03)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.8rem',
        fontWeight: 600,
        color: '#0f172a'
      }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: entry.payload.color || entry.color }} />
        <span style={{ color: '#475569' }}>{entry.name}:</span>
        <span>₹{Number(entry.value).toLocaleString('en-IN')}</span>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  
  // Notification states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // AI insights state
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);

  // Chart toggle
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  useEffect(() => {
    setMounted(true);
    
    // Close notifications dropdown on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch main dashboard metrics
      const statsRes = await fetch('/api/dashboard/stats');
      if (statsRes.status === 401) {
        router.push('/login');
        return;
      }
      const statsData = await statsRes.json();
      setStats(statsData);

      // 2. Fetch recent transactions
      const txRes = await fetch('/api/transactions?limit=5');
      const txData = await txRes.json();
      setRecentTransactions(txData.transactions || []);

      // 3. Fetch notifications
      const notifyRes = await fetch('/api/notifications');
      const notifyData = await notifyRes.json();
      setNotifications(notifyData || []);

      // 4. Fetch AI insights
      const aiRes = await fetch('/api/ai/insights');
      const aiData = await aiRes.json();
      setAiInsights(aiData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchData();
    }
  }, [mounted]);

  const handleMarkNotificationsRead = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'PUT' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  if (!mounted) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2.5rem' }}>
      {/* Upper Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Welcome back! Real-time financial insights and tracking.</p>
        </div>
        
        <div className={styles.actionsContainer} ref={notificationRef}>
          {/* Notification Bell */}
          <div 
            className={`${styles.notificationBell} glass`}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} style={{ color: 'var(--text-secondary)' }} />
            {unreadCount > 0 && <div className={styles.notificationBadge} />}
          </div>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className={`${styles.notificationDropdown} glass`}>
              <div className={styles.dropdownHeader}>
                <span>Notifications ({unreadCount} unread)</span>
                {unreadCount > 0 && (
                  <button className={styles.clearAllBtn} onClick={handleMarkNotificationsRead}>
                    Clear All
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className={styles.emptyNotifications}>No new alerts or warnings.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`${styles.notificationItem} ${!n.isRead ? styles.notificationItemUnread : ''}`}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.2rem', color: n.type === 'BUDGET_EXCEEDED' ? 'var(--danger)' : '#6366f1' }}>
                        {n.type.replace('_', ' ')}
                      </div>
                      <p>{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button 
            className="glass" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.65rem 1.1rem', 
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500
            }}
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          
          <Link href="/transactions" style={{ textDecoration: 'none' }}>
            <button 
              className="glass"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.65rem 1.25rem', 
                background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                borderColor: 'rgba(99, 102, 241, 0.4)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              <Plus size={16} />
              Add Record
            </button>
          </Link>
        </div>
      </div>

      {loading && !stats ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', color: 'var(--text-secondary)' }}>
          Syncing SpendWise analytics engine...
        </div>
      ) : (
        <>
          {/* Main Stat Cards Grid */}
          <div className={styles.statsGrid}>
            {/* Card 1: Balance */}
            <div className={`${styles.statCard} glass`} style={{ borderLeft: '3px solid var(--info)' }}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Total Balance</span>
                <div className={styles.iconWrapper} style={{ backgroundColor: 'var(--info-bg)' }}>
                  <TrendingUp size={18} style={{ color: 'var(--info)' }} />
                </div>
              </div>
              <span className={styles.statValue}>
                {formatCurrency(stats?.summary.netBalance || 0)}
              </span>
            </div>

            {/* Card 2: Income */}
            <div className={`${styles.statCard} glass`} style={{ borderLeft: '3px solid var(--success)' }}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Total Income</span>
                <div className={styles.iconWrapper} style={{ backgroundColor: 'var(--success-bg)' }}>
                  <ArrowUpRight size={18} style={{ color: 'var(--success)' }} />
                </div>
              </div>
              <span className={styles.statValue} style={{ color: 'var(--success)' }}>
                {formatCurrency(stats?.summary.totalIncome || 0)}
              </span>
            </div>

            {/* Card 3: Expenses */}
            <div className={`${styles.statCard} glass`} style={{ borderLeft: '3px solid var(--danger)' }}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Total Expenses</span>
                <div className={styles.iconWrapper} style={{ backgroundColor: 'var(--danger-bg)' }}>
                  <ArrowDownLeft size={18} style={{ color: 'var(--danger)' }} />
                </div>
              </div>
              <span className={styles.statValue} style={{ color: 'var(--danger)' }}>
                {formatCurrency(stats?.summary.totalExpenses || 0)}
              </span>
            </div>

            {/* Card 4: Savings */}
            <div className={`${styles.statCard} glass`} style={{ borderLeft: '3px solid #d946ef' }}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Total Savings</span>
                <div className={styles.iconWrapper} style={{ backgroundColor: 'rgba(217, 70, 239, 0.15)' }}>
                  <Percent size={18} style={{ color: '#d946ef' }} />
                </div>
              </div>
              <span className={styles.statValue} style={{ color: '#d946ef' }}>
                {formatCurrency(stats?.summary.totalSavings || 0)}
              </span>
            </div>
          </div>

          {/* Secondary Stats Grid */}
          <div className={styles.secondaryStatsGrid}>
            {/* Card 5: Today's Spend */}
            <div className={`${styles.statCard} glass`}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Today's Spending</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Expenses</span>
              </div>
              <span className={styles.statValue} style={{ fontSize: '1.25rem' }}>
                {formatCurrency(stats?.summary.todaySpending || 0)}
              </span>
            </div>

            {/* Card 6: Weekly Spend */}
            <div className={`${styles.statCard} glass`}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Weekly Spending</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>7 Days</span>
              </div>
              <span className={styles.statValue} style={{ fontSize: '1.25rem' }}>
                {formatCurrency(stats?.summary.weeklySpending || 0)}
              </span>
            </div>

            {/* Card 7: Monthly Budget */}
            <div className={`${styles.statCard} glass`}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Monthly Budget Limit</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target</span>
              </div>
              <span className={styles.statValue} style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>
                {formatCurrency(stats?.summary.monthlyBudget || 0)}
              </span>
            </div>

            {/* Card 8: Budget Remaining */}
            <div className={`${styles.statCard} glass`}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Budget Remaining</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Available</span>
              </div>
              <span 
                className={styles.statValue} 
                style={{ 
                  fontSize: '1.25rem', 
                  color: (stats?.summary.budgetRemaining || 0) <= 50 ? 'var(--danger)' : 'var(--success)'
                }}
              >
                {formatCurrency(stats?.summary.budgetRemaining || 0)}
              </span>
            </div>
          </div>

          {/* AI Spending Diagnostics Card */}
          {aiInsights && (
            <div className={`${styles.aiCard} glass`}>
              <div className={styles.healthContainer}>
                {/* Circular SVG health score dial */}
                <div 
                  className={styles.healthScoreRing}
                  style={{
                    position: 'relative',
                    border: 'none',
                    background: 'transparent',
                    boxShadow: 'none'
                  }}
                >
                  <svg width="96" height="96" viewBox="0 0 96 96">
                    {/* Background Track Circle */}
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="transparent"
                      stroke="rgba(0, 0, 0, 0.04)"
                      strokeWidth="7"
                    />
                    {/* Active Progress Circle */}
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="transparent"
                      stroke={aiInsights.healthScore >= 80 ? '#059669' : aiInsights.healthScore >= 50 ? '#d97706' : '#e11d48'}
                      strokeWidth="7"
                      strokeDasharray="251.3"
                      strokeDashoffset={251.3 - (251.3 * aiInsights.healthScore) / 100}
                      strokeLinecap="round"
                      transform="rotate(-90 48 48)"
                      style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                    />
                  </svg>
                  <div 
                    style={{
                      position: 'absolute',
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.85rem',
                      fontWeight: 800,
                      color: aiInsights.healthScore >= 80 ? '#059669' : aiInsights.healthScore >= 50 ? '#d97706' : '#e11d48'
                    }}
                  >
                    {aiInsights.healthScore}
                  </div>
                </div>
                <span className={styles.healthLabel}>Financial Health</span>
              </div>

              <div className={styles.insightsPanel}>
                <h3 className={styles.aiTitle}>
                  <Sparkles size={16} style={{ color: '#818cf8' }} />
                  AI Spending Diagnostics
                </h3>
                
                {/* Display Warning Alert Box if exists */}
                {aiInsights.alerts.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.65rem 0.85rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '8px', marginBottom: '0.25rem' }}>
                    {aiInsights.alerts.map((alert, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#f87171', fontWeight: 500 }}>
                        <AlertOctagon size={12} />
                        {alert}
                      </div>
                    ))}
                  </div>
                )}

                <ul className={styles.insightList}>
                  {aiInsights.insights.map((insight, idx) => (
                    <li key={idx} className={styles.insightItem}>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Charts Grid */}
          <div className={styles.chartsGrid}>
            {/* Cashflow Line/Area & Bar Chart */}
            <div className={`${styles.chartCard} glass`}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>Cashflow Analysis</h3>
                <div className={`${styles.chartToggle} glass`}>
                  <button 
                    className={`${styles.chartToggleBtn} ${chartType === 'area' ? styles.chartToggleBtnActive : ''}`}
                    onClick={() => setChartType('area')}
                  >
                    Area Trend
                  </button>
                  <button 
                    className={`${styles.chartToggleBtn} ${chartType === 'bar' ? styles.chartToggleBtnActive : ''}`}
                    onClick={() => setChartType('bar')}
                  >
                    Bar Comparison
                  </button>
                </div>
              </div>
              
              <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'area' ? (
                    <AreaChart
                      data={stats?.monthlyTrend || []}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#e11d48" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" vertical={false} />
                      <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={{ stroke: 'rgba(0,0,0,0.1)' }} />
                      <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={{ stroke: 'rgba(0,0,0,0.1)' }} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="income" name="Income" stroke="#059669" strokeWidth={3.5} fillOpacity={1} fill="url(#colorIncome)" isAnimationActive={true} animationDuration={1200} />
                      <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#e11d48" strokeWidth={3.5} fillOpacity={1} fill="url(#colorExpense)" isAnimationActive={true} animationDuration={1200} />
                    </AreaChart>
                  ) : (
                    <BarChart
                      data={stats?.monthlyTrend || []}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="barIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#059669" stopOpacity={0.85}/>
                          <stop offset="100%" stopColor="#059669" stopOpacity={0.45}/>
                        </linearGradient>
                        <linearGradient id="barExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#e11d48" stopOpacity={0.85}/>
                          <stop offset="100%" stopColor="#e11d48" stopOpacity={0.45}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" vertical={false} />
                      <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={{ stroke: 'rgba(0,0,0,0.1)' }} />
                      <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={{ stroke: 'rgba(0,0,0,0.1)' }} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="income" name="Income" fill="url(#barIncome)" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={1200} />
                      <Bar dataKey="expenses" name="Expenses" fill="url(#barExpense)" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={1200} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown Donut Chart */}
            <div className={`${styles.chartCard} glass`}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>Monthly Expenses</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Distribution</span>
              </div>
              <div className={styles.chartWrapper}>
                {stats?.categoryDistribution.length === 0 ? (
                  <div className={styles.noDataText}>No expenses logged this month.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.categoryDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="amount"
                        isAnimationActive={true}
                        animationDuration={1000}
                      >
                        {stats?.categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              
              {/* Donut Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '100px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {stats?.categoryDistribution.slice(0, 4).map((entry, i) => (
                  <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{entry.name}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(entry.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Grid: Recent Transactions and Budgets */}
          <div className={styles.contentGrid}>
            {/* Recent Activity */}
            <div className={`${styles.sectionCard} glass`}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Recent Transactions</h3>
                <Link href="/transactions" className={styles.viewAllLink} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  View All
                  <ChevronRight size={14} />
                </Link>
              </div>
              
              {recentTransactions.length === 0 ? (
                <div className={styles.noDataText} style={{ padding: '2rem 0' }}>No records logged yet.</div>
              ) : (
                <div className={styles.recentList}>
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className={styles.recentItem}>
                      <div className={styles.recentItemLeft}>
                        <div 
                          className={styles.categoryIcon} 
                          style={{ backgroundColor: `${tx.category.color}15` }}
                        >
                          <CategoryIcon name={tx.category.icon} color={tx.category.color} size={18} />
                        </div>
                        <div className={styles.recentDetails}>
                          <span className={styles.recentDesc}>{tx.description || tx.category.name}</span>
                          <div className={styles.recentMeta}>
                            <span>{tx.category.name}</span>
                            <span>•</span>
                            <span>{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`${styles.recentAmount} ${tx.type === 'INCOME' ? styles.incomeAmount : styles.expenseAmount}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Budget limits status */}
            <div className={`${styles.sectionCard} glass`}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Budget Target Progress</h3>
                <Link href="/budgets" className={styles.viewAllLink} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Manage
                  <ChevronRight size={14} />
                </Link>
              </div>

              {stats?.budgetProgress.length === 0 ? (
                <div className={styles.noDataText} style={{ padding: '2rem 0' }}>No budget limits set. Create goals in Budgets & Goals page.</div>
              ) : (
                <div className={styles.budgetList}>
                  {stats?.budgetProgress.slice(0, 4).map((bg) => (
                    <div key={bg.id} className={styles.budgetItem}>
                      <div className={styles.budgetItemHeader}>
                        <span className={styles.budgetName}>{bg.categoryName}</span>
                        <span className={styles.budgetValues}>
                          {formatCurrency(bg.spent)} / {formatCurrency(bg.limit)}
                        </span>
                      </div>
                      <div className={styles.progressBarContainer}>
                        <div 
                          className={styles.progressBarFill}
                          style={{ 
                            width: `${bg.percentage}%`,
                            backgroundColor: bg.percentage >= 100 ? 'var(--danger)' : bg.percentage >= 85 ? 'var(--warning)' : bg.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
