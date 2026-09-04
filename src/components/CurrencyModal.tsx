import React, { useMemo, useState } from 'react';
import { Check, Coins, Globe, Search, X } from 'lucide-react';
import { ALL_CURRENCIES, POPULAR_CURRENCIES, CurrencyOption } from '../data/currencies';
import { useDashboard } from '../context/DashboardContext';

interface CurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CurrencyModal: React.FC<CurrencyModalProps> = ({ isOpen, onClose }) => {
  const { currency, setCurrency } = useDashboard();
  const [searchQuery, setSearchQuery] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredCurrencies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ALL_CURRENCIES;
    return ALL_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSelectCurrency = async (code: string) => {
    setSaving(true);
    try {
      await setCurrency(code);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = customCode.trim().toUpperCase();
    if (code.length >= 2 && code.length <= 5) {
      setSaving(true);
      try {
        await setCurrency(code);
        setCustomCode('');
        onClose();
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div
      id="currency-selection-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272a]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-900/50 text-indigo-400">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                Select Currency
              </h3>
              <p className="text-xs text-zinc-400">
                Choose the currency for all financial tracking and budgets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Currency Banner */}
        <div className="px-5 py-2.5 bg-zinc-900/70 border-b border-[#27272a] flex items-center justify-between text-xs">
          <span className="text-zinc-400">Current tracking currency:</span>
          <span className="font-mono font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-900/60">
            {currency}
          </span>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-[#27272a] bg-[#18181b] space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by currency name, code (USD, EUR, INR...), or symbol..."
              className="w-full pl-9 pr-4 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Popular Picks */}
          {!searchQuery && (
            <div>
              <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                Popular Currencies
              </p>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_CURRENCIES.map((c) => {
                  const isSelected = currency === c.code;
                  return (
                    <button
                      key={c.code}
                      onClick={() => handleSelectCurrency(c.code)}
                      disabled={saving}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                          : 'bg-[#09090b] border-[#27272a] text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      <span className="font-bold">{c.code}</span>
                      <span className="text-zinc-400 text-[11px]">({c.symbol})</span>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Scrollable List of All Currencies */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 p-2 space-y-0.5">
          {filteredCurrencies.length > 0 ? (
            filteredCurrencies.map((c: CurrencyOption) => {
              const isSelected = currency === c.code;
              return (
                <button
                  key={c.code}
                  onClick={() => handleSelectCurrency(c.code)}
                  disabled={saving}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-indigo-950/50 text-indigo-200 border border-indigo-800/60'
                      : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-12 font-mono font-bold text-xs bg-zinc-900 border border-[#27272a] px-2 py-1 rounded text-center text-zinc-200">
                      {c.code}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-zinc-200">{c.name}</p>
                      <p className="text-[11px] font-mono text-zinc-500">Symbol: {c.symbol}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-zinc-400">{c.symbol}</span>
                    {isSelected && (
                      <span className="p-1 rounded-full bg-indigo-600 text-white">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500 space-y-2">
              <Globe className="w-8 h-8 text-zinc-600 mx-auto" />
              <p>No currencies matched &quot;{searchQuery}&quot;</p>
              <p className="text-zinc-600">You can add it as a custom currency code below.</p>
            </div>
          )}
        </div>

        {/* Custom Currency Code Fallback */}
        <div className="p-3 border-t border-[#27272a] bg-zinc-900/60">
          <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 shrink-0">Other ISO Code:</span>
            <input
              type="text"
              maxLength={5}
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
              placeholder="e.g. BTC, ETH, SOL"
              className="flex-1 px-2.5 py-1.5 bg-[#09090b] border border-[#27272a] rounded text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-hidden focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!customCode.trim() || saving}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs font-mono font-bold text-zinc-200 rounded transition-colors"
            >
              Use Custom
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#27272a] bg-[#18181b] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
