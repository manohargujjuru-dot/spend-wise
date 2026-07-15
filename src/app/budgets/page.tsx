'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PiggyBank, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  X,
  Trash2
} from 'lucide-react';
import CategoryIcon from '@/components/CategoryIcon';
import styles from './budgets.module.css';
import modalStyles from '../transactions/transactions.module.css';

interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE' | 'BOTH';
  color: string;
  icon: string;
}

interface BudgetProgress {
  id: string;
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  limit: number;
  spent: number;
  percentage: number;
}

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  status: string;
}

export default function BudgetsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<BudgetProgress[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  // Budget Form states
  const [formCategory, setFormCategory] = useState('');
  const [formBudgetAmount, setFormBudgetAmount] = useState('');
  
  // Goal Form states
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [formGoalName, setFormGoalName] = useState('');
  const [formGoalTarget, setFormGoalTarget] = useState('');
  const [formGoalCurrent, setFormGoalCurrent] = useState('');
  const [formGoalDeadline, setFormGoalDeadline] = useState(
    new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  );

  // Goal Progress modal states
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [formProgressAmount, setFormProgressAmount] = useState('');

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch budget progress
      const statsRes = await fetch(`/api/dashboard/stats?month=${currentMonth}&year=${currentYear}`);
      if (statsRes.status === 401) {
        router.push('/login');
        return;
      }
      const statsData = await statsRes.json();
      setBudgets(statsData.budgetProgress || []);

      // 2. Fetch categories
      const budgetsRes = await fetch(`/api/budgets?month=${currentMonth}&year=${currentYear}`);
      const budgetsData = await budgetsRes.json();
      const expenseCats = (budgetsData.categories || []).filter(
        (c: Category) => c.type === 'EXPENSE' || c.type === 'BOTH'
      );
      setCategories(expenseCats);
      if (expenseCats.length > 0 && !formCategory) {
        setFormCategory(expenseCats[0].id);
      }

      // 3. Fetch goals
      const goalsRes = await fetch('/api/goals');
      const goalsData = await goalsRes.json();
      setGoals(goalsData || []);

    } catch (error) {
      console.error('Error fetching budget/goal data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchData();
    }
  }, [mounted]);

  if (!mounted) return null;

  // Handle setting budget
  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formBudgetAmount || isNaN(Number(formBudgetAmount)) || Number(formBudgetAmount) < 0) {
      alert('Please enter a valid budget amount');
      return;
    }
    if (!formCategory) {
      alert('Please select a category');
      return;
    }

    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: formCategory,
          amount: parseFloat(formBudgetAmount),
          month: currentMonth,
          year: currentYear,
        }),
      });

      if (res.ok) {
        setFormBudgetAmount('');
        fetchData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to set budget');
      }
    } catch (error) {
      console.error('Error setting budget:', error);
    }
  };

  // Handle creating savings goal
  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formGoalName) {
      alert('Please enter a goal name');
      return;
    }
    if (!formGoalTarget || isNaN(Number(formGoalTarget)) || Number(formGoalTarget) <= 0) {
      alert('Please enter a valid target amount');
      return;
    }

    const payload = {
      name: formGoalName,
      targetAmount: parseFloat(formGoalTarget),
      currentAmount: parseFloat(formGoalCurrent || '0'),
      deadline: new Date(formGoalDeadline).toISOString(),
    };

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsGoalModalOpen(false);
        setFormGoalName('');
        setFormGoalTarget('');
        setFormGoalCurrent('');
        fetchData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to create goal');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  // Handle updating goal progress
  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    if (!formProgressAmount || isNaN(Number(formProgressAmount)) || Number(formProgressAmount) <= 0) {
      alert('Please enter a valid savings amount');
      return;
    }

    const updatedCurrent = selectedGoal.currentAmount + parseFloat(formProgressAmount);

    try {
      const res = await fetch(`/api/goals/${selectedGoal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentAmount: updatedCurrent,
        }),
      });

      if (res.ok) {
        setIsProgressModalOpen(false);
        setFormProgressAmount('');
        setSelectedGoal(null);
        fetchData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to update progress');
      }
    } catch (error) {
      console.error('Error updating goal progress:', error);
    }
  };

  const handleGoalDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this savings goal?')) return;

    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const monthName = new Date().toLocaleString('default', { month: 'long' });

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3.5rem' }}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Budgets & Goals</h1>
          <p className={styles.subtitle}>Define monthly spending categories limits and track savings goals.</p>
        </div>
        
        <button 
          className={styles.btnAddBudget}
          onClick={() => setIsGoalModalOpen(true)}
        >
          <Plus size={16} />
          Add Savings Goal
        </button>
      </div>

      {loading && budgets.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading budgets and savings goals...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          {/* BUDGET SECTION */}
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={20} style={{ color: 'var(--primary)' }} />
              Category Spending Limits ({monthName})
            </h2>

            <div className={styles.grid}>
              {/* Set budget form */}
              <div className={`${styles.card} glass`}>
                <h3 className={styles.cardTitle}>Set Category Limit</h3>
                <form onSubmit={handleBudgetSubmit} className={styles.form}>
                  <div className={styles.formGroup}>
                    <label htmlFor="category" className={styles.label}>Expense Category</label>
                    <select
                      id="category"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className={styles.select}
                      required
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="budgetAmount" className={styles.label}>Budget Target ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      id="budgetAmount"
                      placeholder="0.00"
                      value={formBudgetAmount}
                      onChange={(e) => setFormBudgetAmount(e.target.value)}
                      className={styles.input}
                      required
                    />
                  </div>

                  <button type="submit" className={styles.btnSubmit}>
                    Set Target Limit
                  </button>
                </form>
              </div>

              {/* Budget Progress list */}
              <div className={`${styles.card} glass`}>
                <h3 className={styles.cardTitle}>Active Monthly Budgets</h3>
                {budgets.length === 0 ? (
                  <div className={styles.noTargets}>No budgets set for this month. Set targets on the left form.</div>
                ) : (
                  <div className={styles.targetList}>
                    {budgets.map((bg) => {
                      const isOver = bg.spent >= bg.limit;
                      const isClose = bg.spent >= bg.limit * 0.85 && bg.spent < bg.limit;
                      return (
                        <div key={bg.id} className={styles.targetItem}>
                          <div className={styles.targetHeader}>
                            <div className={styles.targetCategory}>
                              <div className={styles.categoryIcon} style={{ backgroundColor: `${bg.color}15` }}>
                                <CategoryIcon name={bg.icon} color={bg.color} size={16} />
                              </div>
                              <span className={styles.categoryName}>{bg.categoryName}</span>
                            </div>
                            <div className={styles.targetDetails}>
                              <span className={styles.targetRatio}>{formatCurrency(bg.spent)} / {formatCurrency(bg.limit)}</span>
                              <span className={styles.targetPercentage}>{Math.round(bg.percentage)}% spent</span>
                            </div>
                          </div>
                          <div className={styles.progressBarContainer}>
                            <div 
                              className={styles.progressBarFill} 
                              style={{ 
                                width: `${bg.percentage}%`,
                                backgroundColor: isOver ? 'var(--danger)' : isClose ? 'var(--warning)' : bg.color
                              }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SAVINGS GOALS SECTION */}
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PiggyBank size={20} style={{ color: 'var(--success)' }} />
              Savings & Goal Targets
            </h2>

            {goals.length === 0 ? (
              <div className={`${styles.card} glass`} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active savings goals. Set up a target like "Buy Bike" or "Emergency Fund" above.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {goals.map((g) => {
                  const percentage = g.targetAmount > 0 ? Math.min((g.currentAmount / g.targetAmount) * 100, 100) : 0;
                  const isAchieved = g.status === 'ACHIEVED' || g.currentAmount >= g.targetAmount;
                  const daysRemaining = Math.max(0, Math.ceil((new Date(g.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
                  
                  return (
                    <div 
                      key={g.id} 
                      className={`${styles.targetItem} glass`} 
                      style={{ 
                        borderLeft: `3px solid ${isAchieved ? 'var(--success)' : 'var(--primary)'}`,
                        padding: '1.25rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <h4 style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{g.name}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                            <Calendar size={12} />
                            {new Date(g.deadline).toLocaleDateString()} ({daysRemaining} days left)
                          </span>
                        </div>
                        <button 
                          onClick={() => handleGoalDelete(g.id)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Savings Progress</span>
                        <span style={{ color: 'var(--text-primary)' }}>
                          {formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}
                        </span>
                      </div>

                      <div className={styles.progressBarContainer} style={{ marginBottom: '1rem' }}>
                        <div 
                          className={styles.progressBarFill}
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: isAchieved ? 'var(--success)' : 'var(--primary)'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span 
                          style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 600,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px',
                            backgroundColor: isAchieved ? 'var(--success-bg)' : 'rgba(99, 102, 241, 0.1)',
                            color: isAchieved ? 'var(--success)' : '#a5b4fc'
                          }}
                        >
                          {isAchieved ? 'ACHIEVED' : `${Math.round(percentage)}% SAVED`}
                        </span>
                        
                        {!isAchieved && (
                          <button 
                            className="glass"
                            style={{ 
                              padding: '0.35rem 0.75rem', 
                              fontSize: '0.75rem', 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              color: 'var(--text-primary)'
                            }}
                            onClick={() => {
                              setSelectedGoal(g);
                              setIsProgressModalOpen(true);
                            }}
                          >
                            <Plus size={12} />
                            Add Cash
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Add Savings Goal Modal */}
      {isGoalModalOpen && (
        <div className={modalStyles.modalOverlay}>
          <div className={modalStyles.modal}>
            <div className={modalStyles.modalHeader}>
              <h2 className={modalStyles.modalTitle}>Add Savings Goal</h2>
              <button className={modalStyles.modalClose} onClick={() => setIsGoalModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGoalSubmit} className={modalStyles.form}>
              <div className={modalStyles.formGroup}>
                <label htmlFor="goalName" className={modalStyles.label}>Goal Name</label>
                <input
                  type="text"
                  id="goalName"
                  placeholder="e.g. Buy Custom Bike, Emergency Fund"
                  value={formGoalName}
                  onChange={(e) => setFormGoalName(e.target.value)}
                  className={modalStyles.input}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={modalStyles.formGroup}>
                  <label htmlFor="goalTarget" className={modalStyles.label}>Target Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="goalTarget"
                    placeholder="0.00"
                    value={formGoalTarget}
                    onChange={(e) => setFormGoalTarget(e.target.value)}
                    className={modalStyles.input}
                    required
                  />
                </div>

                <div className={modalStyles.formGroup}>
                  <label htmlFor="goalCurrent" className={modalStyles.label}>Starting Balance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="goalCurrent"
                    placeholder="0.00"
                    value={formGoalCurrent}
                    onChange={(e) => setFormGoalCurrent(e.target.value)}
                    className={modalStyles.input}
                  />
                </div>
              </div>

              <div className={modalStyles.formGroup}>
                <label htmlFor="goalDeadline" className={modalStyles.label}>Target Deadline Date</label>
                <input
                  type="date"
                  id="goalDeadline"
                  value={formGoalDeadline}
                  onChange={(e) => setFormGoalDeadline(e.target.value)}
                  className={modalStyles.input}
                  required
                />
              </div>

              <div className={modalStyles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className={modalStyles.btnCancel}
                >
                  Cancel
                </button>
                <button type="submit" className={modalStyles.btnSubmit}>
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Progress Amount Modal */}
      {isProgressModalOpen && selectedGoal && (
        <div className={modalStyles.modalOverlay}>
          <div className={modalStyles.modal} style={{ maxWidth: '400px' }}>
            <div className={modalStyles.modalHeader}>
              <h2 className={modalStyles.modalTitle}>Add Savings Progress</h2>
              <button className={modalStyles.modalClose} onClick={() => setIsProgressModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProgressSubmit} className={modalStyles.form}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Adding money to savings goal: <b>{selectedGoal.name}</b>
              </div>

              <div className={modalStyles.formGroup}>
                <label htmlFor="progressAmount" className={modalStyles.label}>Savings Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  id="progressAmount"
                  placeholder="0.00"
                  value={formProgressAmount}
                  onChange={(e) => setFormProgressAmount(e.target.value)}
                  className={modalStyles.input}
                  required
                  autoFocus
                />
              </div>

              <div className={modalStyles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsProgressModalOpen(false)}
                  className={modalStyles.btnCancel}
                >
                  Cancel
                </button>
                <button type="submit" className={modalStyles.btnSubmit}>
                  Save Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
