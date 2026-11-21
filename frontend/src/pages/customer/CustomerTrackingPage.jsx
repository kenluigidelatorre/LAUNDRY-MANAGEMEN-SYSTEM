import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Printer, Sparkles, Truck, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatDateTime,
  formatPHP,
  isOrderDelayed,
} from '../../utils/formatters';
import {
  EmptyState,
  OrderStatusBadge,
  PaymentStatusBadge,
  SearchBar,
} from '../../components/common/UIPrimitives';
import {
  OrderProgressTracker,
  OrderTrackingTimeline,
} from '../../components/tracking/OrderProgressTracker';
import { ReceiptModal } from '../../components/common/ReceiptModal';

export const CustomerTrackingPage = () => {
  const { orders, settings } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(
    () => searchParams.get('order') || ''
  );
  const [receiptOrder, setReceiptOrder] = useState(null);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.serviceName.toLowerCase().includes(q) ||
        o.laundryStatus.toLowerCase().includes(q)
    );
  }, [orders, search]);

  const activeOrder = useMemo(() => {
    if (orders.length === 0) return null;
    if (selectedOrderId) {
      const exact = orders.find((o) => o.id === selectedOrderId);
      if (exact) return exact;
    }
    return filteredOrders[0] || orders[0];
  }, [orders, filteredOrders, selectedOrderId]);

  if (orders.length === 0) {
    return (
      <div className="border border-[#e5eaf2] bg-white rounded-[14px] p-6">
        <EmptyState
          icon={<Truck className="w-6 h-6" />}
          title="No laundry orders to track"
          description="Submit a laundry booking first to monitor live 7-stage washing and pickup progress."
          action={
            <button
              type="button"
              onClick={() => navigate('/customer/book')}
              className="px-4 py-2 rounded-[10px] bg-[#1d5ef3] text-white text-[13px] font-bold"
            >
              Place an Order
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left Order Selector */}
      <section className="lg:col-span-4 border border-[#e5eaf2] bg-white rounded-[14px] overflow-hidden">
        <div className="p-4 border-b border-[#e5eaf2] space-y-3">
          <h3 className="font-display text-[15px] font-bold text-[#13213c]">
            Select Order ({filteredOrders.length})
          </h3>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Find order ID or service..."
          />
        </div>
        <div className="divide-y divide-[#e5eaf2] max-h-[540px] overflow-y-auto">
          {filteredOrders.length === 0 ? (
            <p className="p-5 text-[12.5px] text-[#6e7891] text-center">
              No matching orders found.
            </p>
          ) : (
            filteredOrders.map((ord) => {
              const selected = activeOrder?.id === ord.id;
              return (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => setSelectedOrderId(ord.id)}
                  className={`w-full text-left px-4 py-3.5 transition-colors ${
                    selected ? 'bg-[#eef4ff]' : 'hover:bg-[#f9fbff]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <b className="font-display text-[13.5px] text-[#13213c] tabular-nums">
                      {ord.id}
                    </b>
                    <OrderStatusBadge
                      status={ord.laundryStatus}
                      delayed={isOrderDelayed(ord)}
                    />
                  </div>
                  <p className="text-[12.5px] font-semibold text-[#3f4d67] mt-1 truncate">
                    {ord.serviceName}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-[#6e7891] mt-1 tabular-nums">
                    <span>{ord.weightKg} kg</span>
                    <span>{formatPHP(ord.totalAmount)}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Right Live Progress & Timeline */}
      {activeOrder && (
        <section className="lg:col-span-8 space-y-5">
          {activeOrder.laundryStatus === 'Ready for Pickup' && (
            <div className="rounded-[14px] border border-[#bdecd9] bg-[#f1fbf7] p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-[9px] bg-[#d5f5e7] text-[#14936c] grid place-items-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-[14.5px] font-extrabold text-[#13213c]">
                  Ready for Pickup at Wash n&apos; Dash Counter
                </h3>
                <p className="text-[12.5px] text-[#3f4d67] mt-0.5">
                  Your order <b>{activeOrder.id}</b> is folded, packed, and waiting at{' '}
                  {settings.address || 'our main shop counter'}.
                  {activeOrder.remainingBalance > 0
                    ? ` Please bring ${formatPHP(activeOrder.remainingBalance)} to settle your remaining balance upon pickup.`
                    : ' Your payment is already settled in full.'}
                </p>
              </div>
            </div>
          )}

          <div className="border border-[#e5eaf2] bg-white rounded-[14px] p-5 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e5eaf2] pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-[19px] font-extrabold text-[#13213c] tabular-nums">
                    Order {activeOrder.id}
                  </h2>
                  <OrderStatusBadge
                    status={activeOrder.laundryStatus}
                    delayed={isOrderDelayed(activeOrder)}
                  />
                  <PaymentStatusBadge status={activeOrder.paymentStatus} />
                </div>
                <p className="text-[12.5px] text-[#5d6a85] mt-1">
                  {activeOrder.serviceName} ·{' '}
                  <span className="tabular-nums">{activeOrder.weightKg} kg</span> · Received{' '}
                  <span className="tabular-nums">{formatDateTime(activeOrder.dateReceived)}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setReceiptOrder(activeOrder)}
                className="h-[38px] px-3.5 rounded-[9px] border border-[#dce6fa] bg-[#f8fbff] hover:bg-[#eaf2ff] text-[#1d5ef3] text-[12.5px] font-bold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Printer className="w-4 h-4" />
                View Receipt
              </button>
            </div>

            <OrderProgressTracker order={activeOrder} mode="customer" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#f9fbff] border border-[#e5eaf2] rounded-[12px] p-4 text-[12.5px]">
              <div>
                <span className="text-[11px] text-[#6e7891] block">Target Completion</span>
                <b className="text-[#13213c] tabular-nums">
                  {formatDateTime(activeOrder.expectedCompletionDate)}
                </b>
              </div>
              <div>
                <span className="text-[11px] text-[#6e7891] block">Assigned Handler</span>
                <b className="text-[#13213c] inline-flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-[#1d5ef3]" />
                  {activeOrder.assignedStaffName}
                </b>
              </div>
              <div>
                <span className="text-[11px] text-[#6e7891] block">Payment Balance</span>
                <b
                  className={`tabular-nums ${
                    activeOrder.remainingBalance > 0 ? 'text-[#dc2626]' : 'text-[#14936c]'
                  }`}
                >
                  {activeOrder.remainingBalance > 0
                    ? `${formatPHP(activeOrder.remainingBalance)} due`
                    : 'Paid in full'}
                </b>
              </div>
            </div>
          </div>

          <div className="border border-[#e5eaf2] bg-white rounded-[14px] p-5">
            <h3 className="font-display text-[14.5px] font-bold text-[#13213c] mb-4">
              Stage Audit Timeline ({(activeOrder.trackingHistory || []).length} events)
            </h3>
            <OrderTrackingTimeline history={activeOrder.trackingHistory || []} />
          </div>
        </section>
      )}

      <ReceiptModal
        open={Boolean(receiptOrder)}
        onClose={() => setReceiptOrder(null)}
        order={receiptOrder}
      />
    </div>
  );
};
