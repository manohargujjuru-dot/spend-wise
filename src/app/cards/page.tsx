'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Plus, Trash2, ShieldCheck, Wifi, X, Eye, EyeOff } from 'lucide-react';
import styles from './cards.module.css';
import modalStyles from '../transactions/transactions.module.css';

interface Card {
  id: string;
  name: string;
  number: string;
  holderName: string;
  expiry: string;
  type: 'DEBIT' | 'CREDIT';
  network: 'VISA' | 'MASTERCARD' | 'RUPAY' | 'AMEX';
  bankName: string;
  createdAt: string;
}

export default function CardsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [revealedCardIds, setRevealedCardIds] = useState<string[]>([]);

  // Form states
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [type, setType] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
  const [network, setNetwork] = useState<'VISA' | 'MASTERCARD' | 'RUPAY' | 'AMEX'>('VISA');
  const [bankName, setBankName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchCards = async () => {
    try {
      const res = await fetch('/api/cards');
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
        }
        setCards([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setCards(data);
      } else {
        setCards([]);
      }
    } catch (err) {
      console.error('Error fetching cards:', err);
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchCards();
    }
  }, [mounted]);

  if (!mounted) return null;

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    // Format card number to look clean: remove spacing first, validate length
    const cleanNumber = number.replace(/\s+/g, '');
    if (cleanNumber.length < 12 || cleanNumber.length > 19) {
      setError('Please enter a valid card number (12-19 digits).');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          number: cleanNumber,
          holderName,
          expiry,
          type,
          network,
          bankName
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        // Clear form
        setName('');
        setNumber('');
        setHolderName('');
        setExpiry('');
        setType('DEBIT');
        setNetwork('VISA');
        setBankName('');
        // Refresh cards list
        fetchCards();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to save card');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;

    try {
      const res = await fetch(`/api/cards/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setCards(cards.filter((c) => c.id !== id));
      } else {
        alert('Failed to delete card');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderCardNumber = (num: string, isRevealed: boolean) => {
    const clean = num.replace(/\s+/g, '');
    const groups = [];
    
    if (isRevealed) {
      for (let i = 0; i < 4; i++) {
        groups.push(clean.slice(i * 4, (i + 1) * 4) || '••••');
      }
    } else {
      groups.push('••••');
      groups.push('••••');
      groups.push('••••');
      groups.push(clean.slice(-4) || '••••');
    }

    return (
      <div className={styles.numberSection}>
        {groups.map((group, idx) => (
          <span key={idx}>{group}</span>
        ))}
      </div>
    );
  };

  const toggleCardSecurity = (cardId: string) => {
    setRevealedCardIds(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId) 
        : [...prev, cardId]
    );
  };

  // Helper to filter card lists
  const debitCards = cards.filter((c) => c.type === 'DEBIT');
  const creditCards = cards.filter((c) => c.type === 'CREDIT');

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2.5rem' }}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Cards</h1>
          <p className={styles.subtitle}>Securely store your debit and credit cards reference details</p>
        </div>
        <button className={styles.btnAddCard} onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          Add Card
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading card vaults...</div>
      ) : (
        <>
          {/* Debit Cards Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Debit Cards</h2>
              <span className={styles.cardCount}>{debitCards.length}</span>
            </div>
            <div className={styles.grid}>
              {debitCards.length === 0 ? (
                <div className={styles.emptyState}>
                  <CreditCard size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem', opacity: 0.5 }} />
                  <p>No debit cards saved. Click "Add Card" to store one.</p>
                </div>
              ) : (
                debitCards.map((card) => {
                  const isRevealed = revealedCardIds.includes(card.id);
                  return (
                    <div 
                      key={card.id} 
                      className={`${styles.creditCardWrapper} ${styles.debitBg}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleCardSecurity(card.id)}
                    >
                      <div className={styles.cardGlow} />
                      <button 
                        className={styles.btnDeleteCard} 
                        onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }}
                      >
                        <Trash2 size={12} />
                      </button>
                      
                      <div className={styles.cardHeader}>
                        <div>
                          <span className={styles.bankName}>{card.bankName}</span>
                          <span className={styles.cardName}>{card.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 5 }}>
                          {isRevealed ? <EyeOff size={16} style={{ opacity: 0.8 }} /> : <Eye size={16} style={{ opacity: 0.8 }} />}
                          <span className={styles.networkLogo}>{card.network}</span>
                        </div>
                      </div>

                      <div className={styles.chipSection}>
                        <div className={styles.chip} />
                        <Wifi size={16} style={{ transform: 'rotate(90deg)', opacity: 0.8 }} />
                      </div>

                      {renderCardNumber(card.number, isRevealed)}

                      <div className={styles.cardFooter}>
                        <div>
                          <span className={styles.footerLabel}>Card Holder</span>
                          <span className={styles.footerVal}>{card.holderName}</span>
                        </div>
                        <div>
                          <span className={styles.footerLabel}>Expires</span>
                          <span className={styles.footerVal}>{isRevealed ? '••/••' : card.expiry}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Credit Cards Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Credit Cards</h2>
              <span className={styles.cardCount}>{creditCards.length}</span>
            </div>
            <div className={styles.grid}>
              {creditCards.length === 0 ? (
                <div className={styles.emptyState}>
                  <CreditCard size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem', opacity: 0.5 }} />
                  <p>No credit cards saved. Click "Add Card" to store one.</p>
                </div>
              ) : (
                creditCards.map((card) => {
                  const isRevealed = revealedCardIds.includes(card.id);
                  return (
                    <div 
                      key={card.id} 
                      className={`${styles.creditCardWrapper} ${styles.creditBg}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleCardSecurity(card.id)}
                    >
                      <div className={styles.cardGlow} />
                      <button 
                        className={styles.btnDeleteCard} 
                        onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }}
                      >
                        <Trash2 size={12} />
                      </button>
                      
                      <div className={styles.cardHeader}>
                        <div>
                          <span className={styles.bankName}>{card.bankName}</span>
                          <span className={styles.cardName}>{card.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 5 }}>
                          {isRevealed ? <EyeOff size={16} style={{ opacity: 0.8 }} /> : <Eye size={16} style={{ opacity: 0.8 }} />}
                          <span className={styles.networkLogo}>{card.network}</span>
                        </div>
                      </div>

                      <div className={styles.chipSection}>
                        <div className={styles.chip} />
                        <Wifi size={16} style={{ transform: 'rotate(90deg)', opacity: 0.8 }} />
                      </div>

                      {renderCardNumber(card.number, isRevealed)}

                      <div className={styles.cardFooter}>
                        <div>
                          <span className={styles.footerLabel}>Card Holder</span>
                          <span className={styles.footerVal}>{card.holderName}</span>
                        </div>
                        <div>
                          <span className={styles.footerLabel}>Expires</span>
                          <span className={styles.footerVal}>{isRevealed ? '••/••' : card.expiry}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* Add Card Modal Dialog */}
      {isModalOpen && (
        <div className={modalStyles.modalOverlay}>
          <div className={modalStyles.modal}>
            <div className={modalStyles.modalHeader}>
              <h2 className={modalStyles.modalTitle}>Save Card Details</h2>
              <button className={modalStyles.modalClose} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {error && <div className={modalStyles.errorBox}>{error}</div>}

            <form onSubmit={handleSaveCard} className={modalStyles.form}>
              <div className={modalStyles.formRow}>
                <div className={modalStyles.formGroup}>
                  <label className={modalStyles.label}>Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank, SBI, ICICI"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className={modalStyles.input}
                    required
                  />
                </div>
                <div className={modalStyles.formGroup}>
                  <label className={modalStyles.label}>Card Nickname</label>
                  <input
                    type="text"
                    placeholder="e.g. Salary Card, Shopping Credit"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={modalStyles.input}
                    required
                  />
                </div>
              </div>

              <div className={modalStyles.formGroup}>
                <label className={modalStyles.label}>Card Number</label>
                <input
                  type="text"
                  maxLength={19}
                  placeholder="e.g. 4111 2222 3333 4444"
                  value={number}
                  onChange={(e) => {
                    // Automatically add space every 4 digits for formatting
                    const value = e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
                    setNumber(value);
                  }}
                  className={modalStyles.input}
                  required
                />
              </div>

              <div className={modalStyles.formRow}>
                <div className={modalStyles.formGroup}>
                  <label className={modalStyles.label}>Card Holder Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    className={modalStyles.input}
                    required
                  />
                </div>
                <div className={modalStyles.formGroup}>
                  <label className={modalStyles.label}>Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    maxLength={5}
                    value={expiry}
                    onChange={(e) => {
                      // auto MM/YY insert slash
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length >= 2) {
                        val = val.slice(0, 2) + '/' + val.slice(2, 4);
                      }
                      setExpiry(val);
                    }}
                    className={modalStyles.input}
                    required
                  />
                </div>
              </div>

              <div className={modalStyles.formRow}>
                <div className={modalStyles.formGroup}>
                  <label className={modalStyles.label}>Card Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'DEBIT' | 'CREDIT')}
                    className={modalStyles.select}
                  >
                    <option value="DEBIT">Debit Card</option>
                    <option value="CREDIT">Credit Card</option>
                  </select>
                </div>
                <div className={modalStyles.formGroup}>
                  <label className={modalStyles.label}>Card Network</label>
                  <select
                    value={network}
                    onChange={(e) => setNetwork(e.target.value as any)}
                    className={modalStyles.select}
                  >
                    <option value="VISA">Visa</option>
                    <option value="MASTERCARD">MasterCard</option>
                    <option value="RUPAY">Rupay</option>
                    <option value="AMEX">American Express</option>
                  </select>
                </div>
              </div>

              <div className={modalStyles.modalFooter} style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className={modalStyles.btnCancel}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={modalStyles.btnSubmit}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
