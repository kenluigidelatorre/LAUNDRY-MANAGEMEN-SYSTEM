import React from 'react';
import { Printer } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateTime, formatPHP, getOrderServiceLines } from '../../utils/formatters';
import { Logo } from './Logo';
import { Modal, OrderStatusBadge, PaymentStatusBadge } from './UIPrimitives';

export const ReceiptModal = ({ open, onClose, order, transaction }) => {
  const { settings } = useApp();
  if (!order) return null;

  const serviceLines = getOrderServiceLines(order);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Official Receipt · ${order.id}`}
      subtitle="Wash n' Dash — Laundry Shop Management System"
      maxWidth="max-w-lg"
    >
      <div
        id="printable-receipt"
        className="bg-white border border-[#e5eaf2] rounded-[14px] p-6 text-[#17223b] space-y-5"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center border-b border-dashed border-[#dce3ee] pb-4">
          <Logo />
          <p className="text-[12px] font-semibold text-[#246bfd] mt-2">
            {settings.receiptHeader}
          </p>
          <p className="text-[11px] text-[#6e7891] mt-1">{settings.address}</p>
          <p className="text-[11px] text-[#6e7891] tabular-nums">
            {settings.contactNumber} · {settings.email}
          </p>
        </div>

        {/* Receipt Meta */}
        <div className="grid grid-cols-2 gap-y-2 text-[12px] border-b border-[#e5eaf2] pb-4">
          <div>
            <span className="text-[#6e7891] block text-[11px]">Order ID</span>
            <b className="font-display text-[#13213c] tabular-nums">{order.id}</b>
          </div>
          <div className="text-right">
            <span className="text-[#6e7891] block text-[11px]">Date Received</span>
            <b className="tabular-nums">{formatDateTime(order.dateReceived)}</b>
          </div>
          <div>
            <span className="text-[#6e7891] block text-[11px]">Customer</span>
            <b>{order.customerName}</b>
          </div>
          <div className="text-right">
            <span className="text-[#6e7891] block text-[11px]">Contact Number</span>
            <b className="tabular-nums">{order.contactNumber}</b>
          </div>
          {transaction && (
            <>
              <div>
                <span className="text-[#6e7891] block text-[11px]">Transaction ID</span>
                <b className="tabular-nums">{transaction.id}</b>
              </div>
              <div className="text-right">
                <span className="text-[#6e7891] block text-[11px]">Payment Method</span>
                <b>{transaction.paymentMethod}</b>
              </div>
            </>
          )}
          {settings.includeStaffOnReceipt && (
            <>
              <div>
                <span className="text-[#6e7891] block text-[11px]">Assigned Staff</span>
                <b>{order.assignedStaffName}</b>
              </div>
              <div className="text-right">
                <span className="text-[#6e7891] block text-[11px]">Expected Ready</span>
                <b className="tabular-nums">{formatDateTime(order.expectedCompletionDate)}</b>
              </div>
            </>
          )}
        </div>

        {/* Line Items */}
        <div className="space-y-2.5 text-[12.5px] border-b border-[#e5eaf2] pb-4">
          {serviceLines.map((line) => (
            <div key={line.serviceId} className="space-y-0.5">
              <div className="flex justify-between font-bold text-[#13213c]">
                <span>{line.serviceName}</span>
                <span className="tabular-nums">{formatPHP(line.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#6e7891] text-[11.5px] tabular-nums">
                <span>
                  {Number(line.weightKg).toFixed(1)} kg × {formatPHP(line.pricePerKg)}/kg
                </span>
                <span>Service Load</span>
              </div>
            </div>
          ))}
          {order.additionalCharges > 0 && (
            <div className="flex justify-between text-[#5d6880] tabular-nums pt-1">
              <span>Additional Charges</span>
              <span>{formatPHP(order.additionalCharges)}</span>
            </div>
          )}
          {order.discount > 0 && (
            <div className="flex justify-between text-[#14936c] tabular-nums">
              <span>Discount</span>
              <span>-{formatPHP(order.discount)}</span>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="space-y-2 text-[13px]">
          <div className="flex justify-between font-display font-extrabold text-[16px] text-[#13213c] tabular-nums">
            <span>Total Amount</span>
            <span>{formatPHP(order.totalAmount)}</span>
          </div>
          {settings.includePaymentBreakdown && (
            <>
              <div className="flex justify-between text-[#5d6880] tabular-nums">
                <span>Amount Paid</span>
                <span className="font-semibold text-[#14936c]">
                  {formatPHP(order.amountPaid)}
                </span>
              </div>
              <div className="flex justify-between text-[#5d6880] tabular-nums">
                <span>Remaining Balance</span>
                <span
                  className={`font-bold ${
                    order.remainingBalance > 0 ? 'text-[#dc2626]' : 'text-[#17223b]'
                  }`}
                >
                  {formatPHP(order.remainingBalance)}
                </span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between pt-2">
            <OrderStatusBadge status={order.laundryStatus} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>

        {order.specialInstructions && (
          <div className="bg-[#f5f7fb] rounded-[10px] px-3.5 py-2.5 text-[11.5px] text-[#5d6880]">
            <span className="font-bold text-[#13213c]">Notes: </span>
            {order.specialInstructions}
          </div>
        )}

        <p className="text-center text-[11px] text-[#6e7891] border-t border-dashed border-[#dce3ee] pt-4">
          {settings.receiptFooter}
        </p>
      </div>

      <div className="flex items-center justify-end gap-2.5 mt-5 no-print">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-[10px] border border-[#e5eaf2] text-[13px] font-semibold text-[#5d6880] hover:bg-[#f5f7fb]"
        >
          Close
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-[10px] bg-[#246bfd] hover:bg-[#1557dc] text-white text-[13px] font-bold shadow-[0_8px_20px_rgba(36,107,253,0.2)] transition-all"
        >
          <Printer className="w-4 h-4" />
          Print Receipt
        </button>
      </div>
    </Modal>
  );
};
