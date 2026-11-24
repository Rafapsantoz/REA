import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar exclusão",
  message,
  itemName,
  confirmText = "Excluir",
  cancelText = "Cancelar",
  variant = 'danger'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1014]/75 backdrop-blur-xs animate-fade-in"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#151921] border border-[#E2DFD7] dark:border-[#252B37] rounded-xl p-6 shadow-2xl space-y-5 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              variant === 'danger'
                ? 'bg-red-50 text-[#B91C1C] dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900/60'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60'
            }`}>
              {variant === 'danger' ? (
                <Trash2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <h3 id="confirm-modal-title" className="font-display text-lg font-bold text-[#141619] dark:text-white leading-snug">
              {title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela"
            className="p-1.5 text-[#525866] dark:text-slate-400 hover:text-[#141619] dark:hover:text-white rounded-lg hover:bg-[#EFECE6] dark:hover:bg-[#1C212B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-sm text-[#525866] dark:text-slate-300">
          <p className="leading-relaxed">
            {message}
          </p>

          {itemName && (
            <div className="p-3 bg-[#F7F6F2] dark:bg-[#0D1014] rounded-lg border border-[#E2DFD7] dark:border-[#252B37] font-semibold text-[#141619] dark:text-slate-100 text-sm break-words">
              {itemName}
            </div>
          )}

          <p className="text-xs text-[#525866] dark:text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Esta ação é permanente e não poderá ser desfeita.</span>
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2DFD7] dark:border-[#252B37]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#E2DFD7] dark:border-[#252B37] text-sm font-semibold text-[#525866] dark:text-slate-300 hover:bg-[#EFECE6] dark:hover:bg-[#1C212B] transition-colors cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer ${
              variant === 'danger'
                ? 'bg-[#B91C1C] hover:bg-[#991B1B]'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
