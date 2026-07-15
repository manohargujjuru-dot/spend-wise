'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Trash2, 
  X,
  CreditCard,
  Building,
  Coins,
  Wallet,
  TrendingUp,
  Edit2
} from 'lucide-react';
import styles from './accounts.module.css';
import modalStyles from '../transactions/transactions.module.css';

interface Account {
  id: string;
  name: string;
  type: 'CASH' | 'BANK' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'WALLET' | 'UPI' | 'INVESTMENT';
  openingBalance: number;
  currentBalance: number;
  status: string;
}

export default function AccountsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<Account['type']>('BANK');
  const [formOpeningBalance, setFormOpeningBalance] = useState('');
  const [formCurrentBalance, setFormCurrentBalance] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accounts');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchAccounts();
    }
  }, [mounted]);

  if (!mounted) return null;

  const handleOpenModal = () => {
    setEditingAccount(null);
    setFormName('');
    setFormType('BANK');
    setFormOpeningBalance('');
    setFormCurrentBalance('');
    setIsModalOpen(true);
  };

  const handleEdit = (acc: Account) => {
    setEditingAccount(acc);
    setFormName(acc.name);
    setFormType(acc.type);
    setFormOpeningBalance(acc.openingBalance.toString());
    setFormCurrentBalance(acc.currentBalance.toString());
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account? All associated transaction references will be deleted.')) return;

    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchAccounts();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName) {
      alert('Please enter an account name');
      return;
    }

    const payload = {
      name: formName,
      type: formType,
      openingBalance: parseFloat(formOpeningBalance || '0'),
      currentBalance: editingAccount ? parseFloat(formCurrentBalance || '0') : parseFloat(formOpeningBalance || '0'),
    };

    try {
      const url = editingAccount ? `/api/accounts/${editingAccount.id}` : '/api/accounts';
      const method = editingAccount ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingAccount(null);
        fetchAccounts();
        router.refresh();
      } else {
        const errData = await res.json();
        alert(errData.error || `Failed to ${editingAccount ? 'update' : 'create'} account`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const getAccountStyle = (type: Account['type']) => {
    switch (type) {
      case 'BANK': return { border: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'CASH': return { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
      case 'CREDIT_CARD': return { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
      case 'WALLET':
      case 'UPI': return { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' };
      case 'INVESTMENT': return { border: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' };
      default: return { border: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' };
    }
  };

  const getAccountIcon = (type: Account['type']) => {
    const size = 18;
    const style = { color: getAccountStyle(type).border };
    switch (type) {
      case 'BANK': return <Building size={size} style={style} />;
      case 'CASH': return <Coins size={size} style={style} />;
      case 'CREDIT_CARD': return <CreditCard size={size} style={style} />;
      case 'WALLET':
      case 'UPI': return <Wallet size={size} style={style} />;
      case 'INVESTMENT': return <TrendingUp size={size} style={style} />;
      default: return <Building size={size} style={style} />;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2.5rem' }}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Accounts</h1>
          <p className={styles.subtitle}>Manage cash, banks, credit cards, and wallets.</p>
        </div>
        
        <button 
          className={styles.btnAddAccount}
          onClick={handleOpenModal}
        >
          <Plus size={16} />
          Add Account
        </button>
      </div>

      {loading && accounts.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading accounts data...
        </div>
      ) : (
        <div className={styles.grid}>
          {accounts.length === 0 ? (
            <div className={styles.noAccounts}>No accounts set up yet.</div>
          ) : (
            accounts.map((acc) => {
              const borderStyle = getAccountStyle(acc.type);
              return (
                <div 
                  key={acc.id} 
                  className={`${styles.card} glass`}
                  style={{ borderLeft: `3px solid ${borderStyle.border}` }}
                >
                  <div className={styles.cardHeader}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span className={styles.accountName}>{acc.name}</span>
                    </div>
                    <span 
                      className={styles.typeBadge}
                      style={{ 
                        backgroundColor: borderStyle.bg,
                        color: borderStyle.border
                      }}
                    >
                      {acc.type.replace('_', ' ')}
                    </span>
                  </div>

                  <div className={styles.balanceSection}>
                    <span className={styles.balanceLabel}>Current Balance</span>
                    <span className={styles.balanceValue} style={{ color: acc.currentBalance < 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {formatCurrency(acc.currentBalance)}
                    </span>
                  </div>

                  <div className={styles.footer}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {getAccountIcon(acc.type)}
                      <span className={styles.openingBalance}>
                        Start: {formatCurrency(acc.openingBalance)}
                      </span>
                    </div>
                    <div className={styles.actions} style={{ display: 'flex', gap: '0.4rem' }}>
                      <button 
                        className={styles.actionBtn}
                        onClick={() => handleEdit(acc)}
                        title="Edit account details"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        className={styles.actionBtn}
                        onClick={() => handleDelete(acc.id)}
                        title="Delete account"
                      >
                        <Trash2 size={13} className={styles.deleteBtn} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add / Edit Account Modal */}
      {isModalOpen && (
        <div className={modalStyles.modalOverlay}>
          <div className={modalStyles.modal}>
            <div className={modalStyles.modalHeader}>
              <h2 className={modalStyles.modalTitle}>{editingAccount ? 'Edit Account' : 'Add Account'}</h2>
              <button className={modalStyles.modalClose} onClick={() => { setIsModalOpen(false); setEditingAccount(null); }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={modalStyles.form}>
              {/* Account Name */}
              <div className={modalStyles.formGroup}>
                <label htmlFor="name" className={modalStyles.label}>Account Name</label>
                <input
                  type="text"
                  id="name"
                  placeholder="e.g. Chase Bank, Wallet Cash"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={modalStyles.input}
                  required
                />
              </div>

              {/* Account Type */}
              <div className={modalStyles.formGroup}>
                <label htmlFor="type" className={modalStyles.label}>Account Type</label>
                <select
                  id="type"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as Account['type'])}
                  className={modalStyles.select}
                  required
                >
                  <option value="BANK">Bank Account</option>
                  <option value="CASH">Cash</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="WALLET">Wallet (PhonePe/GP/Paytm)</option>
                  <option value="UPI">UPI</option>
                  <option value="INVESTMENT">Investments</option>
                </select>
              </div>

              {/* Opening Balance */}
              <div className={modalStyles.formGroup}>
                <label htmlFor="openingBalance" className={modalStyles.label}>Opening Balance (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  id="openingBalance"
                  placeholder="0.00"
                  value={formOpeningBalance}
                  onChange={(e) => setFormOpeningBalance(e.target.value)}
                  className={modalStyles.input}
                />
              </div>

              {/* Current Balance (Shown only when editing to allow quick manual overrides) */}
              {editingAccount && (
                <div className={modalStyles.formGroup}>
                  <label htmlFor="currentBalance" className={modalStyles.label}>Current Balance (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="currentBalance"
                    placeholder="0.00"
                    value={formCurrentBalance}
                    onChange={(e) => setFormCurrentBalance(e.target.value)}
                    className={modalStyles.input}
                    required
                  />
                </div>
              )}

              <div className={modalStyles.modalActions}>
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingAccount(null); }}
                  className={modalStyles.btnCancel}
                >
                  Cancel
                </button>
                <button type="submit" className={modalStyles.btnSubmit}>
                  {editingAccount ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
