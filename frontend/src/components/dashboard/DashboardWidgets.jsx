import React, { useState } from 'react';
import { formatPHP, formatPHPCompact } from '../../utils/formatters';

/* ---------- StatCard ---------- */
export const StatCard = ({
  label,
  value,
  subtext,
  subtextTone = 'green',
  icon,
  iconBg = 'bg-[#eaf2ff] text-[#246bfd]',
  onClick,
}) => {
  const toneColors = {
    green: 'text-[#28b987]',
    blue: 'text-[#246bfd]',
    amber: 'text-[#c26d18]',
    danger: 'text-[#dc2626]',
    muted: 'text-[#6e7891]',
  };

  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`border border-[#e5eaf2] bg-white rounded-[14px] px-[20px] py-[18px] flex items-center gap-3.5 text-left transition-all ${
        onClick ? 'hover:border-[#cfdbed] hover:shadow-[0_10px_24px_rgba(39,59,103,0.06)]' : ''
      }`}
    >
      <span
        className={`w-[44px] h-[44px] rounded-[12px] grid place-items-center shrink-0 ${iconBg}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <small className="block text-[11.5px] font-medium text-[#6e7891] truncate">
          {label}
        </small>
        <div className="flex items-baseline gap-2.5 mt-0.5 flex-wrap">
          <strong className="font-display text-[23px] font-extrabold text-[#13213c] tabular-nums leading-tight">
            {value}
          </strong>
          {subtext && (
            <span className={`text-[11px] font-semibold whitespace-nowrap ${toneColors[subtextTone]}`}>
              {subtext}
            </span>
          )}
        </div>
      </div>
    </Tag>
  );
};

/* ---------- RevenueChart ---------- */
export const RevenueChart = ({ dailyData, weeklyData, monthlyData }) => {
  const [period, setPeriod] = useState('daily');

  const activeSeries =
    period === 'daily' ? dailyData : period === 'weekly' ? weeklyData : monthlyData;
  const periodSum = activeSeries.reduce((sum, p) => sum + p.amount, 0);
  const maxVal = Math.max(1000, ...activeSeries.map((p) => p.amount));
  const roundedCeiling = Math.ceil(maxVal / 1000) * 1000;

  return (
    <section className="border border-[#e5eaf2] bg-white rounded-[14px] p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-[15px] font-bold text-[#13213c]">
          Revenue overview
        </h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          aria-label="Revenue timeframe"
          className="h-[34px] px-3 rounded-[8px] border border-[#e5eaf2] bg-white text-[12px] font-medium text-[#17223b]"
        >
          <option value="daily">Last 7 days</option>
          <option value="weekly">Last 4 weeks</option>
          <option value="monthly">Last 6 months</option>
        </select>
      </div>

      <div className="mb-3">
        <small className="block text-[10px] font-bold uppercase tracking-wider text-[#6e7891]">
          {period === 'daily' ? 'This week' : period === 'weekly' ? 'This month' : '6-month total'}
        </small>
        <strong className="font-display text-[22px] font-extrabold text-[#13213c] tabular-nums">
          {formatPHP(periodSum)}
        </strong>
      </div>

      <div className="h-[195px] pt-2 flex">
        <div className="flex flex-col justify-between pb-6 pr-3 text-[10px] font-medium text-[#9ca5b5] tabular-nums text-right">
          <span>{formatPHPCompact(roundedCeiling)}</span>
          <span>{formatPHPCompact(roundedCeiling * 0.75)}</span>
          <span>{formatPHPCompact(roundedCeiling * 0.5)}</span>
          <span>{formatPHPCompact(roundedCeiling * 0.25)}</span>
          <span>₱0</span>
        </div>

        <div className="flex-1 flex items-end justify-around border-b border-[#e5eaf2] wd-chart-bars-bg pb-0 mb-6 relative">
          {activeSeries.map((pt) => {
            const pct = Math.max(8, Math.round((pt.amount / roundedCeiling) * 100));
            return (
              <div
                key={pt.label}
                className="group relative flex flex-col items-center justify-end h-full w-[9%] max-w-[40px]"
              >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute -top-7 whitespace-nowrap bg-[#13213c] text-white text-[10px] font-bold px-2 py-1 rounded-[6px] shadow-md tabular-nums z-10">
                  {formatPHP(pt.amount)}
                </div>
                <div
                  style={{ height: `${pct}%` }}
                  className="w-full rounded-t-[5px] bg-gradient-to-b from-[#4384ff] to-[#276cf0] group-hover:from-[#246bfd] group-hover:to-[#1557dc] transition-all"
                />
                <small className="absolute -bottom-6 text-[10.5px] font-medium text-[#6e7891] whitespace-nowrap">
                  {pt.label}
                </small>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ---------- OrderBreakdownChart ---------- */
export const OrderBreakdownChart = ({
  title = 'Order status',
  slices,
  totalLabel = 'Total orders',
}) => {
  const total = slices.reduce((s, item) => s + item.count, 0);

  let cumulative = 0;
  const stops = slices
    .map((slice) => {
      const start = total > 0 ? (cumulative / total) * 100 : 0;
      cumulative += slice.count;
      const end = total > 0 ? (cumulative / total) * 100 : 0;
      return `${slice.color} ${start.toFixed(1)}% ${end.toFixed(1)}%`;
    })
    .join(', ');

  const gradient =
    total > 0 ? `conic-gradient(${stops})` : 'conic-gradient(#e5eaf2 0% 100%)';

  return (
    <section className="border border-[#e5eaf2] bg-white rounded-[14px] p-5 flex flex-col justify-between">
      <h2 className="font-display text-[15px] font-bold text-[#13213c]">{title}</h2>

      <div
        className="w-[132px] h-[132px] rounded-full mx-auto my-5 grid place-items-center relative"
        style={{ background: gradient }}
      >
        <div className="absolute inset-[18px] bg-white rounded-full" />
        <div className="relative z-10 text-center">
          <strong className="font-display text-[22px] font-extrabold text-[#13213c] block tabular-nums">
            {total}
          </strong>
          <span className="text-[10.5px] text-[#6e7891]">{totalLabel}</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center text-[12px] text-[#6e7891]">
            <i
              className="w-2 h-2 rounded-full mr-2.5 shrink-0"
              style={{ backgroundColor: s.color }}
            />
            <span className="truncate">{s.label}</span>
            <b className="ml-auto text-[#17223b] font-bold tabular-nums">{s.count}</b>
          </div>
        ))}
      </div>
    </section>
  );
};
