import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatPHP } from '../../utils/formatters';
import { Modal } from '../common/UIPrimitives';

export const RecordPaymentModal = ({ open, onClose, preselectedOrder }) => {
  const { orders, recordPayment } = useApp();

  const payableOrders = orders.filter(
    (o) => o.remainingBalance > 0 && o.laundryStatus !== 'Cancelled'
  );

  const [orderId, setOrderId] = useState(preselectedOrder?.id || payableOrders[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setSubmitting(false);
    const target = preselectedOrder || payableOrders[0];
    setOrderId(target?.id || '');
    setAmount(target ? String(target.remainingBalance) : '');
    setMethod('Cash');
    setReferenceNumber('');
    setNotes('');
  }, [open, preselectedOrder]);

  const selectedOrder = orders.find((o) => o.id === orderId) || null;
  const amountNum = Math.max(0, parseFloat(amount) || 0);
  const projectedBalance = selectedOrder
    ? Math.max(0, Math.round((selectedOrder.remainingBalance - amountNum) * 100) / 100)
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) {
      setError('Please select an order with an unpaid balance.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await recordPayment({
        orderId: selectedOrder.id,
        amount: amountNum,
        method,
        referenceNumber,
        notes,
      });
      if (!res.ok) {
        setError(res.error || 'Unable to record payment.');
        return;
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record Customer Payment"
      subtitle="Supports full or partial payments in Philippine Peso (₱) via Cash, GCash, or Maya."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-[10px] bg-[#fff1f2] border border-[#fecdd3] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#dc2626]">
            {error}
          </div>
        )}

        <div>
          <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
            Select Order with Balance
          </label>
          <select
            value={orderId}
            onChange={(e) => {
              const nextId = e.target.value;
              setOrderId(nextId);
              const found = orders.find((o) => o.id === nextId);
              if (found) setAmount(String(found.remainingBalance));
            }}
            className="w-full h-[42px] px-3 rounded-[10px] border border-[#e5eaf2] text-[13px] bg-white"
          >
            {payableOrders.length === 0 ? (
              <option value="">All active orders are fully paid</option>
            ) : (
              payableOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id} — {o.customerName} (Balance: {formatPHP(o.remainingBalance)})
                </option>
              ))
            )}
          </select>
        </div>

        {selectedOrder && (
          <div className="grid grid-cols-3 gap-2 bg-[#f5f7fb] border border-[#e5eaf2] rounded-[10px] p-3 text-[12px] tabular-nums">
            <div>
              <span className="text-[#6e7891] block text-[10.5px]">Order Total</span>
              <b>{formatPHP(selectedOrder.totalAmount)}</b>
            </div>
            <div>
              <span className="text-[#6e7891] block text-[10.5px]">Already Paid</span>
              <b className="text-[#14936c]">{formatPHP(selectedOrder.amountPaid)}</b>
            </div>
            <div>
              <span className="text-[#6e7891] block text-[10.5px]">Balance Due</span>
              <b className="text-[#dc2626]">{formatPHP(selectedOrder.remainingBalance)}</b>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
              Payment Amount (₱)
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] tabular-nums focus:border-[#246bfd]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
              Payment Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full h-[42px] px-3 rounded-[10px] border border-[#e5eaf2] text-[13px] bg-white"
            >
              <option value="Cash">Cash</option>
              <option value="GCash">GCash</option>
              <option value="Maya">Maya</option>
            </select>
          </div>
        </div>

        {method !== 'Cash' && (
          <div>
            <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
              {method} Reference Number
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder={`e.g., ${method === 'GCash' ? 'GC-99284102' : 'MY-55410291'}`}
              className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] focus:border-[#246bfd]"
            />
          </div>
        )}

        <div>
          <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
            Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Final settlement upon pickup"
            className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] focus:border-[#246bfd]"
          />
        </div>

        {selectedOrder && (
          <div className="flex items-center justify-between rounded-[10px] bg-[#f5f8fe] px-4 py-2.5 text-[12.5px] tabular-nums">
            <span className="text-[#5d6880]">Remaining Balance After Payment:</span>
            <b className={projectedBalance === 0 ? 'text-[#14936c]' : 'text-[#c26d18]'}>
              {formatPHP(projectedBalance)} ({projectedBalance === 0 ? 'Paid' : 'Partial Payment'})
            </b>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-[10px] border border-[#e5eaf2] text-[13px] font-semibold text-[#5d6880] hover:bg-[#f9fbff]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!selectedOrder || submitting}
            className="px-5 py-2.5 rounded-[10px] bg-[#246bfd] hover:bg-[#1557dc] text-white text-[13px] font-bold disabled:opacity-50"
          >
            {submitting ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
