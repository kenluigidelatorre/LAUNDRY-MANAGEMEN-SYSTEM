import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Droplets,
  PackageCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatDateTime,
  getNextRecommendedStatus,
  isOrderDelayed,
  isSameDay,
} from '../../utils/formatters';
import {
  EmptyState,
  OrderStatusBadge,
  Pagination,
  PaymentStatusBadge,
  SearchBar,
} from '../../components/common/UIPrimitives';
import { StatCard } from '../../components/dashboard/DashboardWidgets';
import { OrderTrackingModal } from '../../components/tracking/OrderProgressTracker';
import { ReceiptModal } from '../../components/common/ReceiptModal';

export const OrderTrackingPage = ({ mode }) => {
  const { user, orders, staff, updateOrderStatus } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [delayedOnly, setDelayedOnly] = useState(false);
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);

  const scopedOrders = useMemo(() => {
    if (mode === 'admin') return orders;
    return orders.filter(
      (o) =>
        o.assignedStaffId === user?.id ||
        (o.laundryStatus !== 'Completed' && o.laundryStatus !== 'Cancelled')
    );
  }, [mode, orders, user?.id]);

  const metrics = useMemo(() => {
    const active = scopedOrders.filter(
      (o) => o.laundryStatus !== 'Completed' && o.laundryStatus !== 'Cancelled'
    );
    const pending = scopedOrders.filter(
      (o) => o.laundryStatus === 'Order Received' || o.laundryStatus === 'Pending'
    );
    const processing = scopedOrders.filter((o) =>
      ['Washing', 'Drying', 'Folding'].includes(o.laundryStatus)
    );
    const ready = scopedOrders.filter((o) => o.laundryStatus === 'Ready for Pickup');
    const delayed = scopedOrders.filter((o) => isOrderDelayed(o));
    const completedToday = scopedOrders.filter(
      (o) => o.laundryStatus === 'Completed' && isSameDay(o.updatedAt)
    );

    return {
      active: active.length,
      pending: pending.length,
      processing: processing.length,
      ready: ready.length,
      delayed: delayed.length,
      completedToday: completedToday.length,
    };
  }, [scopedOrders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scopedOrders
      .filter((o) => {
        if (q) {
          const hit =
            o.id.toLowerCase().includes(q) ||
            o.customerName.toLowerCase().includes(q) ||
            o.contactNumber.toLowerCase().includes(q);
          if (!hit) return false;
        }
        if (statusFilter !== 'ALL' && o.laundryStatus !== statusFilter) return false;
        if (delayedOnly && !isOrderDelayed(o)) return false;
        if (staffFilter !== 'ALL' && o.assignedStaffId !== staffFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const diff =
          new Date(a.expectedCompletionDate).getTime() -
          new Date(b.expectedCompletionDate).getTime();
        return sortAsc ? diff : -diff;
      });
  }, [scopedOrders, search, statusFilter, delayedOnly, staffFilter, sortAsc]);

  const pageSize = 8;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleQuickStep = async (order, e) => {
    e.stopPropagation();
    const next = getNextRecommendedStatus(order.laundryStatus);
    if (!next) return;
    await updateOrderStatus(order.id, next);
  };

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Active Orders"
          value={metrics.active}
          subtext="In shop queue"
          subtextTone="blue"
          icon={<PackageCheck className="w-5 h-5" />}
          onClick={() => {
            setStatusFilter('ALL');
            setDelayedOnly(false);
          }}
        />
        <StatCard
          label="Pending Orders"
          value={metrics.pending}
          subtext="Awaiting wash"
          subtextTone="amber"
          icon={<Clock className="w-5 h-5" />}
          iconBg="bg-[#fff4e5] text-[#c26d18]"
          onClick={() => {
            setStatusFilter('Pending');
            setDelayedOnly(false);
          }}
        />
        <StatCard
          label="Currently Processing"
          value={metrics.processing}
          subtext="Wash / Dry / Fold"
          subtextTone="blue"
          icon={<Droplets className="w-5 h-5" />}
          onClick={() => {
            setStatusFilter('Washing');
            setDelayedOnly(false);
          }}
        />
        <StatCard
          label="Ready for Pickup"
          value={metrics.ready}
          subtext="At pickup shelf"
          subtextTone="green"
          icon={<Sparkles className="w-5 h-5" />}
          iconBg="bg-[#e3f8f1] text-[#14936c]"
          onClick={() => {
            setStatusFilter('Ready for Pickup');
            setDelayedOnly(false);
          }}
        />
        <StatCard
          label="Delayed Orders"
          value={metrics.delayed}
          subtext={metrics.delayed > 0 ? 'Past due date' : 'On schedule'}
          subtextTone={metrics.delayed > 0 ? 'danger' : 'green'}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg={
            metrics.delayed > 0
              ? 'bg-[#fff1f2] text-[#dc2626]'
              : 'bg-[#e3f8f1] text-[#14936c]'
          }
          onClick={() => {
            setDelayedOnly((v) => !v);
            setStatusFilter('ALL');
          }}
        />
        <StatCard
          label="Completed Today"
          value={metrics.completedToday}
          subtext="Picked up today"
          subtextTone="green"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBg="bg-[#dcfce7] text-[#15803d]"
          onClick={() => {
            setStatusFilter('Completed');
            setDelayedOnly(false);
          }}
        />
      </section>

      <section className="border border-[#e5eaf2] bg-white rounded-[14px]">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-b border-[#e5eaf2]">
          <div>
            <h2 className="font-display text-[16px] font-bold text-[#13213c]">
              Live Laundry Order Tracking
            </h2>
            <p className="text-[12px] text-[#6e7891] mt-0.5">
              Click any order row to inspect its 7-stage progress tracker and complete timeline.
            </p>
          </div>
          {delayedOnly && (
            <button
              type="button"
              onClick={() => setDelayedOnly(false)}
              className="px-3 py-1.5 rounded-[8px] bg-[#fff1f2] text-[#dc2626] text-[12px] font-bold"
            >
              Showing Delayed Only ×
            </button>
          )}
        </div>

        <div className="p-4 border-b border-[#e5eaf2] flex flex-wrap items-center gap-2.5 bg-[#fcfdff]">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search Order ID, Customer Name, or Phone..."
            className="flex-1 min-w-[230px]"
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-[40px] px-3 rounded-[10px] border border-[#e5eaf2] bg-white text-[12.5px]"
          >
            <option value="ALL">All Stages</option>
            {[
              'Order Received',
              'Pending',
              'Washing',
              'Drying',
              'Folding',
              'Ready for Pickup',
              'Completed',
              'Cancelled',
            ].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {mode === 'admin' && (
            <select
              value={staffFilter}
              onChange={(e) => {
                setStaffFilter(e.target.value);
                setPage(1);
              }}
              className="h-[40px] px-3 rounded-[10px] border border-[#e5eaf2] bg-white text-[12.5px]"
            >
              <option value="ALL">All Assigned Staff</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </select>
          )}

          <label className="inline-flex items-center gap-2 px-3 h-[40px] rounded-[10px] border border-[#e5eaf2] bg-white text-[12.5px] font-semibold text-[#5d6880] cursor-pointer">
            <input
              type="checkbox"
              checked={delayedOnly}
              onChange={(e) => {
                setDelayedOnly(e.target.checked);
                setPage(1);
              }}
              className="accent-[#dc2626]"
            />
            Delayed Only
          </label>
        </div>

        {paged.length === 0 ? (
          <EmptyState
            icon={<Truck className="w-6 h-6" />}
            title="No orders match this tracking filter"
            description="Clear the filters above to view all Wash n' Dash laundry orders."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse">
                <thead>
                  <tr className="bg-[#fafbfc] text-[10.5px] font-bold uppercase tracking-[0.5px] text-[#8b96aa]">
                    <th className="text-left px-5 py-3">Order ID</th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">Service</th>
                    <th className="text-right px-4 py-3">Weight</th>
                    <th className="text-left px-4 py-3">Date Received</th>
                    <th className="text-left px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSortAsc((p) => !p)}
                        className="inline-flex items-center gap-1 hover:text-[#13213c]"
                      >
                        Expected Completion
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3">Current Status</th>
                    <th className="text-left px-4 py-3">Payment</th>
                    <th className="text-left px-4 py-3">Assigned Staff</th>
                    <th className="text-right px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5eaf2] text-[12.5px]">
                  {paged.map((order) => {
                    const delayed = isOrderDelayed(order);
                    const next = getNextRecommendedStatus(order.laundryStatus);

                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        className="hover:bg-[#f5f8fe] cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5 font-display font-extrabold text-[#246bfd] tabular-nums">
                          {order.id}
                        </td>
                        <td className="px-4 py-3.5">
                          <b className="text-[#17223b] block">{order.customerName}</b>
                          <small className="text-[11px] text-[#929bad] tabular-nums">
                            {order.contactNumber}
                          </small>
                        </td>
                        <td className="px-4 py-3.5 text-[#5d6880]">{order.serviceName}</td>
                        <td className="px-4 py-3.5 text-right font-semibold tabular-nums">
                          {Number(order.weightKg).toFixed(1)} kg
                        </td>
                        <td className="px-4 py-3.5 text-[#5d6880] tabular-nums whitespace-nowrap">
                          {formatDateTime(order.dateReceived)}
                        </td>
                        <td
                          className={`px-4 py-3.5 tabular-nums whitespace-nowrap font-medium ${
                            delayed ? 'text-[#dc2626] font-bold' : 'text-[#5d6880]'
                          }`}
                        >
                          {formatDateTime(order.expectedCompletionDate)}
                        </td>
                        <td className="px-4 py-3.5">
                          <OrderStatusBadge status={order.laundryStatus} delayed={delayed} />
                        </td>
                        <td className="px-4 py-3.5">
                          <PaymentStatusBadge status={order.paymentStatus} />
                        </td>
                        <td className="px-4 py-3.5 text-[#17223b] font-medium">
                          {order.assignedStaffName}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrderId(order.id);
                              }}
                              className="px-2.5 py-1.5 rounded-[8px] border border-[#e5eaf2] bg-white hover:border-[#246bfd] text-[#13213c] text-[11.5px] font-bold"
                            >
                              Track
                            </button>
                            {next && (
                              <button
                                type="button"
                                onClick={(e) => handleQuickStep(order, e)}
                                className="px-2.5 py-1.5 rounded-[8px] bg-[#246bfd] hover:bg-[#1557dc] text-white text-[11.5px] font-bold"
                              >
                                → {next}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

      <OrderTrackingModal
        open={Boolean(selectedOrderId)}
        onClose={() => setSelectedOrderId(null)}
        orderId={selectedOrderId}
        onOpenReceipt={(o) => setReceiptOrder(o)}
      />

      <ReceiptModal
        open={Boolean(receiptOrder)}
        onClose={() => setReceiptOrder(null)}
        order={receiptOrder}
      />
    </div>
  );
};
