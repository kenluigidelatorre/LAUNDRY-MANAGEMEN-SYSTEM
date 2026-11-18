import React, { useEffect } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Search,
  X,
} from 'lucide-react';

/* ---------- Modal ---------- */
export const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  maxWidth = 'max-w-2xl',
  children,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c182e]/50 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${maxWidth} max-h-[90vh] flex flex-col bg-white border border-[#e5eaf2] rounded-[16px] shadow-[0_24px_60px_rgba(19,33,60,0.22)] overflow-hidden`}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#e5eaf2]">
          <div>
            <h3 className="font-display text-[17px] font-bold text-[#13213c] leading-snug">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[12px] text-[#6e7891] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-[9px] border border-[#e5eaf2] text-[#6e7891] hover:text-[#17223b] hover:bg-[#f5f7fb] grid place-items-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};

/* ---------- Confirmation Dialog ---------- */
export const ConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
}) => {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-[10px] grid place-items-center shrink-0 ${
              danger ? 'bg-[#fff1f2] text-[#dc2626]' : 'bg-[#eaf2ff] text-[#246bfd]'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-[13.5px] text-[#5d6880] leading-relaxed">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-semibold text-[#5d6880] border border-[#e5eaf2] bg-white rounded-[10px] hover:bg-[#f9fbff] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-[13px] font-bold text-white rounded-[10px] transition-colors ${
              danger
                ? 'bg-[#dc2626] hover:bg-[#b91c1c]'
                : 'bg-[#246bfd] hover:bg-[#1557dc]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* ---------- Search Bar ---------- */
export const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) => (
  <label
    className={`flex items-center gap-2.5 h-[40px] px-3.5 bg-[#f9fafc] border border-[#e5eaf2] rounded-[10px] text-[#9ba6b8] focus-within:border-[#8db5ff] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#edf3ff] transition-all ${className}`}
  >
    <Search className="w-4 h-4 shrink-0" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent text-[13px] text-[#17223b] placeholder:text-[#9ba6b8]"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        aria-label="Clear search"
        className="text-[#9ba6b8] hover:text-[#17223b]"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    )}
  </label>
);

/* ---------- Pagination ---------- */
export const Pagination = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(totalItems, currentPage * pageSize);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-[#e5eaf2] text-[12px] text-[#6e7891]">
      <span className="tabular-nums">
        Showing <b className="text-[#17223b]">{start}</b>–<b className="text-[#17223b]">{end}</b> of{' '}
        <b className="text-[#17223b]">{totalItems}</b> records
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] border border-[#e5eaf2] bg-white text-[#17223b] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f5f7fb] transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
          .map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-[8px] text-[12px] font-bold tabular-nums transition-colors ${
                page === currentPage
                  ? 'bg-[#246bfd] text-white'
                  : 'border border-[#e5eaf2] bg-white text-[#5d6880] hover:bg-[#f5f7fb]'
              }`}
            >
              {page}
            </button>
          ))}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] border border-[#e5eaf2] bg-white text-[#17223b] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f5f7fb] transition-colors"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* ---------- Status Badges ---------- */
export const OrderStatusBadge = ({ status, delayed = false }) => {
  const styles = {
    'Order Received': 'bg-[#edf0f4] text-[#5d6880]',
    Pending: 'bg-[#fff4e5] text-[#c26d18]',
    Washing: 'bg-[#eaf2ff] text-[#246bfd]',
    Drying: 'bg-[#f1edff] text-[#7d5cde]',
    Folding: 'bg-[#e8f4ff] text-[#0b6bcb]',
    'Ready for Pickup': 'bg-[#e3f8f1] text-[#14936c]',
    Completed: 'bg-[#dcfce7] text-[#15803d]',
    Cancelled: 'bg-[#fff1f2] text-[#dc2626]',
  };

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span
        className={`inline-flex items-center justify-center rounded-[6px] px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${styles[status] || 'bg-[#edf0f4] text-[#5d6880]'}`}
      >
        {status}
      </span>
      {delayed && (
        <span
          title="Past expected completion date"
          className="inline-flex items-center gap-1 rounded-[6px] px-2 py-1 text-[10px] font-bold bg-[#fff1f2] text-[#dc2626] whitespace-nowrap"
        >
          <AlertTriangle className="w-3 h-3" />
          Delayed
        </span>
      )}
    </span>
  );
};

export const PaymentStatusBadge = ({ status }) => {
  const styles = {
    Paid: 'bg-[#e3f8f1] text-[#14936c]',
    'Partial Payment': 'bg-[#fff4e5] text-[#c26d18]',
    Unpaid: 'bg-[#fff1f2] text-[#dc2626]',
  };
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[6px] px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${styles[status] || 'bg-[#edf0f4] text-[#5d6880]'}`}
    >
      {status}
    </span>
  );
};

export const StockStatusBadge = ({ status }) => {
  const styles = {
    'In Stock': 'bg-[#e3f8f1] text-[#14936c]',
    'Low Stock': 'bg-[#fff4e5] text-[#c26d18]',
    'Out of Stock': 'bg-[#fff1f2] text-[#dc2626]',
  };
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[6px] px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${styles[status] || 'bg-[#edf0f4] text-[#5d6880]'}`}
    >
      {status}
    </span>
  );
};

/* ---------- Empty State ---------- */
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-14 px-6">
    <div className="w-12 h-12 rounded-[14px] bg-[#eaf2ff] text-[#246bfd] grid place-items-center mb-3.5">
      {icon}
    </div>
    <h4 className="font-display text-[15px] font-bold text-[#13213c]">{title}</h4>
    <p className="text-[13px] text-[#6e7891] max-w-sm mt-1">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

/* ---------- Toast Container ---------- */
export const ToastContainer = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none no-print">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-2.5 bg-[#13213c] text-white px-4 py-2.5 rounded-[10px] shadow-[0_14px_40px_rgba(39,59,103,0.28)] text-[12.5px] font-medium"
        >
          <span
            className={`w-5 h-5 rounded-full grid place-items-center shrink-0 ${
              toast.type === 'error'
                ? 'bg-[#ff5965]'
                : toast.type === 'info'
                ? 'bg-[#246bfd]'
                : 'bg-[#28b987]'
            }`}
          >
            {toast.type === 'error' ? (
              <X className="w-3 h-3 text-white" />
            ) : toast.type === 'info' ? (
              <Info className="w-3 h-3 text-white" />
            ) : (
              <Check className="w-3 h-3 text-white" />
            )}
          </span>
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="ml-1 text-[#aab7cc] hover:text-white"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
