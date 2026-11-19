import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ClipboardList,
  CreditCard,
  Droplets,
  Layers,
  Minus,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Shirt,
  Sparkles,
  Trash2,
  User,
  UserPlus,
  Wind,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  calculateMultiServiceTotal,
  formatDateOnly,
  formatPHP,
  getNextRecommendedStatus,
  isOrderDelayed,
  isSameDay,
} from '../../utils/formatters';
import { Modal, OrderStatusBadge } from '../../components/common/UIPrimitives';
import { StatCard } from '../../components/dashboard/DashboardWidgets';
import { OrderTrackingModal } from '../../components/tracking/OrderProgressTracker';
import { RecordPaymentModal } from '../../components/payments/RecordPaymentModal';
import { ReceiptModal } from '../../components/common/ReceiptModal';

const SERVICE_ICONS = {
  shirt: <Shirt className="w-5 h-5" />,
  droplets: <Droplets className="w-5 h-5" />,
  sparkles: <Sparkles className="w-5 h-5" />,
  layers: <Layers className="w-5 h-5" />,
  wind: <Wind className="w-5 h-5" />,
  zap: <Zap className="w-5 h-5" />,
};

const ICON_TONE = {
  blue: 'bg-[#eaf2ff] text-[#246bfd]',
  violet: 'bg-[#f1edff] text-[#7d5cde]',
  mint: 'bg-[#e4f8f1] text-[#14936c]',
  peach: 'bg-[#fff0e4] text-[#d97706]',
};

