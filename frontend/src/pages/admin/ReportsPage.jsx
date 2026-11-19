import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatPHP, getOrderServiceLines } from '../../utils/formatters';
import {
  OrderBreakdownChart,
  RevenueChart,
  StatCard,
} from '../../components/dashboard/DashboardWidgets';

export const ReportsPage = () => {
  const { orders, transactions, customers, staff } = useApp();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const d = o.dateReceived.slice(0, 10);
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [orders, startDate, endDate]);

  const filteredTxns = useMemo(() => {
    return transactions.filter((t) => {
      const d = t.paymentDate.slice(0, 10);
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [transactions, startDate, endDate]);

  const summary = useMemo(() => {
    const validOrders = filteredOrders.filter((o) => o.laundryStatus !== 'Cancelled');
    const completed = filteredOrders.filter((o) => o.laundryStatus === 'Completed');
    const cancelled = filteredOrders.filter((o) => o.laundryStatus === 'Cancelled');
    const pending = filteredOrders.filter(
      (o) => o.laundryStatus === 'Order Received' || o.laundryStatus === 'Pending'
    );
    const processing = filteredOrders.filter((o) =>
      ['Washing', 'Drying', 'Folding', 'Ready for Pickup'].includes(o.laundryStatus)
    );
    const billedRevenue = validOrders.reduce((s, o) => s + o.totalAmount, 0);
    const collectedRevenue = filteredTxns.reduce((s, t) => s + t.amountPaid, 0);

    return {
      totalOrders: filteredOrders.length,
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      pendingCount: pending.length,
      processingCount: processing.length,
      billedRevenue,
      collectedRevenue,
    };
  }, [filteredOrders, filteredTxns]);

  const serviceBreakdown = useMemo(() => {
    const map = new Map();
    for (const o of filteredOrders) {
      if (o.laundryStatus === 'Cancelled') continue;
      for (const line of getOrderServiceLines(o)) {
        const cur = map.get(line.serviceName) || {
          name: line.serviceName,
          count: 0,
          revenue: 0,
          kg: 0,
        };
        cur.count += 1;
        cur.revenue += line.subtotal;
        cur.kg += line.weightKg;
        map.set(line.serviceName, cur);
      }
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  const paymentMethodSummary = useMemo(() => {
    const cash = filteredTxns
      .filter((t) => t.paymentMethod === 'Cash')
      .reduce((s, t) => s + t.amountPaid, 0);
    const gcash = filteredTxns
      .filter((t) => t.paymentMethod === 'GCash')
      .reduce((s, t) => s + t.amountPaid, 0);
    const maya = filteredTxns
      .filter((t) => t.paymentMethod === 'Maya')
      .reduce((s, t) => s + t.amountPaid, 0);
    return { cash, gcash, maya, total: cash + gcash + maya };
  }, [filteredTxns]);

  const staffPerformance = useMemo(() => {
    return staff.map((member) => {
      const assigned = filteredOrders.filter((o) => o.assignedStaffId === member.id);
      const completed = assigned.filter((o) => o.laundryStatus === 'Completed').length;
      const revenueHandled = assigned
        .filter((o) => o.laundryStatus !== 'Cancelled')
        .reduce((s, o) => s + o.totalAmount, 0);
      return {
        member,
        totalAssigned: assigned.length,
        completed,
        revenueHandled,
      };
    });
  }, [staff, filteredOrders]);

  const dailySeries = [
    { label: 'Mon', amount: 3420 },
    { label: 'Tue', amount: 4180 },
    { label: 'Wed', amount: 3890 },
    { label: 'Thu', amount: 5120 },
    { label: 'Fri', amount: 4760 },
    { label: 'Sat', amount: 6240 },
    { label: 'Today', amount: Math.max(2450, summary.collectedRevenue) },
  ];
  const weeklySeries = [
    { label: 'Wk 1', amount: 24800 },
    { label: 'Wk 2', amount: 28950 },
    { label: 'Wk 3', amount: 27400 },
    { label: 'Wk 4', amount: 31200 + summary.collectedRevenue },
  ];
  const monthlySeries = [
    { label: 'Jun', amount: 98400 },
    { label: 'Jul', amount: 105200 },
    { label: 'Aug', amount: 112800 },
    { label: 'Sep', amount: 109500 },
    { label: 'Oct', amount: 121400 },
    { label: 'Nov', amount: 128600 + summary.collectedRevenue },
  ];

  return (
    <div className="space-y-5">
      <div className="border border-[#e5eaf2] bg-white rounded-[14px] p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-[16px] font-bold text-[#13213c]">
            Business Reports &amp; Analytics
          </h2>
          <p className="text-[12px] text-[#6e7891]">
            All revenue figures formatted in Philippine Peso (₱).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-[12px]">
          <label className="flex items-center gap-1.5 text-[#6e7891]">
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-[36px] px-2.5 rounded-[8px] border border-[#e5eaf2] text-[#17223b]"
            />
          </label>
          <label className="flex items-center gap-1.5 text-[#6e7891]">
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-[36px] px-2.5 rounded-[8px] border border-[#e5eaf2] text-[#17223b]"
            />
          </label>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="px-3 py-1.5 rounded-[8px] bg-[#eaf2ff] text-[#246bfd] font-bold"
            >
              Clear Range
            </button>
          )}
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Collected Revenue"
          value={formatPHP(summary.collectedRevenue)}
          subtext={`Billed: ${formatPHP(summary.billedRevenue)}`}
          subtextTone="green"
          icon={<Wallet className="w-5 h-5" />}
        />
        <StatCard
          label="Total Orders"
          value={summary.totalOrders}
          subtext={`${customers.length} customers`}
          subtextTone="blue"
          icon={<ClipboardList className="w-5 h-5" />}
        />
        <StatCard
          label="Completed Orders"
          value={summary.completedCount}
          subtext="Picked up & closed"
          subtextTone="green"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBg="bg-[#e3f8f1] text-[#14936c]"
        />
        <StatCard
          label="Cancelled Orders"
          value={summary.cancelledCount}
          subtext="Excluded from revenue"
          subtextTone="danger"
          icon={<XCircle className="w-5 h-5" />}
          iconBg="bg-[#fff1f2] text-[#dc2626]"
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.65fr_0.85fr] gap-4">
        <RevenueChart
          dailyData={dailySeries}
          weeklyData={weeklySeries}
          monthlyData={monthlySeries}
          totalCollected={summary.collectedRevenue}
        />

        <OrderBreakdownChart
          title="Order Status Distribution"
          totalLabel="Filtered"
          slices={[
            { label: 'Pending / Received', count: summary.pendingCount, color: '#f6a44c' },
            { label: 'Processing & Ready', count: summary.processingCount, color: '#246bfd' },
            { label: 'Completed', count: summary.completedCount, color: '#28b987' },
            { label: 'Cancelled', count: summary.cancelledCount, color: '#ff5965' },
          ]}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-[#e5eaf2] bg-white rounded-[14px] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-[15px] font-bold text-[#13213c]">
              Popular Laundry Services
            </h3>
            <BarChart3 className="w-4 h-4 text-[#246bfd]" />
          </div>
          <div className="space-y-4">
            {serviceBreakdown.map((item) => {
              const maxRev = Math.max(1, serviceBreakdown[0]?.revenue || 1);
              const pct = Math.round((item.revenue / maxRev) * 100);
              return (
                <div key={item.name}>
                  <div className="flex justify-between text-[12.5px] mb-1">
                    <b className="text-[#17223b]">{item.name}</b>
                    <span className="tabular-nums text-[#6e7891]">
                      {item.count} orders ({item.kg.toFixed(1)} kg) ·{' '}
                      <b className="text-[#13213c]">{formatPHP(item.revenue)}</b>
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#edf0f5] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#246bfd]"
                      style={{ width: `${Math.max(8, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border border-[#e5eaf2] bg-white rounded-[14px] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-[15px] font-bold text-[#13213c]">
              Payment Method Distribution
            </h3>
            <CreditCard className="w-4 h-4 text-[#246bfd]" />
          </div>
          <div className="space-y-4">
            {[
              { label: 'Cash', amount: paymentMethodSummary.cash, color: '#28b987' },
              { label: 'GCash', amount: paymentMethodSummary.gcash, color: '#246bfd' },
              { label: 'Maya', amount: paymentMethodSummary.maya, color: '#8567e8' },
            ].map((m) => {
              const pct =
                paymentMethodSummary.total > 0
                  ? Math.round((m.amount / paymentMethodSummary.total) * 100)
                  : 0;
              return (
                <div key={m.label}>
                  <div className="flex justify-between text-[12.5px] mb-1">
                    <b className="text-[#17223b]">{m.label}</b>
                    <span className="tabular-nums text-[#6e7891]">
                      <b className="text-[#13213c]">{formatPHP(m.amount)}</b> ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#edf0f5] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(4, pct)}%`,
                        backgroundColor: m.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-[#e5eaf2] flex items-center justify-between text-[13px]">
            <span className="text-[#6e7891]">Total Payment Volume</span>
            <b className="font-display text-[16px] text-[#13213c] tabular-nums">
              {formatPHP(paymentMethodSummary.total)}
            </b>
          </div>
        </div>
      </section>

      <section className="border border-[#e5eaf2] bg-white rounded-[14px] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e5eaf2] flex items-center justify-between">
          <div>
            <h3 className="font-display text-[15px] font-bold text-[#13213c]">
              Staff Performance &amp; Customer Summary
            </h3>
            <p className="text-[12px] text-[#6e7891]">
              Orders handled and total revenue processed per team member.
            </p>
          </div>
          <Users className="w-4 h-4 text-[#246bfd]" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse">
            <thead>
              <tr className="bg-[#fafbfc] text-[10.5px] font-bold uppercase tracking-[0.5px] text-[#8b96aa]">
                <th className="text-left px-5 py-3">Staff Member</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-right px-4 py-3">Assigned Orders</th>
                <th className="text-right px-4 py-3">Completed</th>
                <th className="text-right px-5 py-3">Revenue Handled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5eaf2] text-[12.5px]">
              {staffPerformance.map((row) => (
                <tr key={row.member.id} className="hover:bg-[#f9fbff]">
                  <td className="px-5 py-3.5 font-bold text-[#13213c]">
                    {row.member.fullName}
                  </td>
                  <td className="px-4 py-3.5 text-[#5d6880]">{row.member.role}</td>
                  <td className="px-4 py-3.5 text-right font-semibold tabular-nums">
                    {row.totalAssigned}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-[#14936c] tabular-nums">
                    {row.completed}
                  </td>
                  <td className="px-5 py-3.5 text-right font-extrabold text-[#13213c] tabular-nums">
                    {formatPHP(row.revenueHandled)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
