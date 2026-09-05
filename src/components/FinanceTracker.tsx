import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  PieChart,
  Edit3,
  Globe,
  Coins,
  Filter,
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { formatCurrency, getCurrencySymbol } from '../utils/dashboardUtils';
import { ExpenseCategory, Transaction } from '../types';
import { CurrencyModal } from './CurrencyModal';

const CATEGORY_CONFIG: Record<
  ExpenseCategory,
  { label: string; sublabel: string; color: string; barColor: string; badge: string }
> = {
  Essentials: {
    label: 'Essentials',
    sublabel: 'Rent, Mess, Bills, Utilities',
    color: 'text-amber-400',
    barColor: 'bg-amber-500',
    badge: 'bg-amber-950/50 text-amber-400 border border-amber-900/50',
  },
  Food: {
    label: 'Food & Dining',
    sublabel: 'Dining Out, Cafeteria, Takeout',
    color: 'text-emerald-400',
    barColor: 'bg-emerald-500',
    badge: 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/50',
  },
  Commute: {
    label: 'Commute / Transit',
    sublabel: 'Bus, Metro, Fuel, Cabs',
    color: 'text-blue-400',
    barColor: 'bg-blue-500',
    badge: 'bg-blue-950/50 text-blue-400 border border-blue-900/50',
  },
  Books: {
    label: 'Books & Academic Supplies',
    sublabel: 'Textbooks, Stationery, Print',
    color: 'text-purple-400',
    barColor: 'bg-purple-500',
    badge: 'bg-purple-950/50 text-purple-400 border border-purple-900/50',
  },
  Fun: {
    label: 'Entertainment & Leisure',
    sublabel: 'Movies, Gaming, Outings',
    color: 'text-pink-400',
    barColor: 'bg-pink-500',
    badge: 'bg-pink-950/50 text-pink-400 border border-pink-900/50',
  },
  Misc: {
    label: 'Miscellaneous',
    sublabel: 'General & other expenses',
    color: 'text-zinc-400',
    barColor: 'bg-zinc-500',
    badge: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
  },
};

