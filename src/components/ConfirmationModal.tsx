import React from 'react';
import { AlertTriangle, Trash2, Calendar, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="confirmation-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div
        id="confirmation-modal-dialog"
        className="w-full max-w-md bg-[#121215] border border-[#27272a] rounded-xl shadow-2xl p-6 relative"
      >
        <button
          id="close-confirmation-modal-btn"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-md transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl flex-shrink-0 ${
              confirmVariant === 'danger'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            {confirmVariant === 'danger' ? (
              <Trash2 className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <button
            type="button"
            id="cancel-confirmation-btn"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-action-btn"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 ${
              confirmVariant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            } disabled:opacity-50`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
