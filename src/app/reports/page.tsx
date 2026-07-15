'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
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
import { 
  Download, 
  Printer, 
  FileText, 
  Calendar,
  Filter
} from 'lucide-react';
import CategoryIcon from '@/components/CategoryIcon';
import styles from './reports.module.css';
import tableStyles from '../transactions/transactions.module.css';

interface Category {
  id: string;
  name: string;
  type: string;
}

interface Account {
  id: string;
  name: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  merchant: string;
  paymentMethod: string;
  date: string;
  category: {
    name: string;
  };
  account: {
    name: string;
  };
}

interface ReportData {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    savingsRate: number;
  };
  transactions: Transaction[];
  categoryBreakdown: Array<{
    name: string;
    amount: number;
    color: string;
  }>;
  accountBreakdown: Array<{
    name: string;
    amount: number;
    type: string;
  }>;
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

export default function ReportsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Filters
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch initial filters data
  useEffect(() => {
    if (mounted) {
      const loadFilters = async () => {
        try {
          const catRes = await fetch('/api/budgets');
          const catData = await catRes.json();
          setCategories(catData.categories || []);

          const accRes = await fetch('/api/accounts');
          if (accRes.status === 401) {
            router.push('/login');
            return;
          }
          const accData = await accRes.json();
          setAccounts(accData || []);
        } catch (error) {
          console.error('Error fetching filters:', error);
        }
      };
      loadFilters();
    }
  }, [mounted]);

  // Fetch report data
  const fetchReport = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        categoryId: selectedCategory,
        accountId: selectedAccount,
      });

      const res = await fetch(`/api/reports?${queryParams.toString()}`);
      const data = await res.json();
      setReport(data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClick = () => {
    fetchReport();
    setHasGenerated(true);
  };

  if (!mounted) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!report || report.transactions.length === 0) return;

    const headers = ['Date', 'Type', 'Amount', 'Category', 'Account', 'Merchant', 'Method', 'Description'];
    const rows = report.transactions.map(tx => [
      new Date(tx.date).toLocaleDateString(),
      tx.type,
      tx.amount,
      tx.category.name,
      tx.account.name,
      tx.merchant || '',
      tx.paymentMethod || '',
      `"${(tx.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `spendwise_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Excel (.xls tab-delimited or XML spreadsheet)
  const handleExportExcel = () => {
    if (!report || report.transactions.length === 0) return;

    const tableHeaders = ['Date', 'Type', 'Category', 'Account', 'Merchant', 'Payment Method', 'Amount (INR)', 'Description'];
    const rowsHtml = report.transactions.map(tx => `
      <tr>
        <td>${new Date(tx.date).toLocaleDateString()}</td>
        <td>${tx.type}</td>
        <td>${tx.category.name}</td>
        <td>${tx.account.name}</td>
        <td>${tx.merchant || '-'}</td>
        <td>${tx.paymentMethod || '-'}</td>
        <td>${tx.amount}</td>
        <td>${tx.description || '-'}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>SpendWise Report</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta charset="utf-8">
      </head>
      <body>
        <h2>SpendWise Expense Report</h2>
        <p>Period: ${startDate} to ${endDate}</p>
        <table border="1">
          <thead>
            <tr style="background-color: #4f46e5; color: white; font-weight: bold;">
              ${tableHeaders.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `spendwise_report_${startDate}_to_${endDate}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Print / PDF View
  const handlePrintPDF = () => {
    if (!report) return;

    // Create a new window for clean printable format
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = report.transactions.map(tx => `
      <tr>
        <td>${new Date(tx.date).toLocaleDateString()}</td>
        <td>${tx.type}</td>
        <td>${tx.category.name}</td>
        <td>${tx.account.name}</td>
        <td>${tx.merchant || '-'}</td>
        <td style="text-align: right; font-weight: bold; color: ${tx.type === 'INCOME' ? '#10b981' : '#ef4444'}">
          ${tx.type === 'INCOME' ? '+' : '-'}${formatCurrency(tx.amount)}
        </td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>SpendWise Financial Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; color: #1e293b; }
            h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
            p { margin: 0; font-size: 0.9rem; color: #64748b; }
            .meta { margin-bottom: 2rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
            .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; }
            .card-label { font-size: 0.75rem; color: #64748b; margin-bottom: 0.25rem; text-transform: uppercase; }
            .card-val { font-size: 1.25rem; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
            th { text-align: left; padding: 0.75rem; border-bottom: 2px solid #cbd5e1; font-size: 0.85rem; color: #64748b; }
            td { padding: 0.75rem; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; }
          </style>
        </head>
        <body>
          <h1>SpendWise Financial Statement</h1>
          <p>Statement Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}</p>
          <div class="meta"></div>

          <div class="grid">
            <div class="card">
              <div class="card-label">Total Income</div>
              <div class="card-val" style="color: #10b981">${formatCurrency(report.summary.totalIncome)}</div>
            </div>
            <div class="card">
              <div class="card-label">Total Expenses</div>
              <div class="card-val" style="color: #ef4444">${formatCurrency(report.summary.totalExpenses)}</div>
            </div>
            <div class="card">
              <div class="card-label">Net Balance</div>
              <div class="card-val">${formatCurrency(report.summary.netBalance)}</div>
            </div>
            <div class="card">
              <div class="card-label">Savings Rate</div>
              <div class="card-val">${report.summary.savingsRate}%</div>
            </div>
          </div>

          <h3>Transaction History</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Account</th>
                <th>Merchant</th>
                <th style="text-align: right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Reports</h1>
          <p className={styles.subtitle}>Detailed breakdowns, statements, and custom exports.</p>
        </div>
      </div>

      {/* Date & Filter selectors */}
      <div className={`${styles.filtersCard} glass`}>
        {/* Start Date */}
        <div className={styles.dateGroup}>
          <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={styles.dateInput}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={styles.dateInput}
          />
        </div>

        {/* Account Filter */}
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Accounts</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Generate Report Button */}
        <button
          type="button"
          onClick={handleGenerateClick}
          className={styles.btnGenerate}
          disabled={loading}
        >
          Generate Report
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '6rem 3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Generating reports analytics and fetching details...
        </div>
      ) : !hasGenerated ? (
        <div className={styles.placeholderCard}>
          <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.7 }} />
          <h3>No Report Generated</h3>
          <p>Choose your preferred date range and filters above, then click <strong>Generate Report</strong> to fetch analytics and enable Excel/PDF downloads.</p>
        </div>
      ) : (
        <>
          {/* Summary Row */}
          <div className={styles.summaryRow}>
            <div className={`${styles.summaryCard} glass`} style={{ borderLeft: '3px solid var(--success)' }}>
              <span className={styles.summaryLabel}>Report Income</span>
              <span className={styles.summaryValue} style={{ color: 'var(--success)' }}>
                {formatCurrency(report?.summary.totalIncome || 0)}
              </span>
            </div>

            <div className={`${styles.summaryCard} glass`} style={{ borderLeft: '3px solid var(--danger)' }}>
              <span className={styles.summaryLabel}>Report Expenses</span>
              <span className={styles.summaryValue} style={{ color: 'var(--danger)' }}>
                {formatCurrency(report?.summary.totalExpenses || 0)}
              </span>
            </div>

            <div className={`${styles.summaryCard} glass`} style={{ borderLeft: '3px solid var(--info)' }}>
              <span className={styles.summaryLabel}>Net Cash Flow</span>
              <span className={styles.summaryValue}>
                {formatCurrency(report?.summary.netBalance || 0)}
              </span>
            </div>

            <div className={`${styles.summaryCard} glass`} style={{ borderLeft: '3px solid #d946ef' }}>
              <span className={styles.summaryLabel}>Savings Rate</span>
              <span className={styles.summaryValue} style={{ color: '#d946ef' }}>
                {report?.summary.savingsRate || 0}%
              </span>
            </div>
          </div>

          {/* Export buttons row */}
          <div className={styles.exportSection}>
            <button className={`${styles.exportBtn} ${styles.exportBtnPrimary}`} onClick={handleExportCSV}>
              <Download size={14} />
              Export CSV
            </button>
            <button className={`${styles.exportBtn} ${styles.exportBtnPrimary}`} onClick={handleExportExcel}>
              <FileText size={14} />
              Export Excel
            </button>
            <button className={`${styles.exportBtn} ${styles.exportBtnPrimary}`} onClick={handlePrintPDF}>
              <Printer size={14} />
              Print / PDF
            </button>
          </div>

          {/* Charts Row */}
          <div className={styles.chartsGrid}>
            <div className={`${styles.chartCard} glass`}>
              <h3 className={styles.chartTitle}>Income vs Expense</h3>
              <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: 'Totals',
                        Income: report?.summary.totalIncome || 0,
                        Expenses: report?.summary.totalExpenses || 0,
                      }
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="barIncomeRep" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#059669" stopOpacity={0.85}/>
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.45}/>
                      </linearGradient>
                      <linearGradient id="barExpenseRep" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e11d48" stopOpacity={0.85}/>
                        <stop offset="100%" stopColor="#e11d48" stopOpacity={0.45}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={{ stroke: 'rgba(0,0,0,0.1)' }} />
                    <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={{ stroke: 'rgba(0,0,0,0.1)' }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Income" fill="url(#barIncomeRep)" radius={[6, 6, 0, 0]} barSize={60} isAnimationActive={true} animationDuration={1200} />
                    <Bar dataKey="Expenses" fill="url(#barExpenseRep)" radius={[6, 6, 0, 0]} barSize={60} isAnimationActive={true} animationDuration={1200} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`${styles.chartCard} glass`}>
              <h3 className={styles.chartTitle}>Expenses Breakdown</h3>
              <div className={styles.chartWrapper}>
                {report?.categoryBreakdown.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No expenses inside range.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={report?.categoryBreakdown || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="amount"
                        isAnimationActive={true}
                        animationDuration={1000}
                      >
                        {report?.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Statement History List */}
          <div className={`${styles.tableCard} glass`}>
            <h3 className={styles.tableTitle}>Statement Transactions ({report?.transactions.length || 0})</h3>
            <div className={tableStyles.tableContainer}>
              {report?.transactions.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No transactions recorded for selected dates and criteria.
                </div>
              ) : (
                <table className={tableStyles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Merchant</th>
                      <th>Account</th>
                      <th>Category</th>
                      <th>Method</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report?.transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>{new Date(tx.date).toLocaleDateString()}</td>
                        <td>{tx.description || tx.category.name}</td>
                        <td>{tx.merchant || '-'}</td>
                        <td>{tx.account.name}</td>
                        <td>{tx.category.name}</td>
                        <td>{tx.paymentMethod}</td>
                        <td className={`${tableStyles.amount} ${tx.type === 'INCOME' ? tableStyles.incomeAmount : tableStyles.expenseAmount}`}>
                          {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
