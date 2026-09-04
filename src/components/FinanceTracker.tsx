import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Trash2,
  PieChart,
  IndianRupee,
  TrendingDown,
  TrendingUp,
  Tag,
  Calendar,
  CreditCard,
  Edit3,
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { formatCurrency } from '../utils/dashboardUtils';
import { ExpenseCategory } from '../types';

export const FinanceTracker: React.FC = () => {
  const {
    transactions,
    budget,
    addTransaction,
    deleteTransaction,
    updateBudget,
  } = useDashboard();

  const [formOpen, setFormOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [newBudgetVal, setNewBudgetVal] = useState(budget.toString());

  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
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
    .reduce((sum, t) => sum + t.amount, 0) || 500;

  const remainingBudget = Math.max(0, budget - totalExpense);
  const budgetSpentPct = budget > 0 ? Math.min(Math.round((totalExpense / budget) * 100), 100) : 0;

  // Category breakdown
  const categoryTotals: Record<ExpenseCategory, number> = {
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

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;

    await addTransaction({
      type: txType,
      amount: num,
      category: txType === 'income' ? 'Income' : category,
      date,
      notes: notes.trim() || undefined,
    });

    setAmount('');
    setNotes('');
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

  return (
    <div className="space-y-4" id="finance-module">
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
            {formatCurrency(budget)}
          </p>
          <div className="w-full bg-zinc-800 h-1 rounded mt-2 overflow-hidden">
            <div
              className={`h-full ${budgetSpentPct > 85 ? 'bg-rose-500' : 'bg-indigo-500'}`}
              style={{ width: `${budgetSpentPct}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-500 mt-1 font-mono">{budgetSpentPct}% UTILIZED</p>
        </div>

        {/* Card 2: Total Spent */}
        <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-lg">
          <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Total Spent This Month</p>
          <p className="text-2xl font-bold font-mono text-rose-400 mt-1">
            {formatCurrency(totalExpense)}
          </p>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            {currentMonthTx.filter((t) => t.type === 'expense').length} transactions recorded
          </p>
        </div>

        {/* Card 3: Remaining Balance */}
        <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-lg">
          <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Remaining Balance</p>
          <p className={`text-2xl font-bold font-mono mt-1 ${remainingBudget < 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {formatCurrency(remainingBudget)}
          </p>
          <p className="text-xs text-zinc-500 mt-1 font-mono">
            Available until month end
          </p>
        </div>

        {/* Card 4: Monthly Income */}
        <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-lg">
          <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Total Income Logged</p>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {formatCurrency(totalIncome)}
          </p>
          <p className="text-xs text-zinc-500 mt-1 font-mono">
            Net Savings: {formatCurrency(Math.max(0, totalIncome - totalExpense))}
          </p>
        </div>
      </div>

      {/* Main Grid: Category Breakdown (4 cols) + Transactions List (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (4 cols): Category Breakdown & Actions */}
        <div className="lg:col-span-4 space-y-4">
          <section className="bg-[#18181b] border border-[#27272a] rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black uppercase text-zinc-500 tracking-widest">
                Spending by Category
              </h2>
              <span className="text-[10px] font-mono text-zinc-500">CURRENT MONTH</span>
            </div>

            <div className="space-y-3">
              {(Object.keys(categoryTotals) as ExpenseCategory[]).map((cat) => {
                const amount = categoryTotals[cat];
                const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-300 font-medium">{cat}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-zinc-400">{pct}%</span>
                        <span className="text-zinc-100 font-bold">{formatCurrency(amount)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-800 h-1 rounded overflow-hidden">
                      <div
                        className="h-full bg-indigo-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setFormOpen(true)}
              className="w-full mt-5 bg-indigo-600 hover:bg-indigo-700 py-2 rounded text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              + LOG TRANSACTION
            </button>
          </section>
        </div>

        {/* Right Column (8 cols): Transaction History Table */}
        <div className="lg:col-span-8">
          <section className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black uppercase text-zinc-500 tracking-widest">
                Recent Transactions
              </h2>
              <span className="text-[10px] font-mono text-zinc-500">
                {transactions.length} TOTAL LOGS
              </span>
            </div>

            <div className="overflow-x-auto flex-1">
              {transactions.length > 0 ? (
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="text-[11px] font-mono uppercase text-zinc-500 border-b border-[#27272a]">
                    <tr>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Category / Title</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a]/60">
                    {transactions.map((tx) => {
                      const isExp = tx.type === 'expense';

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
                            <p className="font-bold text-zinc-200">{tx.category}</p>
                            {tx.notes && <p className="text-[11px] text-zinc-500 truncate max-w-xs">{tx.notes}</p>}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-400">{tx.date}</td>
                          <td
                            className={`py-2.5 px-3 text-right font-mono font-bold ${
                              isExp ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {isExp ? '-' : '+'}{formatCurrency(tx.amount)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => deleteTransaction(tx.id)}
                              className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center text-zinc-500 text-xs font-mono">
                  No transactions recorded yet. Click "+ LOG TRANSACTION" to add one.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Log Transaction Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                Log New Transaction
              </h3>
              <button
                onClick={() => setFormOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTx} className="space-y-3 text-xs">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-[#09090b] p-1 rounded border border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`py-1.5 rounded font-mono font-bold ${
                    txType === 'expense'
                      ? 'bg-rose-900/60 text-rose-300'
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
                      ? 'bg-emerald-900/60 text-emerald-300'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Income (+)
                </button>
              </div>

              <div>
                <label className="block font-semibold text-zinc-400 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="0"
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
                    <option value="Food">Food & Dining</option>
                    <option value="Commute">Commute / Transit</option>
                    <option value="Books">Books & Academic Supplies</option>
                    <option value="Fun">Entertainment & Leisure</option>
                    <option value="Misc">Miscellaneous</option>
                  </select>
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
                  Notes / Merchant (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. University bookstore or cafeteria"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Save Transaction
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
                <label className="block font-semibold text-zinc-400 mb-1">
                  Monthly Budget Limit (₹)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  placeholder="10000"
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
    </div>
  );
};
