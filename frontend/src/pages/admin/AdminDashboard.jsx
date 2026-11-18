import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChevronRight,
  ClipboardList,
  CreditCard,
  MoreHorizontal,
  Sparkles,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatDateOnly,
  formatPHP,
  formatTimeOnly,
  isOrderDelayed,
} from '../../utils/formatters';
import { OrderStatusBadge } from '../../components/common/UIPrimitives';
import {
  OrderBreakdownChart,
  RevenueChart,
  StatCard,
} from '../../components/dashboard/DashboardWidgets';
import { OrderDetailsModal } from '../../components/orders/OrderDetailsModal';
import { OrderTrackingModal } from '../../components/tracking/OrderProgressTracker';
import { RecordPaymentModal } from '../../components/payments/RecordPaymentModal';
import { ReceiptModal } from '../../components/common/ReceiptModal';

export const AdminDashboard = () => {
  const { orders, customers, transactions } = useApp();
  const navigate = useNavigate();

  const [detailsOrder, setDetailsOrder] = useState(null);
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);

  const metrics = useMemo(() => {
    const valid = orders.filter((o) => o.laundryStatus !== 'Cancelled');
    const pending = orders.filter(
      (o) => o.laundryStatus === 'Order Received' || o.laundryStatus === 'Pending'
    );
    const inProgress = orders.filter((o) =>
      ['Washing', 'Drying', 'Folding'].includes(o.laundryStatus)
    );
    const ready = orders.filter((o) => o.laundryStatus === 'Ready for Pickup');
    const completed = orders.filter((o) => o.laundryStatus === 'Completed');
    const totalRevenue = valid.reduce((s, o) => s + o.totalAmount, 0);
    const collected = transactions.reduce((s, t) => s + t.amountPaid, 0);

    return {
      totalRevenue,
      collected,
      activeCount: pending.length + inProgress.length + ready.length,
      pendingCount: pending.length,
      inProgressCount: inProgress.length,
      readyCount: ready.length,
      completedCount: completed.length,
      customerCount: customers.length,
    };
  }, [orders, customers.length, transactions]);

  const dailySeries = useMemo(() => {
    const todayCollected = transactions
      .filter((t) => new Date(t.paymentDate).toDateString() === new Date().toDateString())
      .reduce((s, t) => s + t.amountPaid, 0);
    return [
      { label: 'Mon', amount: 3420 },
      { label: 'Tue', amount: 4180 },
      { label: 'Wed', amount: 3890 },
      { label: 'Thu', amount: 5120 },
      { label: 'Fri', amount: 4760 },
      { label: 'Sat', amount: 6240 },
      { label: 'Sun', amount: Math.max(2850, todayCollected) },
    ];
  }, [transactions]);

  const weeklySeries = [
    { label: 'Wk 1', amount: 24800 },
    { label: 'Wk 2', amount: 28950 },
    { label: 'Wk 3', amount: 27400 },
    { label: 'Wk 4', amount: 31200 + metrics.collected },
  ];

  const monthlySeries = [
    { label: 'Jun', amount: 98400 },
    { label: 'Jul', amount: 105200 },
    { label: 'Aug', amount: 112800 },
    { label: 'Sep', amount: 109500 },
    { label: 'Oct', amount: 121400 },
    { label: 'Nov', amount: 128600 + metrics.collected },
  ];

  const recentOrders = orders.slice(0, 5);
  const queueSchedule = useMemo(
    () =>
      orders
        .filter((o) => o.laundryStatus !== 'Completed' && o.laundryStatus !== 'Cancelled')
        .slice(0, 4),
    [orders]
  );

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total revenue"
          value={formatPHP(metrics.totalRevenue)}
          subtext="Philippine Peso"
          subtextTone="green"
          icon={<CreditCard className="w-5 h-5" />}
          onClick={() => navigate('/admin/payments')}
        />
        <StatCard
          label="Active orders"
          value={metrics.activeCount}
          subtext={`${metrics.inProgressCount} processing`}
          subtextTone="green"
          icon={<ClipboardList className="w-5 h-5" />}
          onClick={() => navigate('/admin/orders')}
        />
        <StatCard
          label="Ready for pickup"
          value={metrics.readyCount}
          subtext={`${metrics.pendingCount} pending`}
          subtextTone="blue"
          icon={<Sparkles className="w-5 h-5" />}
          onClick={() => navigate('/admin/tracking')}
        />
        <StatCard
          label="Total customers"
          value={metrics.customerCount}
          subtext={`${metrics.completedCount} completed`}
          subtextTone="green"
          icon={<Users className="w-5 h-5" />}
          onClick={() => navigate('/admin/customers')}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.65fr_0.85fr] gap-4">
        <RevenueChart
          dailyData={dailySeries}
          weeklyData={weeklySeries}
          monthlyData={monthlySeries}
          totalCollected={metrics.collected}
        />

        <OrderBreakdownChart
          title="Order status"
          totalLabel="Total orders"
          slices={[
            { label: 'In progress', count: metrics.inProgressCount, color: '#246bfd' },
            { label: 'Ready / Completed', count: metrics.readyCount + metrics.completedCount, color: '#28b987' },
            { label: 'Pending', count: metrics.pendingCount, color: '#f6a44c' },
          ]}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.65fr_0.85fr] gap-4">
        <div className="border border-[#e5eaf2] bg-white rounded-[14px] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5eaf2]">
            <h2 className="font-display text-[15px] font-bold text-[#13213c]">
              Recent orders
            </h2>
            <button
              type="button"
              onClick={() => navigate('/admin/orders')}
              className="inline-flex items-center gap-1 text-[12px] font-bold text-[#246bfd] hover:underline"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="bg-[#fafbfc] text-[10px] font-bold uppercase tracking-[0.5px] text-[#8b96aa]">
                  <th className="text-left px-5 py-3">Order</th>
                  <th className="text-left px-4 py-3">Service</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5eaf2] text-[12.5px]">
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setDetailsOrder(order)}
                    className="hover:bg-[#f9fbff] cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <b className="font-display text-[#13213c] block tabular-nums">
                        {order.id}
                      </b>
                      <small className="text-[11px] text-[#929bad]">
                        {order.customerName} · {order.weightKg} kg
                      </small>
                    </td>
                    <td className="px-4 py-3.5 text-[#5d6880]">{order.serviceName}</td>
                    <td className="px-4 py-3.5 text-[#6e7891] tabular-nums whitespace-nowrap">
                      {formatDateOnly(order.dateReceived)}
                    </td>
                    <td className="px-4 py-3.5">
                      <OrderStatusBadge
                        status={order.laundryStatus}
                        delayed={isOrderDelayed(order)}
                      />
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-[#13213c] tabular-nums">
                      {formatPHP(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        aria-label={`Inspect ${order.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailsOrder(order);
                        }}
                        className="p-1.5 rounded-lg text-[#8d97a9] hover:text-[#13213c] hover:bg-[#f1f3f7]"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border border-[#e5eaf2] bg-white rounded-[14px] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5eaf2]">
            <h2 className="font-display text-[15px] font-bold text-[#13213c]">
              Today&apos;s queue
            </h2>
            <button
              type="button"
              onClick={() => navigate('/admin/tracking')}
              className="inline-flex items-center gap-1 text-[12px] font-bold text-[#246bfd] hover:underline"
            >
              Track orders <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-[#e5eaf2]">
            {queueSchedule.map((o) => {
              const isReady = o.laundryStatus === 'Ready for Pickup';
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setTrackingOrderId(o.id)}
                  className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-[#f9fbff] text-left transition-colors"
                >
                  <span
                    className={`px-2.5 py-1.5 rounded-[7px] text-[10.5px] font-bold tabular-nums shrink-0 ${
                      isReady
                        ? 'bg-[#e5f8f1] text-[#14936c]'
                        : 'bg-[#eaf2ff] text-[#246bfd]'
                    }`}
                  >
                    {formatTimeOnly(o.expectedCompletionDate)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <b className="block text-[12.5px] font-bold text-[#13213c] truncate">
                      {o.laundryStatus} · {o.customerName}
                    </b>
                    <small className="block text-[11px] text-[#6e7891] truncate">
                      {o.id} · {o.serviceName}
                    </small>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#9aa3b5] shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <OrderDetailsModal
        open={Boolean(detailsOrder)}
        onClose={() => setDetailsOrder(null)}
        order={orders.find((o) => o.id === detailsOrder?.id) || null}
        onTrackOrder={(o) => setTrackingOrderId(o.id)}
        onRecordPayment={(o) => {
          setDetailsOrder(null);
          setPaymentOrder(o);
        }}
        onPrintReceipt={(o) => setReceiptOrder(o)}
      />

      <OrderTrackingModal
        open={Boolean(trackingOrderId)}
        onClose={() => setTrackingOrderId(null)}
        orderId={trackingOrderId}
        onOpenReceipt={(o) => setReceiptOrder(o)}
      />

      <RecordPaymentModal
        open={Boolean(paymentOrder)}
        onClose={() => setPaymentOrder(null)}
        preselectedOrder={paymentOrder}
      />

      <ReceiptModal
        open={Boolean(receiptOrder)}
        onClose={() => setReceiptOrder(null)}
        order={receiptOrder}
      />
    </div>
  );
};