export const FinanceTracker: React.FC = () => {
  const {
    transactions,
    budget,
    currency,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateBudget,
  } = useDashboard();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [newBudgetVal, setNewBudgetVal] = useState(budget.toString());
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Essentials');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState('');

  // Calculate current month's transactions
  const currentMonth = new Date().toISOString().substring(0, 7);
  const currentMonthTx = transactions.filter((t) => t.date.startsWith(currentMonth));

  const totalExpense = currentMonthTx
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = currentMonthTx
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const remainingBudget = Math.max(0, budget - totalExpense);
  const budgetSpentPct = budget > 0 ? Math.min(Math.round((totalExpense / budget) * 100), 100) : 0;

  const currSymbol = getCurrencySymbol(currency);

  // Category breakdown
  const categoryTotals: Record<ExpenseCategory, number> = {
    Essentials: 0,
    Food: 0,
    Commute: 0,
    Books: 0,
    Fun: 0,
    Misc: 0,
  };

  currentMonthTx
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = t.category as ExpenseCategory;
      if (categoryTotals[cat] !== undefined) {
        categoryTotals[cat] += t.amount;
      } else {
        categoryTotals.Misc += t.amount;
      }
    });

  const handleOpenAdd = () => {
    setEditingTx(null);
    setTxType('expense');
    setAmount('');
    setCategory('Essentials');
    setDate(new Date().toISOString().substring(0, 10));
    setNotes('');
    setFormOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setTxType(tx.type);
    setAmount(tx.amount.toString());
    setCategory(tx.type === 'expense' && tx.category !== 'Income' ? (tx.category as ExpenseCategory) : 'Essentials');
    setDate(tx.date);
    setNotes(tx.notes || '');
    setFormOpen(true);
  };

  const handleSaveTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;

    if (editingTx) {
      await updateTransaction(editingTx.id, {
        type: txType,
        amount: num,
        category: txType === 'income' ? 'Income' : category,
        date,
        notes: notes.trim() || undefined,
      });
    } else {
      await addTransaction({
        type: txType,
        amount: num,
        category: txType === 'income' ? 'Income' : category,
        date,
        notes: notes.trim() || undefined,
      });
    }

    setAmount('');
    setNotes('');
    setEditingTx(null);
    setFormOpen(false);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const b = parseFloat(newBudgetVal);
    if (!isNaN(b) && b > 0) {
      await updateBudget(b);
      setBudgetModalOpen(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'income') return tx.type === 'income';
    return tx.category === categoryFilter;
  });

  return (
    <div className="space-y-4" id="finance-module">
      {/* Header bar with Currency selector */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-[#27272a]/60">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-indigo-400" />
            Financial Management & Budget Tracking
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="open-currency-modal-btn"
            onClick={() => setCurrencyModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-[#27272a] hover:border-indigo-500/60 text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
            title="Click to change tracking currency"
          >
            <Coins className="w-3.5 h-3.5 text-indigo-400" />
            <span>Currency: <strong className="text-indigo-400 font-bold">{currency}</strong> ({currSymbol})</span>
            <span className="text-[10px] text-zinc-500 underline ml-1">Change</span>
          </button>

          <button
            onClick={() => setFormOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Log Transaction
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Monthly Budget */}
        <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Monthly Budget</p>
            <button
              onClick={() => {
                setNewBudgetVal(budget.toString());
                setBudgetModalOpen(true);
              }}
              className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded"
              title="Edit monthly budget"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-2xl font-bold font-mono text-zinc-100 mt-1">
            {formatCurrency(budget, currency)}
          </p>
          <div className="w-full bg-zinc-800 h-1 rounded mt-2 overflow-hidden">
            <div
              className={`h-full ${budgetSpentPct > 85 ? 'bg-rose-500' : 'bg-indigo-500'}`}
              style={{ width: `${budgetSpentPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1 font-mono">
            <span>{budgetSpentPct}% UTILIZED</span>
            <button
              onClick={() => setCurrencyModalOpen(true)}
              className="text-indigo-400 hover:text-indigo-300"
            >
              {currency} ({currSymbol})
            </button>
          </div>
        </div>

        {/* Card 2: Total Spent */}
        <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-lg">
          <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Total Spent This Month</p>
          <p className="text-2xl font-bold font-mono text-rose-400 mt-1">
            {formatCurrency(totalExpense, currency)}
          </p>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            {currentMonthTx.filter((t) => t.type === 'expense').length} transactions recorded
          </p>
        </div>

        {/* Card 3: Remaining Balance */}
        <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-lg">
          <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Remaining Balance</p>
          <p className={`text-2xl font-bold font-mono mt-1 ${remainingBudget < 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {formatCurrency(remainingBudget, currency)}
          </p>
          <p className="text-xs text-zinc-500 mt-1 font-mono">
            Available until month end
          </p>
        </div>

        {/* Card 4: Monthly Income */}
        <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-lg">
          <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Total Income Logged</p>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {formatCurrency(totalIncome, currency)}
          </p>
          <p className="text-xs text-zinc-500 mt-1 font-mono">
            Net Savings: {formatCurrency(Math.max(0, totalIncome - totalExpense), currency)}
          </p>
        </div>
      </div>

      {/* Main Grid: Category Breakdown & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (4 cols): Category Breakdown */}
        <div className="lg:col-span-4">
          <section className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black uppercase text-zinc-500 tracking-widest flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-indigo-400" />
                Spending Breakdown
              </h2>
              <span className="text-[10px] font-mono text-zinc-500">{currentMonth}</span>
            </div>

            <div className="space-y-4 flex-1">
              {(Object.keys(categoryTotals) as ExpenseCategory[]).map((cat) => {
                const amount = categoryTotals[cat];
                const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
                const conf = CATEGORY_CONFIG[cat];

                return (
                  <div key={cat} className="space-y-1.5 p-2 rounded-md bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700/60 transition-colors">
                    <div className="flex justify-between items-baseline text-xs">
                      <div>
                        <span className="text-zinc-200 font-semibold">{conf.label}</span>
                        <p className="text-[10px] text-zinc-500 font-mono leading-tight">{conf.sublabel}</p>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-right shrink-0">
                        <span className="text-zinc-400 text-[11px]">{pct}%</span>
                        <span className={`font-bold ${conf.color}`}>{formatCurrency(amount, currency)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${conf.barColor} transition-all duration-300`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleOpenAdd}
              className="w-full mt-5 bg-indigo-600 hover:bg-indigo-700 py-2 rounded text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              + LOG TRANSACTION
            </button>
          </section>
        </div>

        {/* Right Column (8 cols): Transaction History Table */}
        <div className="lg:col-span-8">
          <section className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <h2 className="text-xs font-black uppercase text-zinc-400 tracking-widest">
                  Transaction History & Categorization
                </h2>
                <p className="text-[10px] text-zinc-500 font-mono">
                  {filteredTransactions.length} of {transactions.length} records shown
                </p>
              </div>

              <button
                onClick={handleOpenAdd}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3 text-indigo-400" />
                Add Record
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 text-[11px] font-mono scrollbar-none border-b border-zinc-800/80">
              <span className="text-zinc-500 text-[10px] uppercase font-bold flex items-center gap-1 mr-1 shrink-0">
                <Filter className="w-3 h-3 text-zinc-400" /> Filter:
              </span>
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-0.5 rounded text-xs transition-colors shrink-0 ${
                  categoryFilter === 'all'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-zinc-800/70 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All ({transactions.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('Essentials')}
                className={`px-2.5 py-0.5 rounded text-xs transition-colors shrink-0 flex items-center gap-1 ${
                  categoryFilter === 'Essentials'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-amber-950/30 text-amber-300/80 hover:text-amber-200 border border-amber-900/40'
                }`}
              >
                <span>🏠 Essentials</span>
                <span className="text-[10px] opacity-75">
                  ({transactions.filter((t) => t.category === 'Essentials').length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('Food')}
                className={`px-2.5 py-0.5 rounded text-xs transition-colors shrink-0 flex items-center gap-1 ${
                  categoryFilter === 'Food'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-emerald-950/30 text-emerald-300/80 hover:text-emerald-200 border border-emerald-900/40'
                }`}
              >
                <span>🍽️ Food</span>
                <span className="text-[10px] opacity-75">
                  ({transactions.filter((t) => t.category === 'Food').length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('Commute')}
                className={`px-2.5 py-0.5 rounded text-xs transition-colors shrink-0 ${
                  categoryFilter === 'Commute'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-zinc-800/70 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Commute ({transactions.filter((t) => t.category === 'Commute').length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('Books')}
                className={`px-2.5 py-0.5 rounded text-xs transition-colors shrink-0 ${
                  categoryFilter === 'Books'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'bg-zinc-800/70 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Books ({transactions.filter((t) => t.category === 'Books').length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('Fun')}
                className={`px-2.5 py-0.5 rounded text-xs transition-colors shrink-0 ${
                  categoryFilter === 'Fun'
                    ? 'bg-pink-600 text-white font-bold'
                    : 'bg-zinc-800/70 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Fun ({transactions.filter((t) => t.category === 'Fun').length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('Misc')}
                className={`px-2.5 py-0.5 rounded text-xs transition-colors shrink-0 ${
                  categoryFilter === 'Misc'
                    ? 'bg-zinc-600 text-white font-bold'
                    : 'bg-zinc-800/70 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Misc ({transactions.filter((t) => t.category === 'Misc').length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('income')}
                className={`px-2.5 py-0.5 rounded text-xs transition-colors shrink-0 ${
                  categoryFilter === 'income'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-zinc-800/70 text-emerald-400/80 hover:text-emerald-300'
                }`}
              >
                Income ({transactions.filter((t) => t.type === 'income').length})
              </button>
            </div>

            <div className="overflow-x-auto flex-1">
              {filteredTransactions.length > 0 ? (
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="text-[11px] font-mono uppercase text-zinc-500 border-b border-[#27272a]">
                    <tr>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Notes</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Amount ({currSymbol})</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a]/60">
                    {filteredTransactions.map((tx) => {
                      const isExp = tx.type === 'expense';
                      const catConf = tx.category !== 'Income' ? CATEGORY_CONFIG[tx.category as ExpenseCategory] : null;

                      return (
                        <tr key={tx.id} className="hover:bg-zinc-900/50 transition-colors">
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                isExp
                                  ? 'bg-rose-950/50 text-rose-400 border border-rose-900/50'
                                  : 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/50'
                              }`}
                            >
                              {isExp ? '- EXPENSE' : '+ INCOME'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  isExp && catConf
                                    ? catConf.badge
                                    : 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/50'
                                }`}
                              >
                                {tx.category === 'Essentials'
                                  ? '🏠 Essentials'
                                  : tx.category === 'Food'
                                  ? '🍽️ Food & Dining'
                                  : tx.category}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            {tx.notes ? (
                              <p className="text-[11px] text-zinc-300 truncate max-w-xs">{tx.notes}</p>
                            ) : (
                              <span className="text-[10px] text-zinc-600 font-mono italic">None</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-400">{tx.date}</td>
                          <td
                            className={`py-2.5 px-3 text-right font-mono font-bold ${
                              isExp ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {isExp ? '-' : '+'}{formatCurrency(tx.amount, currency)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(tx)}
                                className="p-1 rounded text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 transition-colors"
                                title="Edit / Re-categorize (e.g. change to Essentials)"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteTransaction(tx.id)}
                                className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                                title="Delete record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center text-zinc-500 font-mono text-xs">
                  No transactions match the selected filter. Click &quot;+ Log Transaction&quot; to add one.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Log / Edit Transaction Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                  {editingTx ? 'Edit Transaction / Re-categorize' : 'Log Financial Transaction'}
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono">
                  {editingTx
                    ? 'Update amount, notes, or change category to Essentials (Rent/Mess)'
                    : 'Record student expense or income with accurate category tracking'}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingTx(null);
                  setFormOpen(false);
                }}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTx} className="space-y-3 text-xs">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#09090b] rounded border border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`py-1.5 rounded font-mono font-bold ${
                    txType === 'expense'
                      ? 'bg-rose-950/60 text-rose-300'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Expense (-)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={`py-1.5 rounded font-mono font-bold ${
                    txType === 'income'
                      ? 'bg-emerald-950/60 text-emerald-300'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Income (+)
                </button>
              </div>

              <div>
                <label className="block font-semibold text-zinc-400 mb-1">
                  Amount ({currSymbol}) *
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 font-mono text-sm focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {txType === 'expense' && (
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Essentials">🏠 Essentials (Rent, Mess, Bills, Utilities)</option>
                    <option value="Food">🍽️ Food & Dining (Dining Out, Cafeteria, Snacks)</option>
                    <option value="Commute">🚌 Commute / Transit (Metro, Bus, Fuel, Cab)</option>
                    <option value="Books">📚 Books & Academic Supplies</option>
                    <option value="Fun">🍿 Entertainment & Leisure</option>
                    <option value="Misc">📦 Miscellaneous</option>
                  </select>
                  {category === 'Essentials' && (
                    <p className="text-[11px] text-amber-400/90 mt-1 font-mono">
                      ✓ Selected for fixed living expenses like room rent, hostel mess charge, wifi, and electricity bills.
                    </p>
                  )}
                  {category === 'Food' && (
                    <p className="text-[11px] text-emerald-400/90 mt-1 font-mono">
                      ✓ For daily food, eating out, cafe visits, and snacks (excluding hostel mess charges).
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block font-semibold text-zinc-400 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 font-mono focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-400 mb-1">
                  Notes / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly rent, hostel mess fee, or textbook"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTx(null);
                    setFormOpen(false);
                  }}
                  className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  {editingTx ? 'Update Transaction' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Budget Modal */}
      {budgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#18181b] border border-[#27272a] rounded-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                Set Monthly Budget
              </h3>
              <button
                onClick={() => setBudgetModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-zinc-400">
                    Monthly Budget Limit ({currSymbol})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setBudgetModalOpen(false);
                      setCurrencyModalOpen(true);
                    }}
                    className="text-[11px] text-indigo-400 hover:underline"
                  >
                    Change Currency ({currency})
                  </button>
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="2000"
                  value={newBudgetVal}
                  onChange={(e) => setNewBudgetVal(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 font-mono text-sm focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setBudgetModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Update Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Currency Selector Modal */}
      <CurrencyModal
        isOpen={currencyModalOpen}
        onClose={() => setCurrencyModalOpen(false)}
      />
    </div>
  );
};
