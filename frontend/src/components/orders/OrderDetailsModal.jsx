import React from 'react';
import { CreditCard, Printer, Truck, XCircle } from 'lucide-react';
import {
  formatDateTime,
  formatPHP,
  getOrderServiceLines,
  isOrderDelayed,
} from '../../utils/formatters';
import { Modal, OrderStatusBadge, PaymentStatusBadge } from '../common/UIPrimitives';
import { OrderProgressTracker } from '../tracking/OrderProgressTracker';

export const OrderDetailsModal = ({
  open,
  onClose,
  order,
  onTrackOrder,
  onRecordPayment,
  onPrintReceipt,
  onCancelOrder,
}) => {
  if (!order) return null;

  const delayed = isOrderDelayed(order);
  const canCancel =
    order.laundryStatus !== 'Completed' && order.laundryStatus !== 'Cancelled';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Order Details · ${order.id}`}
      subtitle={`Wash n' Dash Official Order Record · Received ${formatDateTime(order.dateReceived)}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#e5eaf2]">
          <div>
            <h4 className="font-display text-[17px] font-extrabold text-[#13213c]">
              {order.customerName}
            </h4>
            <p className="text-[12.5px] text-[#6e7891] tabular-nums">
              {order.contactNumber} · Assigned to <b className="text-[#17223b]">{order.assignedStaffName}</b>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <OrderStatusBadge status={order.laundryStatus} delayed={delayed} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>

        {/* Pricing & Schedule Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-[#e5eaf2] rounded-[12px] p-4 space-y-2 text-[12.5px]">
            <h5 className="font-display text-[13px] font-bold text-[#13213c] mb-2">
              Service &amp; Pricing Breakdown
            </h5>
            {getOrderServiceLines(order).map((line) => (
              <div
                key={line.serviceId}
                className="flex justify-between gap-3 tabular-nums"
              >
                <span className="text-[#6e7891]">
                  {line.serviceName} ({Number(line.weightKg).toFixed(1)} kg ×{' '}
                  {formatPHP(line.pricePerKg)})
                </span>
                <b>{formatPHP(line.subtotal)}</b>
              </div>
            ))}
            <div className="flex justify-between tabular-nums pt-1 border-t border-[#f0f3f8]">
              <span className="text-[#6e7891]">Total Weight</span>
              <b>{Number(order.weightKg).toFixed(1)} kg</b>
            </div>
            <div className="flex justify-between tabular-nums">
              <span className="text-[#6e7891]">Additional Charges</span>
              <b>{formatPHP(order.additionalCharges)}</b>
            </div>
            <div className="flex justify-between tabular-nums">
              <span className="text-[#6e7891]">Discount</span>
              <b className="text-[#14936c]">-{formatPHP(order.discount)}</b>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#e5eaf2] text-[14px] tabular-nums">
              <b className="text-[#13213c]">Total Amount</b>
              <b className="font-display text-[#13213c]">{formatPHP(order.totalAmount)}</b>
            </div>
          </div>

          <div className="border border-[#e5eaf2] rounded-[12px] p-4 space-y-2 text-[12.5px]">
            <h5 className="font-display text-[13px] font-bold text-[#13213c] mb-2">
              Payment &amp; Schedule
            </h5>
            <div className="flex justify-between tabular-nums">
              <span className="text-[#6e7891]">Amount Paid</span>
              <b className="text-[#14936c]">{formatPHP(order.amountPaid)}</b>
            </div>
            <div className="flex justify-between tabular-nums">
              <span className="text-[#6e7891]">Remaining Balance</span>
              <b className={order.remainingBalance > 0 ? 'text-[#dc2626]' : 'text-[#13213c]'}>
                {formatPHP(order.remainingBalance)}
              </b>
            </div>
            <div className="flex justify-between tabular-nums pt-1">
              <span className="text-[#6e7891]">Date Received</span>
              <b>{formatDateTime(order.dateReceived)}</b>
            </div>
            <div className="flex justify-between tabular-nums">
              <span className="text-[#6e7891]">Expected Completion</span>
              <b className={delayed ? 'text-[#dc2626]' : 'text-[#246bfd]'}>
                {formatDateTime(order.expectedCompletionDate)}
              </b>
            </div>
            {order.specialInstructions && (
              <div className="pt-2 border-t border-[#e5eaf2] text-[12px] text-[#5d6880]">
                <span className="font-bold text-[#13213c]">Instructions: </span>
                {order.specialInstructions}
              </div>
            )}
          </div>
        </div>

        {/* Mini Progress Tracker */}
        <div className="border border-[#e5eaf2] rounded-[12px] p-4">
          <OrderProgressTracker order={order} />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div>
            {canCancel && onCancelOrder && (
              <button
                type="button"
                onClick={() => onCancelOrder(order)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] border border-[#fecdd3] bg-[#fff1f2] text-[#dc2626] text-[12.5px] font-bold hover:bg-[#ffe4e6]"
              >
                <XCircle className="w-4 h-4" />
                Cancel Order
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onPrintReceipt(order)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] border border-[#e5eaf2] bg-white hover:bg-[#f5f7fb] text-[#17223b] text-[12.5px] font-bold"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
            {order.remainingBalance > 0 && order.laundryStatus !== 'Cancelled' && (
              <button
                type="button"
                onClick={() => onRecordPayment(order)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] bg-[#e3f8f1] text-[#14936c] hover:bg-[#d1f3e7] text-[12.5px] font-bold"
              >
                <CreditCard className="w-4 h-4" />
                Record Payment
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onClose();
                onTrackOrder(order);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[9px] bg-[#246bfd] hover:bg-[#1557dc] text-white text-[12.5px] font-bold"
            >
              <Truck className="w-4 h-4" />
              Manage Tracking
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
