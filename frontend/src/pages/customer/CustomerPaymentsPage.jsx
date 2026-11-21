import React, { useMemo, useState } from 'react';
import { CheckCircle2, CreditCard, Printer, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateTime, formatPHP } from '../../utils/formatters';
import {
  EmptyState,
  Pagination,
  PaymentStatusBadge,
  SearchBar,
} from '../../components/common/UIPrimitives';
import { StatCard } from '../../components/dashboard/DashboardWidgets';
import { ReceiptModal } from '../../components/common/ReceiptModal';

export const CustomerPaymentsPage = () => {
  const { orders, transactions } = useApp();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [receiptOrder, setReceiptOrder] = useState(null);

  const summary = useMemo(() => {
    const totalPaid = transactions.reduce((s, t) => s + Number(t.amountPaid || 0), 0);
    const totalRemaining = orders
      .filter((o) => o.laundryStatus !== 'Cancelled')
      .reduce((s, o) => s + Number(o.remainingBalance || 0), 0);
    return {
      totalPaid,
      totalRemaining,
      count: transactions.length,
    };
  }, [transactions, orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.orderId.toLowerCase().includes(q) ||
        t.paymentMethod.toLowerCase().includes(q) ||
        (t.referenceNumber || '').toLowerCase().includes(q)
    );
  }, [transactions, search]);

  const pageSize = 8;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openReceiptForOrder = (orderId) => {
    const matched = orders.find((o) => o.id === orderId);
    if (matched) setReceiptOrder(matched);
  };

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Paid"
          value={formatPHP(summary.totalPaid)}
          subtext="Verified payments"
          subtextTone="green"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBg="bg-[#e3f8f1] text-[#16a276]"
        />
        <StatCard
          label="Remaining Balance"
          value={formatPHP(summary.totalRemaining)}
          subtext={summary.totalRemaining > 0 ? 'Pay at counter upon pickup' : 'All settled'}
          subtextTone={summary.totalRemaining > 0 ? 'amber' : 'green'}
          icon={<Wallet className="w-5 h-5" />}
          iconBg="bg-[#fff4e5] text-[#c26d18]"
        />
        <StatCard
          label="Payment Receipts"
          value={summary.count}
          subtext="Cash, GCash & Maya"
          subtextTone="blue"
          icon={<CreditCard className="w-5 h-5" />}
        />
      </section>

      <section className="border border-[#e5eaf2] bg-white rounded-[14px] overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-[#e5eaf2]">
          <h3 className="font-display text-[15px] font-bold text-[#13213c]">
            Transaction History
          </h3>
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search transaction, order ID, or method..."
            className="w-full sm:w-[290px]"
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="w-6 h-6" />}
            title="No payment transactions yet"
            description="Payments recorded at the Wash n' Dash counter (Cash, GCash, or Maya) will appear here."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#e5eaf2] bg-[#f9fbff] text-[11px] font-bold uppercase tracking-wider text-[#6e7891]">
                    <th className="py-3 px-4">Transaction</th>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Method &amp; Ref</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5eaf2] text-[13px]">
                  {paged.map((txn) => (
                    <tr key={txn.id} className="hover:bg-[#f9fbff] transition-colors">
                      <td className="py-3.5 px-4 tabular-nums">
                        <b className="text-[#13213c] block">{txn.id}</b>
                        <small className="text-[11px] text-[#6e7891]">
                          {formatDateTime(txn.paymentDate)}
                        </small>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#1d5ef3] tabular-nums">
                        {txn.orderId}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#13213c]">
                          {txn.paymentMethod}
                        </span>
                        {txn.referenceNumber && (
                          <div className="text-[11px] text-[#6e7891] tabular-nums">
                            Ref: {txn.referenceNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <PaymentStatusBadge status={txn.paymentStatus} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#14936c] tabular-nums">
                        {formatPHP(txn.amountPaid)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-[#13213c] tabular-nums">
                        {formatPHP(txn.remainingBalance)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openReceiptForOrder(txn.orderId)}
                          className="px-2.5 py-1.5 rounded-[8px] border border-[#e5eaf2] bg-white hover:bg-[#f5f7fb] text-[#13213c] text-[11.5px] font-bold inline-flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
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

      <ReceiptModal
        open={Boolean(receiptOrder)}
        onClose={() => setReceiptOrder(null)}
        order={receiptOrder}
      />
    </div>
  );
};
