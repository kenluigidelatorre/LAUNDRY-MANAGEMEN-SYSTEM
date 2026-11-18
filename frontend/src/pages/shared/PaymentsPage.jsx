import React, { useMemo, useState } from 'react';
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Edit3,
  Eye,
  Plus,
  Printer,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateTime, formatPHP } from '../../utils/formatters';
import {
  EmptyState,
  Modal,
  Pagination,
  PaymentStatusBadge,
  SearchBar,
} from '../../components/common/UIPrimitives';
import { StatCard } from '../../components/dashboard/DashboardWidgets';
import { RecordPaymentModal } from '../../components/payments/RecordPaymentModal';
import { ReceiptModal } from '../../components/common/ReceiptModal';

export const PaymentsPage = () => {
  const { orders, transactions, updateTransaction } = useApp();

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [recordOpen, setRecordOpen] = useState(false);
  const [viewingTxn, setViewingTxn] = useState(null);
  const [editingTxn, setEditingTxn] = useState(null);
  const [receiptData, setReceiptData] = useState(null);

  const [editMethod, setEditMethod] = useState('Cash');
  const [editRef, setEditRef] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const summary = useMemo(() => {
    const totalCollected = transactions.reduce((s, t) => s + t.amountPaid, 0);
    const outstanding = orders
      .filter((o) => o.laundryStatus !== 'Cancelled')
      .reduce((s, o) => s + o.remainingBalance, 0);
    const cashSum = transactions
      .filter((t) => t.paymentMethod === 'Cash')
      .reduce((s, t) => s + t.amountPaid, 0);
    const ewalletSum = transactions
      .filter((t) => t.paymentMethod === 'GCash' || t.paymentMethod === 'Maya')
      .reduce((s, t) => s + t.amountPaid, 0);
    return { totalCollected, outstanding, cashSum, ewalletSum };
  }, [transactions, orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (methodFilter !== 'ALL' && t.paymentMethod !== methodFilter) return false;
      if (statusFilter !== 'ALL' && t.paymentStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        t.id.toLowerCase().includes(q) ||
        t.orderId.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        (t.referenceNumber || '').toLowerCase().includes(q)
      );
    });
  }, [transactions, search, methodFilter, statusFilter]);

  const pageSize = 8;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleOpenReceipt = (txn) => {
    const order = orders.find((o) => o.id === txn.orderId);
    if (order) setReceiptData({ order, txn });
  };

  const openEditTxn = (txn) => {
    setEditingTxn(txn);
    setEditMethod(txn.paymentMethod);
    setEditRef(txn.referenceNumber || '');
    setEditNotes(txn.notes || '');
  };

  const handleSaveTxnEdit = async (e) => {
    e.preventDefault();
    if (!editingTxn) return;
    setSavingEdit(true);
    try {
      const updated = await updateTransaction({
        ...editingTxn,
        paymentMethod: editMethod,
        referenceNumber: editRef.trim() || undefined,
        notes: editNotes.trim() || undefined,
      });
      if (updated) setEditingTxn(null);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Collected (PHP)"
          value={formatPHP(summary.totalCollected)}
          subtext={`${transactions.length} transactions`}
          subtextTone="green"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBg="bg-[#e3f8f1] text-[#14936c]"
        />
        <StatCard
          label="Remaining Receivables"
          value={formatPHP(summary.outstanding)}
          subtext="Unpaid & partial orders"
          subtextTone={summary.outstanding > 0 ? 'amber' : 'green'}
          icon={<Wallet className="w-5 h-5" />}
          iconBg="bg-[#fff4e5] text-[#c26d18]"
        />
        <StatCard
          label="Cash Payments"
          value={formatPHP(summary.cashSum)}
          subtext="Over-the-counter"
          subtextTone="blue"
          icon={<Banknote className="w-5 h-5" />}
        />
        <StatCard
          label="GCash & Maya"
          value={formatPHP(summary.ewalletSum)}
          subtext="Digital wallets"
          subtextTone="blue"
          icon={<Smartphone className="w-5 h-5" />}
          iconBg="bg-[#f1edff] text-[#7d5cde]"
        />
      </section>

      <section className="border border-[#e5eaf2] bg-white rounded-[14px]">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-b border-[#e5eaf2]">
          <div>
            <h2 className="font-display text-[16px] font-bold text-[#13213c]">
              Payment Ledger &amp; Transactions
            </h2>
            <p className="text-[12px] text-[#6e7891] mt-0.5">
              All monetary values in official Philippine Peso (₱) · Supports Cash, GCash, and Maya.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRecordOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#246bfd] hover:bg-[#1557dc] text-white text-[13px] font-bold shadow-[0_8px_20px_rgba(36,107,253,0.2)] transition-all"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        </div>

        <div className="p-4 border-b border-[#e5eaf2] flex flex-wrap items-center gap-2.5 bg-[#fcfdff]">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search Transaction ID, Order ID, Customer, or Ref #..."
            className="flex-1 min-w-[230px]"
          />

          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1);
            }}
            className="h-[40px] px-3 rounded-[10px] border border-[#e5eaf2] bg-white text-[12.5px]"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="GCash">GCash</option>
            <option value="Maya">Maya</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-[40px] px-3 rounded-[10px] border border-[#e5eaf2] bg-white text-[12.5px]"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partial Payment">Partial Payment</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>

        {paged.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="w-6 h-6" />}
            title="No transactions found"
            description="Record a payment for an unpaid or partially paid order."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse">
                <thead>
                  <tr className="bg-[#fafbfc] text-[10.5px] font-bold uppercase tracking-[0.5px] text-[#8b96aa]">
                    <th className="text-left px-5 py-3">Transaction ID</th>
                    <th className="text-left px-4 py-3">Order ID</th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-right px-4 py-3">Amount Paid</th>
                    <th className="text-right px-4 py-3">Remaining Bal</th>
                    <th className="text-left px-4 py-3">Method</th>
                    <th className="text-left px-4 py-3">Payment Date</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Processed By</th>
                    <th className="text-right px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5eaf2] text-[12.5px]">
                  {paged.map((t) => (
                    <tr key={t.id} className="hover:bg-[#f9fbff] transition-colors">
                      <td className="px-5 py-3.5 font-display font-bold text-[#13213c] tabular-nums">
                        {t.id}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#246bfd] tabular-nums">
                        {t.orderId}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-[#17223b]">
                        {t.customerName}
                      </td>
                      <td className="px-4 py-3.5 text-right font-extrabold text-[#14936c] tabular-nums">
                        {formatPHP(t.amountPaid)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-[#5d6880]">
                        {formatPHP(t.remainingBalance)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-[#17223b]">{t.paymentMethod}</span>
                        {t.referenceNumber && (
                          <small className="block text-[10.5px] text-[#929bad] tabular-nums">
                            Ref: {t.referenceNumber}
                          </small>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-[#5d6880] tabular-nums whitespace-nowrap">
                        {formatDateTime(t.paymentDate)}
                      </td>
                      <td className="px-4 py-3.5">
                        <PaymentStatusBadge status={t.paymentStatus} />
                      </td>
                      <td className="px-4 py-3.5 text-[#5d6880]">{t.processedBy}</td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          title="View Details"
                          onClick={() => setViewingTxn(t)}
                          className="p-1.5 rounded-[7px] text-[#6e7891] hover:text-[#246bfd] hover:bg-[#eaf2ff]"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Update Payment Info"
                          onClick={() => openEditTxn(t)}
                          className="p-1.5 rounded-[7px] text-[#6e7891] hover:text-[#13213c] hover:bg-[#f1f3f7] ml-1"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Print Official Receipt"
                          onClick={() => handleOpenReceipt(t)}
                          className="p-1.5 rounded-[7px] text-[#6e7891] hover:text-[#13213c] hover:bg-[#f1f3f7] ml-1"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={page}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </>
        )}
      </section>

      <RecordPaymentModal open={recordOpen} onClose={() => setRecordOpen(false)} />

      <Modal
        open={Boolean(viewingTxn)}
        onClose={() => setViewingTxn(null)}
        title={viewingTxn ? `Transaction · ${viewingTxn.id}` : ''}
        subtitle="Wash n' Dash Payment Record"
        maxWidth="max-w-md"
      >
        {viewingTxn && (
          <div className="space-y-3 text-[13px]">
            <div className="flex justify-between py-2 border-b border-[#e5eaf2]">
              <span className="text-[#6e7891]">Order ID</span>
              <b className="text-[#246bfd] tabular-nums">{viewingTxn.orderId}</b>
            </div>
            <div className="flex justify-between py-2 border-b border-[#e5eaf2]">
              <span className="text-[#6e7891]">Customer</span>
              <b>{viewingTxn.customerName}</b>
            </div>
            <div className="flex justify-between py-2 border-b border-[#e5eaf2] tabular-nums">
              <span className="text-[#6e7891]">Amount Paid</span>
              <b className="text-[#14936c]">{formatPHP(viewingTxn.amountPaid)}</b>
            </div>
            <div className="flex justify-between py-2 border-b border-[#e5eaf2] tabular-nums">
              <span className="text-[#6e7891]">Remaining Balance</span>
              <b>{formatPHP(viewingTxn.remainingBalance)}</b>
            </div>
            <div className="flex justify-between py-2 border-b border-[#e5eaf2]">
              <span className="text-[#6e7891]">Payment Method</span>
              <b>{viewingTxn.paymentMethod}</b>
            </div>
            {viewingTxn.referenceNumber && (
              <div className="flex justify-between py-2 border-b border-[#e5eaf2]">
                <span className="text-[#6e7891]">Reference Number</span>
                <b className="tabular-nums">{viewingTxn.referenceNumber}</b>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-[#e5eaf2]">
              <span className="text-[#6e7891]">Processed By</span>
              <b>{viewingTxn.processedBy}</b>
            </div>
            <div className="flex justify-between py-2 border-b border-[#e5eaf2]">
              <span className="text-[#6e7891]">Payment Date</span>
              <b className="tabular-nums">{formatDateTime(viewingTxn.paymentDate)}</b>
            </div>
            {viewingTxn.notes && (
              <div className="bg-[#f5f7fb] rounded-[9px] p-3 text-[12px] text-[#5d6880]">
                <b>Notes: </b>
                {viewingTxn.notes}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleOpenReceipt(viewingTxn)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[9px] bg-[#246bfd] text-white text-[12.5px] font-bold"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(editingTxn)}
        onClose={() => setEditingTxn(null)}
        title={editingTxn ? `Update Payment Info · ${editingTxn.id}` : ''}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveTxnEdit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
              Payment Method
            </label>
            <select
              value={editMethod}
              onChange={(e) => setEditMethod(e.target.value)}
              className="w-full h-[42px] px-3 rounded-[10px] border border-[#e5eaf2] text-[13px] bg-white"
            >
              <option value="Cash">Cash</option>
              <option value="GCash">GCash</option>
              <option value="Maya">Maya</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
              Reference Number (Optional)
            </label>
            <input
              type="text"
              value={editRef}
              onChange={(e) => setEditRef(e.target.value)}
              className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
              Notes
            </label>
            <input
              type="text"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingTxn(null)}
              className="px-4 py-2 rounded-[9px] border border-[#e5eaf2] text-[13px] font-semibold text-[#5d6880]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="px-4 py-2 rounded-[9px] bg-[#246bfd] text-white text-[13px] font-bold disabled:opacity-60"
            >
              {savingEdit ? 'Saving...' : 'Save Payment Info'}
            </button>
          </div>
        </form>
      </Modal>

      <ReceiptModal
        open={Boolean(receiptData)}
        onClose={() => setReceiptData(null)}
        order={receiptData?.order || null}
        transaction={receiptData?.txn || null}
      />
    </div>
  );
};
