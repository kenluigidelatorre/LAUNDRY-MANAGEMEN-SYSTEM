import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowUpDown,
  ClipboardList,
  CreditCard,
  Edit3,
  Eye,
  Plus,
  Printer,
  Truck,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatDateOnly,
  formatPHP,
  getNextRecommendedStatus,
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
import { OrderFormModal } from '../../components/orders/OrderFormModal';
import { OrderDetailsModal } from '../../components/orders/OrderDetailsModal';
import { OrderTrackingModal } from '../../components/tracking/OrderProgressTracker';
import { RecordPaymentModal } from '../../components/payments/RecordPaymentModal';
import { ReceiptModal } from '../../components/common/ReceiptModal';

export const OrdersPage = ({ mode }) => {
  const { user, orders, staff, cancelOrder, updateOrderStatus } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const newOrderPath = mode === 'admin' ? '/admin/orders/new' : '/staff/orders/new';

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [receivedDateFilter, setReceivedDateFilter] = useState('');
  const [expectedDateFilter, setExpectedDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('dateReceived');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [detailsOrder, setDetailsOrder] = useState(null);
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearch(q);
  }, [searchParams]);

  const baseOrders = useMemo(() => {
    if (mode === 'admin') return orders;
    return orders.filter(
      (o) =>
        o.assignedStaffId === user?.id ||
        (o.laundryStatus !== 'Completed' && o.laundryStatus !== 'Cancelled')
    );
  }, [mode, orders, user?.id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return baseOrders
      .filter((o) => {
        if (q) {
          const hit =
            o.id.toLowerCase().includes(q) ||
            o.customerName.toLowerCase().includes(q) ||
            o.contactNumber.toLowerCase().includes(q);
          if (!hit) return false;
        }
        if (statusFilter !== 'ALL' && o.laundryStatus !== statusFilter) return false;
        if (paymentFilter !== 'ALL' && o.paymentStatus !== paymentFilter) return false;
        if (staffFilter !== 'ALL' && o.assignedStaffId !== staffFilter) return false;
        if (receivedDateFilter && !o.dateReceived.startsWith(receivedDateFilter)) return false;
        if (expectedDateFilter && !o.expectedCompletionDate.startsWith(expectedDateFilter)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'dateReceived') {
          cmp = new Date(a.dateReceived).getTime() - new Date(b.dateReceived).getTime();
        } else if (sortBy === 'totalAmount') {
          cmp = a.totalAmount - b.totalAmount;
        } else if (sortBy === 'weightKg') {
          cmp = a.weightKg - b.weightKg;
        } else {
          cmp = a.id.localeCompare(b.id);
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [
    baseOrders,
    search,
    statusFilter,
    paymentFilter,
    staffFilter,
    receivedDateFilter,
    expectedDateFilter,
    sortBy,
    sortDir,
  ]);

  const pageSize = 8;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  const handleAdvanceStatus = async (order) => {
    const next = getNextRecommendedStatus(order.laundryStatus);
    if (!next) return;
    await updateOrderStatus(order.id, next);
  };

  return (
    <div className="space-y-5">
      <section className="border border-[#e5eaf2] bg-white rounded-[14px]">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-b border-[#e5eaf2]">
          <div>
            <h2 className="font-display text-[16px] font-bold text-[#13213c]">
              {mode === 'admin' ? 'All Laundry Orders' : 'Active & Assigned Orders'}
            </h2>
            <p className="text-[12px] text-[#6e7891] mt-0.5 tabular-nums">
              {filtered.length} matching orders · Currency in Philippine Peso (₱)
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(newOrderPath)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#246bfd] hover:bg-[#1557dc] text-white text-[13px] font-bold shadow-[0_8px_20px_rgba(36,107,253,0.2)] transition-all whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create Order
          </button>
        </div>

        <div className="p-4 border-b border-[#e5eaf2] space-y-3 bg-[#fcfdff]">
          <div className="flex flex-wrap items-center gap-2.5">
            <SearchBar
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search by Order ID, Customer Name, or Contact..."
              className="flex-1 min-w-[230px]"
            />

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-[40px] px-3 rounded-[10px] border border-[#e5eaf2] bg-white text-[12.5px] text-[#17223b]"
            >
              <option value="ALL">All Order Statuses</option>
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

            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPage(1);
              }}
              className="h-[40px] px-3 rounded-[10px] border border-[#e5eaf2] bg-white text-[12.5px] text-[#17223b]"
            >
              <option value="ALL">All Payment Statuses</option>
              {['Paid', 'Partial Payment', 'Unpaid'].map((p) => (
                <option key={p} value={p}>
                  {p}
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
                className="h-[40px] px-3 rounded-[10px] border border-[#e5eaf2] bg-white text-[12.5px] text-[#17223b]"
              >
                <option value="ALL">All Staff</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#6e7891]">
            <label className="flex items-center gap-2">
              <span>Date Received:</span>
              <input
                type="date"
                value={receivedDateFilter}
                onChange={(e) => {
                  setReceivedDateFilter(e.target.value);
                  setPage(1);
                }}
                className="h-[34px] px-2.5 rounded-[8px] border border-[#e5eaf2] bg-white text-[#17223b]"
              />
            </label>
            <label className="flex items-center gap-2">
              <span>Expected Date:</span>
              <input
                type="date"
                value={expectedDateFilter}
                onChange={(e) => {
                  setExpectedDateFilter(e.target.value);
                  setPage(1);
                }}
                className="h-[34px] px-2.5 rounded-[8px] border border-[#e5eaf2] bg-white text-[#17223b]"
              />
            </label>
            {(search ||
              statusFilter !== 'ALL' ||
              paymentFilter !== 'ALL' ||
              staffFilter !== 'ALL' ||
              receivedDateFilter ||
              expectedDateFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                  setPaymentFilter('ALL');
                  setStaffFilter('ALL');
                  setReceivedDateFilter('');
                  setExpectedDateFilter('');
                  setPage(1);
                }}
                className="text-[#246bfd] font-bold hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {paged.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="w-6 h-6" />}
            title="No laundry orders found"
            description="Adjust your search or filters, or create a new Wash n' Dash laundry order."
            action={
              <button
                type="button"
                onClick={() => navigate(newOrderPath)}
                className="px-4 py-2 rounded-[10px] bg-[#246bfd] text-white text-[13px] font-bold"
              >
                Create New Order
              </button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse">
                <thead>
                  <tr className="bg-[#fafbfc] text-[10.5px] font-bold uppercase tracking-[0.5px] text-[#8b96aa]">
                    <th className="text-left px-5 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('id')}
                        className="inline-flex items-center gap-1 hover:text-[#13213c]"
                      >
                        Order ID
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">Service</th>
                    <th className="text-right px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('weightKg')}
                        className="inline-flex items-center gap-1 hover:text-[#13213c]"
                      >
                        Weight
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-right px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('totalAmount')}
                        className="inline-flex items-center gap-1 hover:text-[#13213c]"
                      >
                        Total Amount
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3">Payment Status</th>
                    <th className="text-left px-4 py-3">Laundry Status</th>
                    <th className="text-left px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('dateReceived')}
                        className="inline-flex items-center gap-1 hover:text-[#13213c]"
                      >
                        Date Received
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-right px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5eaf2] text-[12.5px]">
                  {paged.map((order) => {
                    const delayed = isOrderDelayed(order);
                    const nextStatus = getNextRecommendedStatus(order.laundryStatus);
                    const isTerminal =
                      order.laundryStatus === 'Completed' ||
                      order.laundryStatus === 'Cancelled';

                    return (
                      <tr key={order.id} className="hover:bg-[#f9fbff] transition-colors">
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            onClick={() => setDetailsOrder(order)}
                            className="font-display font-extrabold text-[#246bfd] hover:underline tabular-nums"
                          >
                            {order.id}
                          </button>
                          <small className="block text-[10.5px] text-[#929bad]">
                            {order.assignedStaffName}
                          </small>
                        </td>
                        <td className="px-4 py-3.5">
                          <b className="text-[#17223b] block">{order.customerName}</b>
                          <small className="text-[11px] text-[#929bad] tabular-nums">
                            {order.contactNumber}
                          </small>
                        </td>
                        <td className="px-4 py-3.5 text-[#5d6880]">{order.serviceName}</td>
                        <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-[#17223b]">
                          {Number(order.weightKg).toFixed(1)} kg
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums">
                          <b className="text-[#13213c] block">
                            {formatPHP(order.totalAmount)}
                          </b>
                          {order.remainingBalance > 0 && (
                            <small className="text-[10.5px] text-[#dc2626] font-semibold">
                              Bal: {formatPHP(order.remainingBalance)}
                            </small>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <PaymentStatusBadge status={order.paymentStatus} />
                        </td>
                        <td className="px-4 py-3.5">
                          <OrderStatusBadge status={order.laundryStatus} delayed={delayed} />
                        </td>
                        <td className="px-4 py-3.5 text-[#5d6880] tabular-nums whitespace-nowrap">
                          {formatDateOnly(order.dateReceived)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              title="View Order Details"
                              onClick={() => setDetailsOrder(order)}
                              className="p-1.5 rounded-[7px] text-[#6e7891] hover:text-[#246bfd] hover:bg-[#eaf2ff]"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Track Order"
                              onClick={() => setTrackingOrderId(order.id)}
                              className="p-1.5 rounded-[7px] text-[#6e7891] hover:text-[#246bfd] hover:bg-[#eaf2ff]"
                            >
                              <Truck className="w-4 h-4" />
                            </button>
                            {!isTerminal && (
                              <button
                                type="button"
                                title="Edit Order"
                                onClick={() => {
                                  setEditingOrder(order);
                                  setFormOpen(true);
                                }}
                                className="p-1.5 rounded-[7px] text-[#6e7891] hover:text-[#13213c] hover:bg-[#f1f3f7]"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            {order.remainingBalance > 0 && !isTerminal && (
                              <button
                                type="button"
                                title="Record Payment"
                                onClick={() => setPaymentOrder(order)}
                                className="p-1.5 rounded-[7px] text-[#14936c] hover:bg-[#e3f8f1]"
                              >
                                <CreditCard className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              title="Print Receipt"
                              onClick={() => setReceiptOrder(order)}
                              className="p-1.5 rounded-[7px] text-[#6e7891] hover:text-[#13213c] hover:bg-[#f1f3f7]"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            {nextStatus && (
                              <button
                                type="button"
                                onClick={() => handleAdvanceStatus(order)}
                                className="ml-1 px-2.5 py-1 rounded-[7px] bg-[#eaf2ff] text-[#246bfd] hover:bg-[#246bfd] hover:text-white text-[11px] font-bold transition-colors whitespace-nowrap"
                              >
                                → {nextStatus}
                              </button>
                            )}
                            {mode === 'admin' && !isTerminal && (
                              <button
                                type="button"
                                title="Cancel Order"
                                onClick={() => setCancellingOrder(order)}
                                className="p-1.5 rounded-[7px] text-[#6e7891] hover:text-[#dc2626] hover:bg-[#fff1f2]"
                              >
                                <XCircle className="w-4 h-4" />
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

      <OrderFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingOrder(null);
        }}
        editingOrder={editingOrder}
      />

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
        onCancelOrder={
          mode === 'admin'
            ? (o) => {
                setDetailsOrder(null);
                setCancellingOrder(o);
              }
            : undefined
        }
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

      <ConfirmationDialog
        open={Boolean(cancellingOrder)}
        onClose={() => setCancellingOrder(null)}
        onConfirm={async () => {
          if (cancellingOrder) {
            await cancelOrder(cancellingOrder.id, 'Cancelled by administrator');
          }
        }}
        title={`Cancel Order ${cancellingOrder?.id}?`}
        message={`Are you sure you want to cancel ${cancellingOrder?.customerName}'s order? Cancelled orders cannot resume normal laundry processing.`}
        confirmLabel="Cancel Order"
        danger
      />
    </div>
  );
};
