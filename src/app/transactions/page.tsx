'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Download,
  Calendar
} from 'lucide-react';
import CategoryIcon from '@/components/CategoryIcon';
import styles from './transactions.module.css';

interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE' | 'BOTH';
  color: string;
  icon: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  merchant: string;
  paymentMethod: string;
  tags: string;
  date: string;
  status: string;
  categoryId: string;
  accountId: string;
  category: Category;
  account: Account;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 8,
    totalPages: 0,
  });

  // Filter and search states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');

  // Loading state
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingTxId, setEditingTxId] = useState<string | null>(null);

  // Form states
  const [formType, setFormType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [formCategory, setFormCategory] = useState('');
  const [formAccount, setFormAccount] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMerchant, setFormMerchant] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('CASH');
  const [formTags, setFormTags] = useState('');
  const [formStatus, setFormStatus] = useState('COMPLETED');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  const fetchAccounts = async () => {
    try {
      const accRes = await fetch('/api/accounts');
      if (accRes.status === 401) {
        router.push('/login');
        return;
      }
      const accData = await accRes.json();
      setAccounts(accData || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  // Fetch initial setup data (categories & accounts)
  useEffect(() => {
    if (mounted) {
      const loadSetupData = async () => {
        try {
          const catRes = await fetch('/api/budgets');
          const catData = await catRes.json();
          setCategories(catData.categories || []);

          await fetchAccounts();
        } catch (error) {
          console.error('Error fetching categories/accounts:', error);
        }
      };
      loadSetupData();
    }
  }, [mounted]);

  // Fetch transactions list
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        search: debouncedSearch,
        category: selectedCategory,
        type: selectedType,
        accountId: selectedAccount,
      });

      const res = await fetch(`/api/transactions?${queryParams.toString()}`);
      const data = await res.json();

      setTransactions(data.transactions || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchTransactions();
    }
  }, [mounted, pagination.page, debouncedSearch, selectedCategory, selectedType, selectedAccount]);

  if (!mounted) return null;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingTxId(null);
    setFormType('EXPENSE');
    setFormAmount('');
    setFormDescription('');
    setFormMerchant('');
    setFormPaymentMethod('CASH');
    setFormTags('');
    setFormStatus('COMPLETED');
    setFormDate(new Date().toISOString().split('T')[0]);
    
    // Set defaults
    const filteredCats = categories.filter(c => c.type === 'EXPENSE' || c.type === 'BOTH');
    setFormCategory(filteredCats[0]?.id || '');
    setFormAccount(accounts[0]?.id || '');
    
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setModalMode('edit');
    setEditingTxId(tx.id);
    setFormType(tx.type);
    setFormCategory(tx.categoryId);
    setFormAccount(tx.accountId);
    setFormAmount(String(tx.amount));
    setFormDescription(tx.description || '');
    setFormMerchant(tx.merchant || '');
    setFormPaymentMethod(tx.paymentMethod || 'CASH');
    setFormTags(tx.tags || '');
    setFormStatus(tx.status || 'COMPLETED');
    setFormDate(new Date(tx.date).toISOString().split('T')[0]);
    
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record? This will revert its balance adjustments.')) return;

    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchTransactions();
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleFormTypeChange = (type: 'INCOME' | 'EXPENSE') => {
    setFormType(type);
    const filteredCats = categories.filter(c => c.type === type || c.type === 'BOTH');
    setFormCategory(filteredCats[0]?.id || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formAmount || isNaN(Number(formAmount)) || Number(formAmount) <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }
    if (!formCategory) {
      alert('Please select a category');
      return;
    }
    if (!formAccount) {
      alert('Please select an account');
      return;
    }

    const payload = {
      amount: parseFloat(formAmount),
      type: formType,
      categoryId: formCategory,
      accountId: formAccount,
      paymentMethod: formPaymentMethod,
      merchant: formMerchant,
      description: formDescription,
      tags: formTags,
      date: new Date(formDate).toISOString(),
      status: formStatus,
    };

    try {
      let res;
      if (modalMode === 'create') {
        res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/transactions/${editingTxId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setIsModalOpen(false);
        fetchTransactions();
        fetchAccounts();
        router.refresh();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('No transactions to export.');
      return;
    }

    // Define CSV Headers
    const headers = ['Transaction ID', 'Type', 'Amount', 'Category', 'Account', 'Payment Method', 'Merchant/Payee', 'Date', 'Status', 'Description', 'Tags'];
    
    // Map transactions to CSV rows
    const rows = transactions.map(tx => [
      tx.id,
      tx.type,
      tx.amount,
      tx.category.name,
      tx.account.name,
      tx.paymentMethod,
      `"${tx.merchant.replace(/"/g, '""')}"`,
      new Date(tx.date).toLocaleDateString(),
      tx.status,
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      `"${(tx.tags || '').replace(/"/g, '""')}"`
    ]);

    // Build CSV Content
    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    // Create Download Trigger
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `spendwise_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const filteredCategoriesForForm = categories.filter(
    (c) => c.type === formType || c.type === 'BOTH'
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2.5rem' }}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Transactions</h1>
          <p className={styles.subtitle}>Track, filter, and export your cashflow history.</p>
        </div>
        <div className={styles.headerButtons}>
          <button 
            className={styles.btnExport}
            onClick={handleExportCSV}
          >
            <Download size={16} />
            Export CSV
          </button>
          
          <button 
            className={styles.btnAddRecord}
            onClick={handleOpenCreateModal}
          >
            <Plus size={16} />
            Add Record
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className={`${styles.filtersCard} glass`}>
        {/* Search */}
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search descriptions/payees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Account Filter */}
        <select
          value={selectedAccount}
          onChange={(e) => {
            setSelectedAccount(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className={styles.filterSelect}
        >
          <option value="">All Accounts</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className={styles.filterSelect}
        >
          <option value="">All Types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className={styles.filterSelect}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table Card */}
      <div className={`${styles.tableCard} glass`}>
        <div className={styles.tableContainer}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Fetching transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className={styles.noRecords}>No transactions match the filter criteria.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Merchant/Payee</th>
                  <th>Account</th>
                  <th>Category</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      {new Date(tx.date).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className={styles.descriptionCell} title={tx.description || ''}>
                      {tx.description || tx.category.name}
                    </td>
                    <td>{tx.merchant || '-'}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {tx.account?.name}
                    </td>
                    <td>
                      <span 
                        className={styles.categoryBadge}
                        style={{ backgroundColor: `${tx.category.color}15`, color: tx.category.color }}
                      >
                        <CategoryIcon name={tx.category.icon} color={tx.category.color} size={13} />
                        {tx.category.name}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', fontWeight: 500 }}>{tx.paymentMethod}</td>
                    <td>
                      <span 
                        style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 600,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          backgroundColor: tx.status === 'COMPLETED' ? 'var(--success-bg)' : tx.status === 'PENDING' ? 'var(--warning-bg)' : 'var(--danger-bg)',
                          color: tx.status === 'COMPLETED' ? 'var(--success)' : tx.status === 'PENDING' ? 'var(--warning)' : 'var(--danger)'
                        }}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className={`${styles.amount} ${tx.type === 'INCOME' ? styles.incomeAmount : styles.expenseAmount}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button 
                          className={`${styles.actionBtn} ${styles.editBtn}`}
                          onClick={() => handleOpenEditModal(tx)}
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          onClick={() => handleDelete(tx.id)}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Showing page <b>{pagination.page}</b> of {pagination.totalPages} ({pagination.total} total items)
          </span>
          <div className={styles.pageControls}>
            <button
              className="glass styles.paginationBtn"
              style={{ padding: '0.5rem 1.1rem', cursor: 'pointer' }}
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="glass styles.paginationBtn"
              style={{ padding: '0.5rem 1.1rem', cursor: 'pointer' }}
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {modalMode === 'create' ? 'Add Transaction' : 'Edit Transaction'}
              </h2>
              <button className={styles.modalClose} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Type Switcher */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Transaction Type</label>
                <div className={styles.typeSelector}>
                  <button
                    type="button"
                    className={`${styles.typeBtn} ${formType === 'INCOME' ? styles.typeBtnActive : ''}`}
                    onClick={() => handleFormTypeChange('INCOME')}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    className={`${styles.typeBtn} ${formType === 'EXPENSE' ? styles.typeExpenseActive : ''}`}
                    onClick={() => handleFormTypeChange('EXPENSE')}
                  >
                    Expense
                  </button>
                </div>
              </div>

              {/* Amount & Account */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label htmlFor="amount" className={styles.label}>Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="amount"
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="account" className={styles.label}>Account</label>
                  <select
                    id="account"
                    value={formAccount}
                    onChange={(e) => setFormAccount(e.target.value)}
                    className={styles.select}
                    required
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category & Payment Method */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label htmlFor="category" className={styles.label}>Category</label>
                  <select
                    id="category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className={styles.select}
                    required
                  >
                    {filteredCategoriesForForm.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="method" className={styles.label}>Payment Method</label>
                  <select
                    id="method"
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className={styles.select}
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Credit/Debit Card</option>
                    <option value="UPI">UPI (Paytm/PhonePe)</option>
                    <option value="NET_BANKING">Net Banking</option>
                  </select>
                </div>
              </div>

              {/* Date & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label htmlFor="date" className={styles.label}>Date</label>
                  <input
                    type="date"
                    id="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="status" className={styles.label}>Status</label>
                  <select
                    id="status"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className={styles.select}
                  >
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </div>

              {/* Merchant/Payee & Tags */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label htmlFor="merchant" className={styles.label}>Merchant / Payee</label>
                  <input
                    type="text"
                    id="merchant"
                    placeholder="e.g. Walmart, employer"
                    value={formMerchant}
                    onChange={(e) => setFormMerchant(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="tags" className={styles.label}>Tags (comma-separated)</label>
                  <input
                    type="text"
                    id="tags"
                    placeholder="e.g. office, grocery, food"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Description */}
              <div className={styles.formGroup}>
                <label htmlFor="description" className={styles.label}>Description (Optional)</label>
                <textarea
                  id="description"
                  placeholder="Enter details..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className={styles.textarea}
                  rows={2}
                />
              </div>

              {/* Action Buttons */}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={styles.btnCancel}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnSubmit}>
                  {modalMode === 'create' ? 'Save' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