function defaultCompletionLocal() {
  const dt = new Date(Date.now() + 24 * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export const StaffDashboard = () => {
  const {
    user,
    orders,
    customers,
    services,
    createOrder,
    addCustomer,
    updateOrderStatus,
    notify,
  } = useApp();
  const navigate = useNavigate();

  // POS Ticket State
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cartLines, setCartLines] = useState([]);
  const [additionalCharges, setAdditionalCharges] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [expectedCompletion, setExpectedCompletion] = useState(() =>
    defaultCompletionLocal()
  );
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [payMode, setPayMode] = useState('full');
  const [customAmount, setCustomAmount] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Quick Walk-in Customer Modal State
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('+63 9');
  const [custAddress, setCustAddress] = useState('');
  const [custEmail, setCustEmail] = useState('');

  // Floor Queue & Receipt Modals
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);

  const activeCustomers = useMemo(
    () => customers.filter((c) => c.status === 'Active'),
    [customers]
  );

  // Select first active customer once database bootstrap hydrates
  useEffect(() => {
    if (!selectedCustomerId && activeCustomers.length > 0) {
      setSelectedCustomerId(activeCustomers[0].id);
    }
  }, [activeCustomers, selectedCustomerId]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return activeCustomers;
    return activeCustomers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.contactNumber.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }, [activeCustomers, customerSearch]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  const availableServices = useMemo(
    () => services.filter((s) => s.available),
    [services]
  );

  const activeQueue = useMemo(
    () =>
      orders.filter(
        (o) => o.laundryStatus !== 'Completed' && o.laundryStatus !== 'Cancelled'
      ),
    [orders]
  );

  const metrics = useMemo(() => {
    const readyCount = activeQueue.filter(
      (o) => o.laundryStatus === 'Ready for Pickup'
    ).length;
    const completedToday = orders.filter(
      (o) => o.laundryStatus === 'Completed' && isSameDay(o.updatedAt)
    ).length;
    return {
      activeCount: activeQueue.length,
      readyCount,
      completedToday,
    };
  }, [orders, activeQueue]);

  // POS Calculations
  const resolvedLines = useMemo(() => {
    return cartLines
      .map((line) => {
        const srv = services.find((s) => s.id === line.serviceId);
        if (!srv) return null;
        const safeKg = Math.max(0, Math.round(line.weightKg * 10) / 10);
        return {
          service: srv,
          weightKg: safeKg,
          pricePerKg: srv.pricePerKg,
          subtotal: Math.round(safeKg * srv.pricePerKg * 100) / 100,
        };
      })
      .filter(Boolean);
  }, [cartLines, services]);

  const servicesSubtotal = useMemo(
    () => resolvedLines.reduce((sum, l) => sum + l.subtotal, 0),
    [resolvedLines]
  );

  const chargesNum = Math.max(0, parseFloat(additionalCharges) || 0);
  const discountNum = Math.max(0, parseFloat(discount) || 0);
  const totalDue = calculateMultiServiceTotal(resolvedLines, chargesNum, discountNum);

  const tenderedAmount = useMemo(() => {
    if (payMode === 'full') return totalDue;
    if (payMode === 'half') return Math.round(totalDue * 50) / 100;
    if (payMode === 'unpaid') return 0;
    return Math.max(0, parseFloat(customAmount) || 0);
  }, [payMode, totalDue, customAmount]);

  const appliedPayment = Math.min(totalDue, tenderedAmount);
  const cashChange =
    paymentMethod === 'Cash' && tenderedAmount > totalDue
      ? Math.round((tenderedAmount - totalDue) * 100) / 100
      : 0;
  const remainingBalance = Math.max(0, Math.round((totalDue - appliedPayment) * 100) / 100);

  const toggleServiceInCart = (serviceId) => {
    setCartLines((prev) => {
      const exists = prev.find((l) => l.serviceId === serviceId);
      if (exists) {
        return prev.filter((l) => l.serviceId !== serviceId);
      }
      return [...prev, { serviceId, weightKg: 3 }];
    });
  };

  const adjustLineWeight = (serviceId, nextKg) => {
    const clamped = Math.max(0.5, Math.round(nextKg * 10) / 10);
    setCartLines((prev) =>
      prev.map((l) => (l.serviceId === serviceId ? { ...l, weightKg: clamped } : l))
    );
  };

  const removeLine = (serviceId) => {
    setCartLines((prev) => prev.filter((l) => l.serviceId !== serviceId));
  };

  const resetPosTicket = () => {
    setCartLines([]);
    setAdditionalCharges('0');
    setDiscount('0');
    setExpectedCompletion(defaultCompletionLocal());
    setSpecialInstructions('');
    setPaymentMethod('Cash');
    setPayMode('full');
    setCustomAmount('');
    setReferenceNumber('');
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      notify('Please select or register a customer first.', 'error');
      return;
    }
    if (resolvedLines.length === 0) {
      notify('Select at least one laundry service from the POS catalog.', 'error');
      return;
    }
    if (resolvedLines.some((l) => l.weightKg <= 0)) {
      notify('Every selected service must have a weight greater than 0 kg.', 'error');
      return;
    }
    if (
      (paymentMethod === 'GCash' || paymentMethod === 'Maya') &&
      appliedPayment > 0 &&
      !referenceNumber.trim()
    ) {
      notify(`Please enter the ${paymentMethod} reference number.`, 'error');
      return;
    }

    setSubmittingOrder(true);
    try {
      const created = await createOrder({
        customerId: selectedCustomer.id,
        services: resolvedLines.map((l) => ({
          serviceId: l.service.id,
          weightKg: l.weightKg,
        })),
        additionalCharges: chargesNum,
        discount: discountNum,
        initialPayment: appliedPayment,
        paymentMethod,
        referenceNumber: appliedPayment > 0 ? referenceNumber.trim() : undefined,
        expectedCompletionDate: new Date(expectedCompletion).toISOString(),
        assignedStaffId: user?.id || 'STF-003',
        specialInstructions: specialInstructions.trim(),
      });

      if (created) {
        resetPosTicket();
        setReceiptOrder(created);
      }
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleQuickAddCustomer = async (e) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim() || !custAddress.trim()) {
      notify('Please fill in customer name, contact number, and address.', 'error');
      return;
    }
    setSavingCustomer(true);
    try {
      const created = await addCustomer({
        fullName: custName.trim(),
        contactNumber: custPhone.trim(),
        address: custAddress.trim(),
        email: custEmail.trim() || undefined,
      });
      if (created) {
        setSelectedCustomerId(created.id);
        setCustomerSearch('');
        setCustName('');
        setCustPhone('+63 9');
        setCustAddress('');
        setCustEmail('');
        setCustomerModalOpen(false);
      }
    } finally {
      setSavingCustomer(false);
    }
  };

  const recentOrders = activeQueue.slice(0, 6);

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Active floor orders"
          value={metrics.activeCount}
          subtext="In cleaning queue"
          subtextTone="green"
          icon={<ClipboardList className="w-5 h-5" />}
          onClick={() => navigate('/staff/orders')}
        />
        <StatCard
          label="Ready for pickup"
          value={metrics.readyCount}
          subtext="At pickup shelf"
          subtextTone="blue"
          icon={<Sparkles className="w-5 h-5" />}
          onClick={() => navigate('/staff/tracking')}
        />
        <StatCard
          label="Completed today"
          value={metrics.completedToday}
          subtext="Released orders"
          subtextTone="green"
          icon={<Check className="w-5 h-5" />}
          onClick={() => navigate('/staff/orders')}
        />
        <button
          type="button"
          onClick={() => setPaymentModalOpen(true)}
          className="border border-[#e5eaf2] bg-white hover:border-[#246bfd] hover:bg-[#f9fbff] rounded-[14px] px-5 py-4 text-left flex items-center justify-between gap-3 transition-all"
        >
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-[0.6px] text-[#6e7891]">
              Counter Collection
            </span>
            <strong className="block font-display text-[17px] font-extrabold text-[#13213c] mt-1">
              Settle Balance
            </strong>
            <span className="inline-block text-[11.5px] font-semibold text-[#246bfd] mt-0.5">
              Collect Cash, GCash, or Maya →
            </span>
          </div>
          <span className="w-11 h-11 rounded-[12px] bg-[#eaf2ff] text-[#246bfd] grid place-items-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </span>
        </button>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-5 items-start">
        <div className="space-y-5">
          <div className="border border-[#e5eaf2] bg-white rounded-[14px] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <span className="text-[10.5px] font-extrabold uppercase tracking-[1px] text-[#246bfd]">
                  Step 1 · Customer Info
                </span>
                <h2 className="font-display text-[16px] font-bold text-[#13213c]">
                  Select or Register Walk-In Customer
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCustomerModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] bg-[#eaf2ff] hover:bg-[#246bfd] text-[#246bfd] hover:text-white text-[12.5px] font-bold transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                New Customer
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="relative block">
                <Search className="w-4 h-4 text-[#9ba6b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Filter customer name or phone..."
                  className="w-full h-[42px] pl-10 pr-3 rounded-[10px] border border-[#e5eaf2] bg-[#f9fafc] focus:bg-white focus:border-[#8db5ff] text-[13px]"
                />
              </label>

              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                aria-label="Select customer"
                className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] bg-white text-[13px] font-semibold text-[#13213c] focus:border-[#246bfd]"
              >
                <option value="">-- Choose customer --</option>
                {filteredCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.contactNumber})
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomer && (
              <div className="mt-3.5 rounded-[10px] bg-[#f5f8fe] border border-[#dce8ff] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-[10px] bg-[#246bfd] text-white grid place-items-center shrink-0">
                    <User className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <b className="text-[13.5px] text-[#13213c] truncate">
                        {selectedCustomer.fullName}
                      </b>
                      <span className="text-[11px] font-bold text-[#246bfd] tabular-nums">
                        {selectedCustomer.id}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#5d6880] truncate">
                      {selectedCustomer.contactNumber} · {selectedCustomer.address}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border border-[#e5eaf2] bg-white rounded-[14px] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <span className="text-[10.5px] font-extrabold uppercase tracking-[1px] text-[#246bfd]">
                  Step 2 · Laundry Services
                </span>
                <h2 className="font-display text-[16px] font-bold text-[#13213c]">
                  Tap Services to Add to Ticket
                </h2>
              </div>
              <span className="text-[12px] font-semibold text-[#6e7891]">
                {cartLines.length} selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableServices.map((srv) => {
                const inCart = cartLines.find((l) => l.serviceId === srv.id);
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => toggleServiceInCart(srv.id)}
                    className={`relative text-left p-4 rounded-[12px] border transition-all ${
                      inCart
                        ? 'border-[#246bfd] bg-[#f5f8fe] ring-2 ring-[#246bfd]/15'
                        : 'border-[#e5eaf2] bg-white hover:border-[#b7ceff] hover:bg-[#fcfdff]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span
                        className={`w-10 h-10 rounded-[10px] grid place-items-center shrink-0 ${
                          ICON_TONE[srv.colorVariant] || ICON_TONE.blue
                        }`}
                      >
                        {SERVICE_ICONS[srv.iconKey] || <Shirt className="w-5 h-5" />}
                      </span>
                      {inCart ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-[7px] bg-[#246bfd] text-white text-[10.5px] font-bold tabular-nums">
                          <Check className="w-3 h-3" />
                          {inCart.weightKg} kg
                        </span>
                      ) : (
                        <span className="text-[10.5px] font-semibold text-[#6e7891]">
                          {srv.estimatedTime}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-[13.5px] font-bold text-[#13213c] leading-snug">
                      {srv.name}
                    </h3>
                    <p className="font-display text-[15px] font-extrabold text-[#246bfd] tabular-nums mt-1">
                      {formatPHP(srv.pricePerKg)}
                      <span className="text-[11px] font-semibold text-[#6e7891]"> / kg</span>
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border border-[#e5eaf2] bg-white rounded-[14px] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5eaf2]">
              <div>
                <h3 className="font-display text-[15px] font-bold text-[#13213c]">
                  Live Laundry Floor Queue
                </h3>
                <p className="text-[11.5px] text-[#6e7891]">
                  Click any order to view tracking timeline or advance to next stage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/staff/orders')}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-[#246bfd] hover:underline"
              >
                All orders <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr className="bg-[#fafbfc] text-[10px] font-bold uppercase tracking-[0.5px] text-[#8b96aa]">
                    <th className="text-left px-5 py-3">Order</th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-right px-4 py-3">Total</th>
                    <th className="text-right px-5 py-3">Advance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5eaf2] text-[12.5px]">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-6 text-center text-[#6e7891]">
                        No active orders in queue right now.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => {
                      const next = getNextRecommendedStatus(order.laundryStatus);
                      return (
                        <tr
                          key={order.id}
                          onClick={() => setTrackingOrderId(order.id)}
                          className="hover:bg-[#f9fbff] cursor-pointer"
                        >
                          <td className="px-5 py-3 font-display font-extrabold text-[#246bfd] tabular-nums">
                            {order.id}
                          </td>
                          <td className="px-4 py-3">
                            <span className="block font-semibold text-[#17223b]">
                              {order.customerName}
                            </span>
                            <small className="text-[11px] text-[#6e7891]">
                              {order.serviceName} ({order.weightKg} kg)
                            </small>
                          </td>
                          <td className="px-4 py-3 text-[#6e7891] tabular-nums">
                            {formatDateOnly(order.dateReceived)}
                          </td>
                          <td className="px-4 py-3">
                            <OrderStatusBadge
                              status={order.laundryStatus}
                              delayed={isOrderDelayed(order)}
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-bold tabular-nums">
                            {formatPHP(order.totalAmount)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {next && (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await updateOrderStatus(order.id, next);
                                }}
                                className="px-2.5 py-1.5 rounded-[8px] bg-[#eaf2ff] text-[#246bfd] hover:bg-[#246bfd] hover:text-white text-[11px] font-bold transition-colors whitespace-nowrap"
                              >
                                → {next}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleCheckout}
          className="border border-[#e5eaf2] bg-white rounded-[14px] xl:sticky xl:top-[106px] overflow-hidden shadow-[0_8px_28px_rgba(19,33,60,0.05)]"
        >
          <div className="px-5 py-4 border-b border-[#e5eaf2] bg-[#fcfdff] flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[1px] text-[#246bfd]">
                Step 3 · POS Checkout
              </span>
              <h2 className="font-display text-[16px] font-bold text-[#13213c]">
                Order Ticket
              </h2>
            </div>
            <button
              type="button"
              onClick={resetPosTicket}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] border border-[#e5eaf2] bg-white text-[11.5px] font-semibold text-[#5d6880] hover:text-[#dc2626] hover:border-[#fecdd3] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between text-[12px] bg-[#f5f7fb] rounded-[10px] px-3.5 py-2.5">
              <div>
                <span className="text-[#6e7891]">Customer: </span>
                <b className="text-[#13213c]">
                  {selectedCustomer ? selectedCustomer.fullName : 'None selected'}
                </b>
              </div>
              <div className="text-[#6e7891] truncate">
                Staff: <b className="text-[#13213c]">{user?.name?.split(' ')[0] || 'Staff'}</b>
              </div>
            </div>

            <div className="space-y-2.5">
              {resolvedLines.length === 0 ? (
                <div className="rounded-[10px] border border-dashed border-[#d7e0ef] bg-[#fafcff] py-7 px-4 text-center">
                  <Shirt className="w-6 h-6 text-[#9ba6b8] mx-auto mb-2" />
                  <p className="text-[12.5px] font-semibold text-[#5d6880]">
                    No laundry services added yet
                  </p>
                  <p className="text-[11.5px] text-[#8c97ab] mt-0.5">
                    Tap any service tile on the left to enter weight &amp; build order.
                  </p>
                </div>
              ) : (
                resolvedLines.map((line) => (
                  <div
                    key={line.service.id}
                    className="rounded-[10px] border border-[#e5eaf2] bg-white p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <b className="block text-[13px] text-[#13213c]">
                          {line.service.name}
                        </b>
                        <small className="text-[11px] text-[#6e7891] tabular-nums">
                          {formatPHP(line.pricePerKg)} / kg
                        </small>
                      </div>
                      <div className="flex items-center gap-2">
                        <strong className="font-display text-[13.5px] font-extrabold text-[#13213c] tabular-nums">
                          {formatPHP(line.subtotal)}
                        </strong>
                        <button
                          type="button"
                          onClick={() => removeLine(line.service.id)}
                          aria-label={`Remove ${line.service.name}`}
                          className="p-1 rounded-[6px] text-[#9ba6b8] hover:text-[#dc2626] hover:bg-[#fff1f2]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[11.5px] font-semibold text-[#6e7891]">
                        Weight (kg)
                      </span>
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => adjustLineWeight(line.service.id, line.weightKg - 0.5)}
                          className="w-7 h-7 rounded-[7px] border border-[#e5eaf2] bg-[#f9fafc] hover:bg-[#eaf2ff] hover:text-[#246bfd] grid place-items-center"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={line.weightKg}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (Number.isFinite(val)) {
                              setCartLines((prev) =>
                                prev.map((l) =>
                                  l.serviceId === line.service.id ? { ...l, weightKg: val } : l
                                )
                              );
                            }
                          }}
                          className="w-[68px] h-7 px-2 rounded-[7px] border border-[#e5eaf2] text-center text-[12.5px] font-bold tabular-nums"
                        />
                        <button
                          type="button"
                          onClick={() => adjustLineWeight(line.service.id, line.weightKg + 0.5)}
                          className="w-7 h-7 rounded-[7px] border border-[#e5eaf2] bg-[#f9fafc] hover:bg-[#eaf2ff] hover:text-[#246bfd] grid place-items-center"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-[#5d6880] mb-1">
                  Extra Charges (₱)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={additionalCharges}
                  onChange={(e) => setAdditionalCharges(e.target.value)}
                  className="w-full h-[38px] px-3 rounded-[9px] border border-[#e5eaf2] text-[12.5px] font-semibold tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#5d6880] mb-1">
                  Discount (₱)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full h-[38px] px-3 rounded-[9px] border border-[#e5eaf2] text-[12.5px] font-semibold tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#5d6880] mb-1">
                Expected Completion
              </label>
              <input
                type="datetime-local"
                value={expectedCompletion}
                onChange={(e) => setExpectedCompletion(e.target.value)}
                required
                className="w-full h-[38px] px-3 rounded-[9px] border border-[#e5eaf2] text-[12.5px] tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#5d6880] mb-1">
                Special Instructions (optional)
              </label>
              <input
                type="text"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g., Separate whites, gentle cycle..."
                className="w-full h-[38px] px-3 rounded-[9px] border border-[#e5eaf2] text-[12.5px]"
              />
            </div>

            <div className="rounded-[12px] bg-[#f5f7fb] border border-[#e5eaf2] p-3.5 space-y-1.5 text-[12.5px]">
              <div className="flex justify-between text-[#5d6880]">
                <span>Services Subtotal</span>
                <span className="font-semibold tabular-nums">{formatPHP(servicesSubtotal)}</span>
              </div>
              {chargesNum > 0 && (
                <div className="flex justify-between text-[#5d6880]">
                  <span>Extra Charges</span>
                  <span className="font-semibold tabular-nums">+{formatPHP(chargesNum)}</span>
                </div>
              )}
              {discountNum > 0 && (
                <div className="flex justify-between text-[#14936c]">
                  <span>Discount</span>
                  <span className="font-semibold tabular-nums">-{formatPHP(discountNum)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-[#dfe5ef] flex items-center justify-between">
                <span className="font-display font-bold text-[#13213c]">Total Due</span>
                <strong className="font-display text-[20px] font-extrabold text-[#246bfd] tabular-nums">
                  {formatPHP(totalDue)}
                </strong>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="grid grid-cols-3 gap-1.5">
                {['Cash', 'GCash', 'Maya'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`h-[36px] rounded-[9px] border text-[12px] font-bold transition-all ${
                      paymentMethod === m
                        ? 'border-[#246bfd] bg-[#eaf2ff] text-[#246bfd]'
                        : 'border-[#e5eaf2] bg-white text-[#5d6880] hover:bg-[#f5f7fb]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPayMode('full')}
                  className={`h-[32px] rounded-[8px] border text-[11px] font-bold ${
                    payMode === 'full'
                      ? 'border-[#14936c] bg-[#e3f8f1] text-[#14936c]'
                      : 'border-[#e5eaf2] bg-white text-[#6e7891]'
                  }`}
                >
                  Full Pay
                </button>
                <button
                  type="button"
                  onClick={() => setPayMode('half')}
                  className={`h-[32px] rounded-[8px] border text-[11px] font-bold ${
                    payMode === 'half'
                      ? 'border-[#d97706] bg-[#fff4e5] text-[#c26d18]'
                      : 'border-[#e5eaf2] bg-white text-[#6e7891]'
                  }`}
                >
                  50% Deposit
                </button>
                <button
                  type="button"
                  onClick={() => setPayMode('unpaid')}
                  className={`h-[32px] rounded-[8px] border text-[11px] font-bold ${
                    payMode === 'unpaid'
                      ? 'border-[#dc2626] bg-[#fff1f2] text-[#dc2626]'
                      : 'border-[#e5eaf2] bg-white text-[#6e7891]'
                  }`}
                >
                  Pay Later
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#5d6880] mb-1">
                    {paymentMethod === 'Cash' ? 'Cash Tendered (₱)' : 'Amount Paid (₱)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={payMode === 'custom' ? customAmount : tenderedAmount}
                    onChange={(e) => {
                      setPayMode('custom');
                      setCustomAmount(e.target.value);
                    }}
                    className="w-full h-[38px] px-3 rounded-[9px] border border-[#e5eaf2] text-[13px] font-bold tabular-nums"
                  />
                </div>

                {(paymentMethod === 'GCash' || paymentMethod === 'Maya') && appliedPayment > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-[#5d6880] mb-1">
                      {paymentMethod} Ref. #
                    </label>
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="e.g., GC-992841"
                      className="w-full h-[38px] px-3 rounded-[9px] border border-[#e5eaf2] text-[12.5px] tabular-nums"
                    />
                  </div>
                )}
              </div>

              {totalDue > 0 && (
                <div className="flex items-center justify-between text-[12px] px-1">
                  {cashChange > 0 ? (
                    <span className="font-bold text-[#14936c] tabular-nums">
                      Change Due: {formatPHP(cashChange)}
                    </span>
                  ) : remainingBalance > 0 ? (
                    <span className="font-bold text-[#c26d18] tabular-nums">
                      Remaining Balance: {formatPHP(remainingBalance)}
                    </span>
                  ) : (
                    <span className="font-bold text-[#14936c]">Paid in Full</span>
                  )}
                  <span className="text-[#6e7891] tabular-nums">
                    Recorded: {formatPHP(appliedPayment)}
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submittingOrder}
              className="w-full h-[46px] rounded-[10px] bg-[#246bfd] hover:bg-[#1557dc] text-white font-display text-[13.5px] font-bold inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(36,107,253,0.24)] transition-all disabled:opacity-60"
            >
              <Printer className="w-4 h-4" />
              {submittingOrder ? 'Creating Order...' : 'Create Order & Print Receipt'}
            </button>
          </div>
        </form>
      </section>

      <RecordPaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
      />

      <OrderTrackingModal
        open={Boolean(trackingOrderId)}
        onClose={() => setTrackingOrderId(null)}
        orderId={trackingOrderId}
        onOpenReceipt={(o) => setReceiptOrder(o)}
      />

      <ReceiptModal
        open={Boolean(receiptOrder)}
        onClose={() => setReceiptOrder(null)}
        order={receiptOrder}
      />

      <Modal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        title="Register Customer"
        subtitle="Add a walk-in customer and select them for this POS order"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleQuickAddCustomer} className="space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              placeholder="e.g., Sofia Mendoza"
              className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                Contact Number
              </label>
              <input
                type="text"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                Email (optional)
              </label>
              <input
                type="email"
                value={custEmail}
                onChange={(e) => setCustEmail(e.target.value)}
                placeholder="customer@gmail.com"
                className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px]"
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
              Address
            </label>
            <textarea
              rows={2}
              value={custAddress}
              onChange={(e) => setCustAddress(e.target.value)}
              placeholder="Street, Barangay, City"
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#e5eaf2] text-[13px] resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCustomerModalOpen(false)}
              className="px-4 py-2 rounded-[9px] border border-[#e5eaf2] text-[13px] font-semibold text-[#5d6880]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingCustomer}
              className="px-4 py-2 rounded-[9px] bg-[#246bfd] text-white text-[13px] font-bold disabled:opacity-60"
            >
              {savingCustomer ? 'Saving...' : 'Save & Select Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
