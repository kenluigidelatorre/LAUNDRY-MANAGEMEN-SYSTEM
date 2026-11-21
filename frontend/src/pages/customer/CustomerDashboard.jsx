import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  CheckCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  Phone,
  PlusCircle,
  Sparkles,
  Truck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatDateTime,
  formatPHP,
  isOrderDelayed,
} from '../../utils/formatters';
import { StatCard } from '../../components/dashboard/DashboardWidgets';
import {
  EmptyState,
  OrderStatusBadge,
  PaymentStatusBadge,
} from '../../components/common/UIPrimitives';
import {
  OrderProgressTracker,
  OrderTrackingModal,
} from '../../components/tracking/OrderProgressTracker';
import { ReceiptModal } from '../../components/common/ReceiptModal';

export const CustomerDashboard = () => {
  const {
    user,
    orders,
    services,
    settings,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useApp();
  const navigate = useNavigate();

  const [spotlightOrderId, setSpotlightOrderId] = useState(null);
  const [trackingModalOrderId, setTrackingModalOrderId] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);

  const pendingCount = useMemo(
    () =>
      orders.filter((o) =>
        ['Order Received', 'Pending'].includes(o.laundryStatus)
      ).length,
    [orders]
  );

  const processingCount = useMemo(
    () =>
      orders.filter((o) =>
        ['Washing', 'Drying', 'Folding'].includes(o.laundryStatus)
      ).length,
    [orders]
  );

  const activeOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.laundryStatus !== 'Completed' && o.laundryStatus !== 'Cancelled'
      ),
    [orders]
  );

  const readyCount = useMemo(
    () => orders.filter((o) => o.laundryStatus === 'Ready for Pickup').length,
    [orders]
  );

  const completedCount = useMemo(
    () => orders.filter((o) => o.laundryStatus === 'Completed').length,
    [orders]
  );

  const outstandingBalance = useMemo(
    () =>
      orders
        .filter((o) => o.laundryStatus !== 'Cancelled')
        .reduce((sum, o) => sum + Number(o.remainingBalance || 0), 0),
    [orders]
  );

  const spotlightOrder = useMemo(() => {
    if (activeOrders.length === 0) return null;
    return activeOrders.find((o) => o.id === spotlightOrderId) || activeOrders[0];
  }, [activeOrders, spotlightOrderId]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);
  const unreadNotifCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );
  const recentNotifications = useMemo(
    () => notifications.slice(0, 5),
    [notifications]
  );

  const featuredServices = useMemo(
    () => services.filter((s) => s.available).slice(0, 4),
    [services]
  );

  return (
    <div className="space-y-6">
      {/* Welcome Action Banner */}
      <section className="rounded-[16px] border border-[#dce6fa] bg-white px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-[12px] font-bold text-[#1d5ef3]">
            Wash n&apos; Dash Customer Account
          </p>
          <h2 className="font-display text-[22px] sm:text-[24px] font-extrabold text-[#13213c] tracking-[-0.02em] mt-0.5">
            Welcome back, {user?.name}
          </h2>
          <p className="text-[13px] text-[#5d6a85] mt-1">
            Monitor live laundry stages, book a new load, or check your balances and pickup updates.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/customer/tracking')}
            className="h-[42px] px-4 rounded-[10px] border border-[#dce6fa] bg-[#f8fbff] hover:bg-[#eef4ff] text-[#13213c] text-[13px] font-bold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Truck className="w-4 h-4 text-[#1d5ef3]" />
            Track Orders
          </button>
          <button
            type="button"
            onClick={() => navigate('/customer/book')}
            className="h-[42px] px-5 rounded-[10px] bg-[#1d5ef3] hover:bg-[#154fd6] text-white text-[13px] font-bold inline-flex items-center gap-2 shadow-[0_8px_20px_rgba(29,94,243,0.22)] transition-all whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            Place an Order
          </button>
        </div>
      </section>

      {/* Ready for Pickup Highlight Banner */}
      {readyCount > 0 && (
        <section className="rounded-[14px] border border-[#bdecd9] bg-[#f1fbf7] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#d5f5e7] text-[#14936c] grid place-items-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-[14.5px] font-extrabold text-[#13213c]">
                {readyCount} {readyCount === 1 ? 'order is' : 'orders are'} ready for pickup
              </h3>
              <p className="text-[12.5px] text-[#3f4d67]">
                Visit the Wash n&apos; Dash counter anytime during shop hours to claim your freshly folded laundry.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/customer/tracking')}
            className="h-[38px] px-4 rounded-[9px] bg-[#14936c] hover:bg-[#0f7d5b] text-white text-[12.5px] font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            View Pickup Details
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      )}

      {/* 5-Card Order & Balance Summary Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          label="Total Orders"
          value={orders.length}
          subtext={outstandingBalance > 0 ? `Bal: ${formatPHP(outstandingBalance)}` : 'All balances clear'}
          subtextTone={outstandingBalance > 0 ? 'amber' : 'muted'}
          icon={<ClipboardList className="w-5 h-5" />}
          onClick={() => navigate('/customer/orders')}
        />
        <StatCard
          label="Pending"
          value={pendingCount}
          subtext="Received / queued"
          subtextTone="blue"
          icon={<Clock className="w-5 h-5" />}
          onClick={() => navigate('/customer/orders')}
        />
        <StatCard
          label="Processing"
          value={processingCount}
          subtext="Washing, drying & folding"
          subtextTone="blue"
          icon={<Loader2 className="w-5 h-5" />}
          iconBg="bg-[#eef4ff] text-[#1d5ef3]"
          onClick={() => navigate('/customer/tracking')}
        />
        <StatCard
          label="Ready for Pickup"
          value={readyCount}
          subtext={readyCount > 0 ? 'Ready at counter' : 'No loads waiting'}
          subtextTone={readyCount > 0 ? 'green' : 'muted'}
          icon={<Sparkles className="w-5 h-5" />}
          iconBg="bg-[#e3f8f1] text-[#16a276]"
          onClick={() => navigate('/customer/tracking')}
        />
        <StatCard
          label="Completed"
          value={completedCount}
          subtext="Successfully claimed"
          subtextTone="muted"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBg="bg-[#f1edff] text-[#7d5cde]"
          onClick={() => navigate('/customer/orders')}
        />
      </section>

      {/* Live 7-Stage Active Order Spotlight */}
      <section className="border border-[#e5eaf2] bg-white rounded-[14px] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display text-[16px] font-extrabold text-[#13213c]">
              Live Laundry Progress
            </h3>
            <p className="text-[12.5px] text-[#6e7891]">
              Real-time stage updates for your active Wash n&apos; Dash orders.
            </p>
          </div>
          {activeOrders.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 bg-[#f4f7fc] p-1 rounded-[10px] border border-[#e5eaf2]">
              {activeOrders.map((ord) => (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => setSpotlightOrderId(ord.id)}
                  className={`px-3 py-1.5 rounded-[7px] text-[12px] font-bold tabular-nums transition-colors whitespace-nowrap ${
                    spotlightOrder?.id === ord.id
                      ? 'bg-white text-[#1d5ef3] shadow-sm'
                      : 'text-[#5d6a85] hover:text-[#13213c]'
                  }`}
                >
                  {ord.id}
                </button>
              ))}
            </div>
          )}
        </div>

        {spotlightOrder ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#f0f3f8]">
              <div className="flex flex-wrap items-center gap-2.5">
                <b className="font-display text-[15px] text-[#13213c] tabular-nums">
                  {spotlightOrder.id}
                </b>
                <span className="text-[13px] text-[#5d6a85]">
                  {spotlightOrder.serviceName} ·{' '}
                  <span className="tabular-nums">{spotlightOrder.weightKg} kg</span>
                </span>
                <OrderStatusBadge
                  status={spotlightOrder.laundryStatus}
                  delayed={isOrderDelayed(spotlightOrder)}
                />
                <PaymentStatusBadge status={spotlightOrder.paymentStatus} />
              </div>
              <div className="flex items-center gap-3 text-[12.5px]">
                <span className="text-[#6e7891] tabular-nums">
                  Target: {formatDateTime(spotlightOrder.expectedCompletionDate)}
                </span>
                <button
                  type="button"
                  onClick={() => setTrackingModalOrderId(spotlightOrder.id)}
                  className="font-bold text-[#1d5ef3] hover:underline inline-flex items-center gap-1"
                >
                  Full details
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <OrderProgressTracker order={spotlightOrder} mode="customer" compact />
          </div>
        ) : (
          <EmptyState
            icon={<Truck className="w-6 h-6" />}
            title="No active laundry loads right now"
            description="Submit a laundry request anytime and follow all 7 stages from drop-off to pickup."
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
        )}
      </section>

      {/* Bottom Grid: Recent Orders + Important Notifications & Shop Info */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <section className="xl:col-span-7 border border-[#e5eaf2] bg-white rounded-[14px] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5eaf2]">
            <h3 className="font-display text-[15px] font-bold text-[#13213c]">
              Recent Orders
            </h3>
            <button
              type="button"
              onClick={() => navigate('/customer/orders')}
              className="text-[12.5px] font-bold text-[#1d5ef3] hover:underline"
            >
              View all
            </button>
          </div>
          {recentOrders.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="w-6 h-6" />}
              title="No orders yet"
              description="Your recent bookings and official receipts will appear here."
            />
          ) : (
            <div className="divide-y divide-[#e5eaf2]">
              {recentOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-[#f9fbff] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <b className="font-display text-[13.5px] text-[#13213c] tabular-nums">
                        {ord.id}
                      </b>
                      <OrderStatusBadge
                        status={ord.laundryStatus}
                        delayed={isOrderDelayed(ord)}
                      />
                    </div>
                    <p className="text-[12.5px] text-[#5d6a85] truncate mt-0.5">
                      {ord.serviceName} · <span className="tabular-nums">{ord.weightKg} kg</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right tabular-nums">
                      <b className="text-[13px] text-[#13213c] block">
                        {formatPHP(ord.totalAmount)}
                      </b>
                      <small className="text-[11px] text-[#6e7891]">
                        {ord.remainingBalance > 0
                          ? `Bal: ${formatPHP(ord.remainingBalance)}`
                          : 'Paid'}
                      </small>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReceiptOrder(ord)}
                      className="px-3 py-1.5 rounded-[8px] border border-[#e5eaf2] text-[12px] font-bold text-[#13213c] hover:bg-[#f5f7fb]"
                    >
                      Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="xl:col-span-5 space-y-5">
          {/* Important Notifications Card */}
          <div className="border border-[#e5eaf2] bg-white rounded-[14px] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5eaf2]">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#1d5ef3]" />
                <h3 className="font-display text-[15px] font-bold text-[#13213c]">
                  Important Notifications
                </h3>
                {unreadNotifCount > 0 && (
                  <span className="text-[11.5px] font-bold text-[#1d5ef3] tabular-nums">
                    · {unreadNotifCount} unread
                  </span>
                )}
              </div>
              {unreadNotifCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="text-[12px] font-bold text-[#1d5ef3] hover:underline inline-flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>
            {recentNotifications.length === 0 ? (
              <div className="px-5 py-6 text-center text-[12.5px] text-[#6e7891]">
                No notifications yet. Order, stage, and payment updates will appear here.
              </div>
            ) : (
              <div className="divide-y divide-[#e5eaf2]">
                {recentNotifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      markNotificationRead(n.id);
                      if (n.type === 'payment') navigate('/customer/payments');
                      else navigate('/customer/tracking');
                    }}
                    className={`w-full text-left px-5 py-3 flex items-start gap-3 transition-colors ${
                      n.read ? 'bg-white hover:bg-[#f9fbff]' : 'bg-[#f4f8ff] hover:bg-[#eaf2ff]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <b className="text-[12.5px] text-[#13213c] truncate">
                          {n.title}
                        </b>
                        <span className="text-[11px] text-[#6e7891] shrink-0 tabular-nums">
                          {n.time}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#5d6a85] mt-0.5 line-clamp-2">
                        {n.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Services & Branch Info Card */}
          <div className="border border-[#e5eaf2] bg-white rounded-[14px] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[15px] font-bold text-[#13213c]">
                Popular PHP Services
              </h3>
              <button
                type="button"
                onClick={() => navigate('/customer/services')}
                className="text-[12.5px] font-bold text-[#1d5ef3] hover:underline"
              >
                All services
              </button>
            </div>
            <div className="space-y-2">
              {featuredServices.map((srv) => (
                <div
                  key={srv.id}
                  className="flex items-center justify-between py-2 border-b border-[#f0f3f8] last:border-b-0"
                >
                  <div>
                    <b className="text-[13px] text-[#13213c] block">{srv.name}</b>
                    <small className="text-[11.5px] text-[#6e7891]">
                      {srv.estimatedTime}
                    </small>
                  </div>
                  <b className="text-[13.5px] text-[#1d5ef3] tabular-nums">
                    {formatPHP(srv.pricePerKg)}/kg
                  </b>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-[#e5eaf2] space-y-1.5 text-[12px] text-[#5d6a85]">
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#1d5ef3] shrink-0" />
                <span>{settings.address || '128 Jupiter Street, Bel-Air, Makati City'}</span>
              </p>
              <p className="flex items-center gap-2 tabular-nums">
                <Phone className="w-3.5 h-3.5 text-[#1d5ef3] shrink-0" />
                <span>{settings.contactNumber || '+63 2 8842 9100'}</span>
              </p>
            </div>
          </div>
        </section>
      </div>

      <OrderTrackingModal
        open={Boolean(trackingModalOrderId)}
        onClose={() => setTrackingModalOrderId(null)}
        orderId={trackingModalOrderId}
        onOpenReceipt={(ord) => {
          setTrackingModalOrderId(null);
          setReceiptOrder(ord);
        }}
      />

      <ReceiptModal
        open={Boolean(receiptOrder)}
        onClose={() => setReceiptOrder(null)}
        order={receiptOrder}
      />
    </div>
  );
};
