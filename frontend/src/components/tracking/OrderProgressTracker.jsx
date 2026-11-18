import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  Droplets,
  PackageCheck,
  Shirt,
  Sparkles,
  UserCheck,
  Wind,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatDateTime,
  formatPHP,
  formatTimeOnly,
  getNextRecommendedStatus,
  isOrderDelayed,
  TRACKING_STAGES,
  VALID_STATUS_TRANSITIONS,
} from '../../utils/formatters';
import { Modal, OrderStatusBadge, PaymentStatusBadge } from '../common/UIPrimitives';

const STAGE_ICONS = {
  'Order Received': <PackageCheck className="w-4 h-4" />,
  Pending: <Clock className="w-4 h-4" />,
  Washing: <Droplets className="w-4 h-4" />,
  Drying: <Wind className="w-4 h-4" />,
  Folding: <Shirt className="w-4 h-4" />,
  'Ready for Pickup': <Sparkles className="w-4 h-4" />,
  Completed: <Check className="w-4 h-4" />,
  Cancelled: <XCircle className="w-4 h-4" />,
};

export const OrderProgressTracker = ({ order }) => {
  const isCancelled = order.laundryStatus === 'Cancelled';
  const currentIdx = TRACKING_STAGES.indexOf(order.laundryStatus);

  if (isCancelled) {
    return (
      <div className="rounded-[12px] border border-[#fecdd3] bg-[#fff1f2] p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#dc2626] text-white grid place-items-center shrink-0">
          <XCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-display text-[14px] font-bold text-[#991b1b]">
            Order Cancelled
          </h4>
          <p className="text-[12px] text-[#b91c1c]">
            Cancelled on {formatDateTime(order.updatedAt)}. Normal processing has stopped.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="hidden md:grid grid-cols-7 gap-1 relative pt-4 pb-2">
        {TRACKING_STAGES.map((stage, idx) => {
          const isCompleted =
            order.laundryStatus === 'Completed' ? idx <= currentIdx : idx < currentIdx;
          const isCurrent = order.laundryStatus !== 'Completed' && idx === currentIdx;
          const ts = order.stageTimestamps?.[stage];

          return (
            <div key={stage} className="relative flex flex-col items-center text-center px-1">
              {idx < TRACKING_STAGES.length - 1 && (
                <div
                  className={`absolute top-[20px] left-[calc(50%+20px)] w-[calc(100%-40px)] h-[3px] rounded-full ${
                    idx < currentIdx ? 'bg-[#246bfd]' : 'bg-[#e5e9f1]'
                  }`}
                />
              )}

              {isCurrent && (
                <span className="absolute -top-4 px-2 py-0.5 rounded-[5px] bg-[#e8f1ff] text-[#246bfd] text-[9px] font-extrabold uppercase tracking-wider whitespace-nowrap">
                  Current
                </span>
              )}

              <span
                className={`relative z-10 w-[40px] h-[40px] rounded-full grid place-items-center transition-all ${
                  isCompleted
                    ? 'bg-[#246bfd] text-white border-[4px] border-white shadow-sm'
                    : isCurrent
                    ? 'bg-white text-[#246bfd] border-[4px] border-[#e9f1ff] ring-2 ring-[#246bfd]'
                    : 'bg-[#eff2f6] text-[#929cad] border-[4px] border-white'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : STAGE_ICONS[stage]}
              </span>

              <b
                className={`mt-2 text-[11px] leading-tight ${
                  isCurrent
                    ? 'text-[#246bfd] font-extrabold'
                    : isCompleted
                    ? 'text-[#13213c] font-bold'
                    : 'text-[#6e7891] font-medium'
                }`}
              >
                {stage}
              </b>
              <small className="text-[10px] text-[#6e7891] mt-1 tabular-nums leading-tight">
                {ts ? formatTimeOnly(ts) : 'Upcoming'}
              </small>
              {ts && (
                <small className="text-[9.5px] text-[#9aa3b5] tabular-nums">
                  {new Date(ts).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                </small>
              )}
            </div>
          );
        })}
      </div>

      <div className="md:hidden space-y-0 relative pl-2">
        {TRACKING_STAGES.map((stage, idx) => {
          const isCompleted =
            order.laundryStatus === 'Completed' ? idx <= currentIdx : idx < currentIdx;
          const isCurrent = order.laundryStatus !== 'Completed' && idx === currentIdx;
          const ts = order.stageTimestamps?.[stage];

          return (
            <div key={stage} className="relative flex items-start gap-3.5 pb-5 last:pb-0">
              {idx < TRACKING_STAGES.length - 1 && (
                <div
                  className={`absolute left-[18px] top-[38px] bottom-0 w-[2.5px] ${
                    idx < currentIdx ? 'bg-[#246bfd]' : 'bg-[#e5e9f1]'
                  }`}
                />
              )}
              <span
                className={`relative z-10 w-[36px] h-[36px] rounded-full grid place-items-center shrink-0 ${
                  isCompleted
                    ? 'bg-[#246bfd] text-white'
                    : isCurrent
                    ? 'bg-white text-[#246bfd] ring-2 ring-[#246bfd] border-2 border-[#e9f1ff]'
                    : 'bg-[#eff2f6] text-[#929cad]'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : STAGE_ICONS[stage]}
              </span>
              <div className="flex-1 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <b
                    className={`text-[13px] ${
                      isCurrent ? 'text-[#246bfd]' : 'text-[#13213c]'
                    }`}
                  >
                    {stage}
                  </b>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-[5px] bg-[#e8f1ff] text-[#246bfd] text-[10px] font-bold">
                      Current Stage
                    </span>
                  )}
                </div>
                <p className="text-[11.5px] text-[#6e7891] tabular-nums mt-0.5">
                  {ts ? formatDateTime(ts) : 'Pending stage'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const OrderTrackingTimeline = ({ history = [] }) => {
  const ordered = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-3">
      {ordered.map((entry, i) => (
        <div
          key={entry.id}
          className="relative flex items-start gap-3 pb-3 border-b border-[#e5eaf2] last:border-b-0 last:pb-0"
        >
          <span
            className={`w-7 h-7 rounded-[8px] grid place-items-center shrink-0 mt-0.5 ${
              i === 0 ? 'bg-[#eaf2ff] text-[#246bfd]' : 'bg-[#f5f7fb] text-[#6e7891]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#13213c]">
                <span className="text-[#6e7891] font-medium">{entry.previousStatus}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#9aa3b5]" />
                <span className="text-[#246bfd]">{entry.newStatus}</span>
              </div>
              <span className="text-[11px] text-[#6e7891] tabular-nums">
                {formatDateTime(entry.timestamp)}
              </span>
            </div>
            <p className="text-[11.5px] text-[#5d6880] mt-1">
              Updated by <b className="text-[#17223b]">{entry.staffName}</b>
            </p>
            {entry.remarks && (
              <p className="text-[12px] text-[#6e7891] bg-[#f5f7fb] rounded-[8px] px-3 py-1.5 mt-1.5">
                {entry.remarks}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export const OrderTrackingModal = ({ open, onClose, orderId, onOpenReceipt }) => {
  const {
    user,
    orders,
    staff,
    updateOrderStatus,
    assignStaffToOrder,
    updateExpectedDate,
  } = useApp();

  const order = orders.find((o) => o.id === orderId) || null;
  const [selectedNextStatus, setSelectedNextStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [editingDate, setEditingDate] = useState('');
  const [updating, setUpdating] = useState(false);

  if (!order) return null;

  const isAdmin = user?.role === 'ADMIN';
  const delayed = isOrderDelayed(order);
  const isTerminal =
    order.laundryStatus === 'Completed' || order.laundryStatus === 'Cancelled';
  const recommendedNext = getNextRecommendedStatus(order.laundryStatus);

  const validForwardChoices = TRACKING_STAGES.filter((st) => {
    const curIdx = TRACKING_STAGES.indexOf(order.laundryStatus);
    const stIdx = TRACKING_STAGES.indexOf(st);
    return (
      !isTerminal &&
      (VALID_STATUS_TRANSITIONS[order.laundryStatus]?.includes(st) || stIdx > curIdx)
    );
  });

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    const target = selectedNextStatus || recommendedNext;
    if (!target) return;
    setUpdating(true);
    try {
      const res = await updateOrderStatus(order.id, target, remarks);
      if (res.ok) {
        setRemarks('');
        setSelectedNextStatus('');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickAdvance = async (targetStatus) => {
    setUpdating(true);
    try {
      const res = await updateOrderStatus(order.id, targetStatus, remarks);
      if (res.ok) {
        setRemarks('');
        setSelectedNextStatus('');
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Order Tracking · ${order.id}`}
      subtitle={`${order.customerName} · ${order.serviceName} (${order.weightKg} kg)`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {delayed && (
          <div className="flex items-center gap-3 rounded-[12px] border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-[#b91c1c]">
            <AlertTriangle className="w-5 h-5 shrink-0 text-[#dc2626]" />
            <div className="text-[12.5px]">
              <b className="block text-[#991b1b]">Delayed Order Detected</b>
              <span>
                This order passed its expected completion time (
                {formatDateTime(order.expectedCompletionDate)}) and is currently at{' '}
                <b>{order.laundryStatus}</b>.
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#f5f7fb] border border-[#e5eaf2] rounded-[12px] p-4">
          <div>
            <span className="text-[11px] text-[#6e7891] block">Customer</span>
            <b className="text-[13px] text-[#13213c] block">{order.customerName}</b>
            <small className="text-[11px] text-[#6e7891] tabular-nums">
              {order.contactNumber}
            </small>
          </div>
          <div>
            <span className="text-[11px] text-[#6e7891] block">Service &amp; Pricing</span>
            <b className="text-[13px] text-[#13213c] block">{order.serviceName}</b>
            <small className="text-[11px] text-[#6e7891] tabular-nums">
              {order.weightKg} kg · Total {formatPHP(order.totalAmount)}
            </small>
          </div>
          <div>
            <span className="text-[11px] text-[#6e7891] block">Schedule</span>
            <b className="text-[12px] text-[#13213c] block tabular-nums">
              In: {formatDateTime(order.dateReceived)}
            </b>
            <small
              className={`text-[11px] tabular-nums ${
                delayed ? 'text-[#dc2626] font-bold' : 'text-[#246bfd] font-semibold'
              }`}
            >
              Due: {formatDateTime(order.expectedCompletionDate)}
            </small>
          </div>
          <div className="flex flex-col justify-between items-start sm:items-end gap-1.5">
            <OrderStatusBadge status={order.laundryStatus} delayed={delayed} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>

        <div className="border border-[#e5eaf2] rounded-[14px] p-5 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-display text-[14px] font-bold text-[#13213c]">
              Laundry Progress Tracker
            </h4>
            <span className="text-[11.5px] text-[#6e7891] flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#246bfd]" />
              Assigned to <b className="text-[#13213c]">{order.assignedStaffName}</b>
            </span>
          </div>
          <OrderProgressTracker order={order} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border border-[#e5eaf2] rounded-[14px] p-4 bg-white">
            <h4 className="font-display text-[13.5px] font-bold text-[#13213c] mb-3">
              Update Processing Stage
            </h4>
            {isTerminal ? (
              <p className="text-[12.5px] text-[#6e7891] bg-[#f5f7fb] rounded-[10px] p-3">
                This order is <b>{order.laundryStatus}</b> and cannot continue normal processing.
                Complete tracking history remains preserved below.
              </p>
            ) : (
              <form onSubmit={handleStatusSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-[#17223b] mb-1">
                    Next Laundry Status
                  </label>
                  <select
                    value={selectedNextStatus || recommendedNext || ''}
                    onChange={(e) => setSelectedNextStatus(e.target.value)}
                    className="w-full h-[38px] px-3 rounded-[9px] border border-[#e5eaf2] text-[12.5px] text-[#17223b] bg-white focus:border-[#246bfd]"
                  >
                    {validForwardChoices.map((st) => (
                      <option key={st} value={st}>
                        {st} {st === recommendedNext ? '(Next Stage)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11.5px] font-bold text-[#17223b] mb-1">
                    Processing Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g., Stain pre-treated, moved to Shelf B-2..."
                    className="w-full h-[38px] px-3 rounded-[9px] border border-[#e5eaf2] text-[12.5px] text-[#17223b] focus:border-[#246bfd]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 rounded-[9px] bg-[#246bfd] hover:bg-[#1557dc] text-white text-[12.5px] font-bold transition-colors disabled:opacity-60"
                  >
                    {updating ? 'Updating...' : `Update to ${selectedNextStatus || recommendedNext}`}
                  </button>
                  {order.laundryStatus !== 'Ready for Pickup' && (
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleQuickAdvance('Ready for Pickup')}
                      className="px-3 py-2 rounded-[9px] bg-[#e3f8f1] text-[#14936c] hover:bg-[#d1f3e7] text-[12px] font-bold transition-colors disabled:opacity-60"
                    >
                      Mark Ready for Pickup
                    </button>
                  )}
                  {order.laundryStatus === 'Ready for Pickup' && (
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleQuickAdvance('Completed')}
                      className="px-3 py-2 rounded-[9px] bg-[#14936c] text-white hover:bg-[#0f7657] text-[12px] font-bold transition-colors disabled:opacity-60"
                    >
                      Mark Completed (Picked Up)
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          <div className="border border-[#e5eaf2] rounded-[14px] p-4 bg-white space-y-3">
            <h4 className="font-display text-[13.5px] font-bold text-[#13213c]">
              {isAdmin ? 'Admin Assignment & Schedule' : 'Order & Payment Summary'}
            </h4>

            {isAdmin ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-[#17223b] mb-1">
                    Assign / Reassign Staff
                  </label>
                  <select
                    value={order.assignedStaffId}
                    onChange={(e) => assignStaffToOrder(order.id, e.target.value)}
                    disabled={isTerminal}
                    className="w-full h-[38px] px-3 rounded-[9px] border border-[#e5eaf2] text-[12.5px] text-[#17223b] bg-white disabled:opacity-60"
                  >
                    {staff
                      .filter((s) => s.status === 'Active')
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} ({s.role})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11.5px] font-bold text-[#17223b] mb-1">
                    Edit Expected Completion Date
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="datetime-local"
                      value={
                        editingDate ||
                        new Date(order.expectedCompletionDate).toISOString().slice(0, 16)
                      }
                      onChange={(e) => setEditingDate(e.target.value)}
                      disabled={isTerminal}
                      className="flex-1 h-[38px] px-3 rounded-[9px] border border-[#e5eaf2] text-[12px] text-[#17223b] disabled:opacity-60"
                    />
                    <button
                      type="button"
                      disabled={isTerminal || !editingDate}
                      onClick={async () => {
                        if (editingDate) {
                          await updateExpectedDate(order.id, new Date(editingDate).toISOString());
                          setEditingDate('');
                        }
                      }}
                      className="px-3.5 h-[38px] rounded-[9px] border border-[#e5eaf2] bg-[#f9fafc] hover:bg-[#eaf2ff] hover:text-[#246bfd] text-[12px] font-bold disabled:opacity-40"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-[12.5px]">
                <div className="flex justify-between">
                  <span className="text-[#6e7891]">Total Amount</span>
                  <b className="tabular-nums">{formatPHP(order.totalAmount)}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6e7891]">Amount Paid</span>
                  <b className="text-[#14936c] tabular-nums">{formatPHP(order.amountPaid)}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6e7891]">Remaining Balance</span>
                  <b className="text-[#dc2626] tabular-nums">
                    {formatPHP(order.remainingBalance)}
                  </b>
                </div>
              </div>
            )}

            {order.specialInstructions && (
              <div className="bg-[#f5f7fb] rounded-[9px] p-2.5 text-[11.5px] text-[#5d6880]">
                <b className="text-[#13213c]">Special Instructions: </b>
                {order.specialInstructions}
              </div>
            )}

            {onOpenReceipt && (
              <button
                type="button"
                onClick={() => onOpenReceipt(order)}
                className="w-full py-2 rounded-[9px] border border-[#e5eaf2] hover:bg-[#f5f7fb] text-[12px] font-bold text-[#246bfd]"
              >
                View / Print Wash n&apos; Dash Receipt
              </button>
            )}
          </div>
        </div>

        <div className="border border-[#e5eaf2] rounded-[14px] p-5 bg-white">
          <h4 className="font-display text-[14px] font-bold text-[#13213c] mb-3.5">
            Tracking History Timeline ({(order.trackingHistory || []).length} events)
          </h4>
          <OrderTrackingTimeline history={order.trackingHistory || []} />
        </div>
      </div>
    </Modal>
  );
};
