import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  ClipboardList,
  Eye,
  PlusCircle,
  Printer,
  Truck,
  X,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatDateTime,
  formatPHP,
  isOrderDelayed,
} from '../../utils/formatters';
import {
  ConfirmationDialog,
  EmptyState,
  OrderStatusBadge,
  Pagination,
  PaymentStatusBadge,
  SearchBar,
} from '../../components/common/UIPrimitives';
import { OrderTrackingModal } from '../../components/tracking/OrderProgressTracker';
import { ReceiptModal } from '../../components/common/ReceiptModal';

const FILTER_TABS = [
  { key: 'ALL', label: 'All Orders' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'Ready for Pickup', label: 'Ready for Pickup' },
  { key: 'Completed', label: 'Completed' },
  { key: 'Cancelled', label: 'Cancelled' },
];

export const CustomerOrdersPage = () => {
  const { orders, cancelOrder } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [filterTab, setFilterTab] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [detailOrder, setDetailOrder] = useState(null);
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((ord) => {
      if (q) {
        const hit =
          ord.id.toLowerCase().includes(q) ||
          ord.serviceName.toLowerCase().includes(q) ||
          ord.laundryStatus.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (dateFilter) {
        const orderDate = String(ord.dateReceived || '').slice(0, 10);
        if (orderDate !== dateFilter) return false;
      }
      if (filterTab === 'ACTIVE') {
        return ord.laundryStatus !== 'Completed' && ord.laundryStatus !== 'Cancelled';
      }
      if (filterTab !== 'ALL') {
        return ord.laundryStatus === filterTab;
      }
      return true;
    });
  }, [orders, search, filterTab, dateFilter]);

  const pageSize = 8;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-5">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white border border-[#e5eaf2] rounded-[14px] p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search order ID (e.g. WD-1054) or service..."
            className="w-full sm:w-[270px]"
          />
          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 text-[#6e7891] absolute left-3 pointer-events-none" />
            <input
              type="date"
              aria-label="Filter by order date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="h-[38px] pl-9 pr-3 rounded-[10px] border border-[#dce6fa] bg-white text-[12.5px] font-semibold text-[#13213c]"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => {
                  setDateFilter('');
                  setPage(1);
                }}
                aria-label="Clear date filter"
                className="ml-1.5 text-[11.5px] font-bold text-[#1d5ef3] hover:underline whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-[10px] bg-[#f4f7fc] border border-[#e5eaf2]">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setFilterTab(tab.key);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-[7px] text-[12px] font-bold transition-colors whitespace-nowrap ${
                  filterTab === tab.key
                    ? 'bg-white text-[#1d5ef3] shadow-sm'
                    : 'text-[#5d6a85] hover:text-[#13213c]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate('/customer/book')}
            className="h-[38px] px-4 rounded-[10px] bg-[#1d5ef3] hover:bg-[#154fd6] text-white text-[12.5px] font-bold inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            New Order
          </button>
        </div>
      </div>

      <section className="border border-[#e5eaf2] bg-white rounded-[14px] overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="w-6 h-6" />}
            title="No matching laundry orders"
            description="Adjust your search, date, or status filter, or submit a new laundry booking."
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
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#e5eaf2] bg-[#f9fbff] text-[11px] font-bold uppercase tracking-wider text-[#6e7891]">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Services &amp; Weight</th>
                    <th className="py-3 px-4">Target Completion</th>
                    <th className="py-3 px-4">Laundry Stage</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4 text-right">Total / Balance</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5eaf2] text-[13px]">
                  {paged.map((ord) => {
                    const canCancel = ['Order Received', 'Pending'].includes(ord.laundryStatus);
                    const delayed = isOrderDelayed(ord);
                    return (
                      <tr key={ord.id} className="hover:bg-[#f9fbff] transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#13213c] tabular-nums whitespace-nowrap">
                          {ord.id}
                          <div className="text-[11px] font-normal text-[#6e7891]">
                            {formatDateTime(ord.dateReceived)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#13213c]">{ord.serviceName}</div>
                          <div className="text-[11.5px] text-[#6e7891] tabular-nums">
                            {ord.weightKg} kg · Staff: {ord.assignedStaffName}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[12px] text-[#3f4d67] tabular-nums whitespace-nowrap">
                          {formatDateTime(ord.expectedCompletionDate)}
                        </td>
                        <td className="py-3.5 px-4">
                          <OrderStatusBadge status={ord.laundryStatus} delayed={delayed} />
                        </td>
                        <td className="py-3.5 px-4">
                          <PaymentStatusBadge status={ord.paymentStatus} />
                        </td>
                        <td className="py-3.5 px-4 text-right tabular-nums whitespace-nowrap">
                          <div className="font-bold text-[#13213c]">
                            {formatPHP(ord.totalAmount)}
                          </div>
                          <div
                            className={`text-[11px] font-semibold ${
                              ord.remainingBalance > 0 ? 'text-[#dc2626]' : 'text-[#14936c]'
                            }`}
                          >
                            {ord.remainingBalance > 0
                              ? `Bal: ${formatPHP(ord.remainingBalance)}`
                              : 'Settled'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDetailOrder(ord)}
                              className="px-2.5 py-1.5 rounded-[8px] border border-[#e5eaf2] bg-white hover:bg-[#f5f7fb] text-[#13213c] text-[11.5px] font-bold inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Details
                            </button>
                            <button
                              type="button"
                              onClick={() => setTrackingOrderId(ord.id)}
                              className="px-2.5 py-1.5 rounded-[8px] border border-[#dce6fa] bg-[#f8fbff] hover:bg-[#eaf2ff] text-[#1d5ef3] text-[11.5px] font-bold inline-flex items-center gap-1"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              Track
                            </button>
                            <button
                              type="button"
                              onClick={() => setReceiptOrder(ord)}
                              className="px-2.5 py-1.5 rounded-[8px] border border-[#e5eaf2] bg-white hover:bg-[#f5f7fb] text-[#13213c] text-[11.5px] font-bold inline-flex items-center gap-1"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Receipt
                            </button>
                            {canCancel && (
                              <button
                                type="button"
                                onClick={() => setCancelTarget(ord)}
                                className="px-2.5 py-1.5 rounded-[8px] border border-[#fecdd3] bg-[#fff1f2] hover:bg-[#ffe4e6] text-[#dc2626] text-[11.5px] font-bold inline-flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Cancel
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

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-[#e5eaf2]">
              {paged.map((ord) => {
                const canCancel = ['Order Received', 'Pending'].includes(ord.laundryStatus);
                return (
                  <div key={ord.id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <b className="font-display text-[14px] text-[#13213c] tabular-nums">
                        {ord.id}
                      </b>
                      <OrderStatusBadge
                        status={ord.laundryStatus}
                        delayed={isOrderDelayed(ord)}
                      />
                    </div>
                    <p className="text-[13px] font-semibold text-[#13213c]">{ord.serviceName}</p>
                    <div className="flex items-center justify-between text-[12px] text-[#5d6a85] tabular-nums">
                      <span>{ord.weightKg} kg</span>
                      <span className="font-bold text-[#13213c]">{formatPHP(ord.totalAmount)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setDetailOrder(ord)}
                        className="px-3 py-1.5 rounded-[8px] border border-[#e5eaf2] text-[#13213c] text-[12px] font-bold"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrackingOrderId(ord.id)}
                        className="px-3 py-1.5 rounded-[8px] bg-[#eaf1ff] text-[#1d5ef3] text-[12px] font-bold"
                      >
                        Track
                      </button>
                      <button
                        type="button"
                        onClick={() => setReceiptOrder(ord)}
                        className="px-3 py-1.5 rounded-[8px] border border-[#e5eaf2] text-[#13213c] text-[12px] font-bold"
                      >
                        Receipt
                      </button>
                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => setCancelTarget(ord)}
                          className="px-3 py-1.5 rounded-[8px] bg-[#fff1f2] text-[#dc2626] text-[12px] font-bold"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
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

      {/* Customer Order Details Modal (services, weight, discounts, charges, total) */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 bg-[#0c182e]/45 grid place-items-center p-4">
          <div className="bg-white border border-[#dce6fa] rounded-[16px] w-full max-w-lg overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5eaf2]">
              <div>
                <h3 className="font-display text-[17px] font-extrabold text-[#13213c] tabular-nums">
                  Order Details · {detailOrder.id}
                </h3>
                <p className="text-[12px] text-[#6e7891] tabular-nums">
                  Placed {formatDateTime(detailOrder.dateReceived)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailOrder(null)}
                aria-label="Close order details"
                className="p-1.5 rounded-lg text-[#6e7891] hover:bg-[#f5f7fb]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-[13px]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <OrderStatusBadge
                  status={detailOrder.laundryStatus}
                  delayed={isOrderDelayed(detailOrder)}
                />
                <PaymentStatusBadge status={detailOrder.paymentStatus} />
              </div>

              <div className="border border-[#e5eaf2] rounded-[12px] p-3.5 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#6e7891]">
                  Selected Services
                </p>
                {(detailOrder.serviceItems && detailOrder.serviceItems.length > 0
                  ? detailOrder.serviceItems
                  : [
                      {
                        serviceId: 'SUMMARY',
                        serviceName: detailOrder.serviceName,
                        weightKg: detailOrder.weightKg,
                        pricePerKg: detailOrder.pricePerKg || 0,
                        subtotal: detailOrder.totalAmount,
                      },
                    ]
                ).map((item, idx) => (
                  <div
                    key={`${item.serviceId}-${idx}`}
                    className="flex items-center justify-between gap-2 tabular-nums"
                  >
                    <div>
                      <b className="text-[#13213c] block">{item.serviceName}</b>
                      <small className="text-[#6e7891]">
                        {item.weightKg} kg
                        {item.pricePerKg > 0 ? ` × ${formatPHP(item.pricePerKg)}/kg` : ''}
                      </small>
                    </div>
                    <b className="text-[#13213c]">{formatPHP(item.subtotal)}</b>
                  </div>
                ))}
              </div>

              <div className="bg-[#f9fbff] border border-[#e5eaf2] rounded-[12px] p-3.5 space-y-1.5 tabular-nums">
                <div className="flex justify-between text-[#5d6a85]">
                  <span>Total Weight</span>
                  <b className="text-[#13213c]">{detailOrder.weightKg} kg</b>
                </div>
                <div className="flex justify-between text-[#5d6a85]">
                  <span>Additional Charges</span>
                  <b className="text-[#13213c]">
                    {formatPHP(detailOrder.additionalCharges || 0)}
                  </b>
                </div>
                <div className="flex justify-between text-[#5d6a85]">
                  <span>Discount</span>
                  <b className="text-[#14936c]">
                    -{formatPHP(detailOrder.discount || 0)}
                  </b>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#e5eaf2] font-bold text-[14px]">
                  <span className="text-[#13213c]">Total Amount</span>
                  <span className="text-[#1d5ef3]">{formatPHP(detailOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[#5d6a85]">
                  <span>Amount Paid</span>
                  <b className="text-[#14936c]">{formatPHP(detailOrder.amountPaid || 0)}</b>
                </div>
                <div className="flex justify-between text-[#5d6a85]">
                  <span>Remaining Balance</span>
                  <b
                    className={
                      detailOrder.remainingBalance > 0 ? 'text-[#dc2626]' : 'text-[#14936c]'
                    }
                  >
                    {formatPHP(detailOrder.remainingBalance || 0)}
                  </b>
                </div>
              </div>

              <div className="text-[12.5px] space-y-1 text-[#5d6a85]">
                <p>
                  <b className="text-[#13213c]">Assigned Staff:</b> {detailOrder.assignedStaffName}
                </p>
                <p className="tabular-nums">
                  <b className="text-[#13213c]">Expected Completion:</b>{' '}
                  {formatDateTime(detailOrder.expectedCompletionDate)}
                </p>
                {detailOrder.specialInstructions && (
                  <p>
                    <b className="text-[#13213c]">Notes:</b> {detailOrder.specialInstructions}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const targetId = detailOrder.id;
                    setDetailOrder(null);
                    setTrackingOrderId(targetId);
                  }}
                  className="h-[38px] px-4 rounded-[9px] bg-[#1d5ef3] text-white text-[12.5px] font-bold"
                >
                  Track Progress
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const ord = detailOrder;
                    setDetailOrder(null);
                    setReceiptOrder(ord);
                  }}
                  className="h-[38px] px-4 rounded-[9px] border border-[#dce6fa] bg-white text-[#13213c] text-[12.5px] font-bold"
                >
                  View Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <OrderTrackingModal
        open={Boolean(trackingOrderId)}
        onClose={() => setTrackingOrderId(null)}
        orderId={trackingOrderId}
        onOpenReceipt={(ord) => {
          setTrackingOrderId(null);
          setReceiptOrder(ord);
        }}
      />

      <ReceiptModal
        open={Boolean(receiptOrder)}
        onClose={() => setReceiptOrder(null)}
        order={receiptOrder}
      />

      <ConfirmationDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title={`Cancel Order ${cancelTarget?.id || ''}?`}
        message="You can cancel orders before washing starts. Once cancelled, this request cannot be resumed."
        confirmLabel="Cancel Order"
        danger
        onConfirm={async () => {
          if (cancelTarget) {
            await cancelOrder(cancelTarget.id, 'Cancelled by customer before washing');
          }
        }}
      />
    </div>
  );
};
