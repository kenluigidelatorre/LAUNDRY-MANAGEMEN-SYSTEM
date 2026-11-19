import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CreditCard,
  Droplets,
  Layers,
  Minus,
  Plus,
  Shirt,
  Sparkles,
  Tag,
  Trash2,
  UserPlus,
  Wind,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  calculateMultiServiceTotal,
  formatDateTime,
  formatPHP,
} from '../../utils/formatters';
import { ReceiptModal } from '../../components/common/ReceiptModal';

const ICON_MAP = {
  shirt: <Shirt className="w-5 h-5" />,
  droplets: <Droplets className="w-5 h-5" />,
  sparkles: <Sparkles className="w-5 h-5" />,
  layers: <Layers className="w-5 h-5" />,
  wind: <Wind className="w-5 h-5" />,
  zap: <Zap className="w-5 h-5" />,
};

const COLOR_MAP = {
  blue: 'bg-[#eaf2ff] text-[#2772e8]',
  violet: 'bg-[#f1edff] text-[#7d5cde]',
  mint: 'bg-[#e3f8f1] text-[#16a276]',
  peach: 'bg-[#fff0e4] text-[#e8873e]',
};

export const NewOrderPage = ({ mode }) => {
  const { user, services, customers, staff, createOrder, addCustomer, notify } = useApp();
  const navigate = useNavigate();

  const availableServices = useMemo(
    () => services.filter((s) => s.available),
    [services]
  );
  const activeStaff = useMemo(
    () => staff.filter((s) => s.status === 'Active'),
    [staff]
  );

  const [step, setStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('+63 9');
  const [newCustAddress, setNewCustAddress] = useState('');

  const [expectedDate, setExpectedDate] = useState(() => {
    const d = new Date(Date.now() + 24 * 3600 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const [additionalCharges, setAdditionalCharges] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [initialPayment, setInitialPayment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  useEffect(() => {
    if (selectedItems.length === 0 && (availableServices.length > 0 || services.length > 0)) {
      const first = availableServices[0] || services[0];
      if (first) setSelectedItems([{ serviceId: first.id, weightKg: 5 }]);
    }
  }, [availableServices, services, selectedItems.length]);

  useEffect(() => {
    if (!customerId && customers.length > 0) {
      setCustomerId(customers[0].id);
    }
  }, [customers, customerId]);

  useEffect(() => {
    if (!assignedStaffId && activeStaff.length > 0) {
      setAssignedStaffId(
        activeStaff.find((s) => s.id === user?.id)?.id || activeStaff[0].id
      );
    }
  }, [activeStaff, assignedStaffId, user?.id]);

  const selectedLines = useMemo(() => {
    return selectedItems
      .map((item) => {
        const srv = services.find((s) => s.id === item.serviceId);
        if (!srv) return null;
        return {
          service: srv,
          weightKg: item.weightKg,
          subtotal: Math.round(item.weightKg * srv.pricePerKg * 100) / 100,
        };
      })
      .filter(Boolean);
  }, [selectedItems, services]);

  const selectedCustomer = customers.find((c) => c.id === customerId) || customers[0];

  const totalWeightKg = useMemo(
    () => Math.round(selectedLines.reduce((s, l) => s + l.weightKg, 0) * 10) / 10,
    [selectedLines]
  );
  const servicesSubtotal = useMemo(
    () => Math.round(selectedLines.reduce((s, l) => s + l.subtotal, 0) * 100) / 100,
    [selectedLines]
  );

  const addNum = Math.max(0, parseFloat(additionalCharges) || 0);
  const discNum = Math.max(0, parseFloat(discount) || 0);
  const estimatedTotal = calculateMultiServiceTotal(
    selectedLines.map((l) => ({
      weightKg: l.weightKg,
      pricePerKg: l.service.pricePerKg,
    })),
    addNum,
    discNum
  );

  const toggleService = (serviceId) => {
    setSelectedItems((prev) => {
      const exists = prev.some((item) => item.serviceId === serviceId);
      if (exists) {
        if (prev.length === 1) {
          notify('Select at least one laundry service.', 'info');
          return prev;
        }
        return prev.filter((item) => item.serviceId !== serviceId);
      }
      return [...prev, { serviceId, weightKg: 3 }];
    });
  };

  const updateServiceWeight = (serviceId, nextWeight) => {
    const clamped = Math.max(0.5, Math.round(nextWeight * 10) / 10);
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.serviceId === serviceId ? { ...item, weightKg: clamped } : item
      )
    );
  };

  const removeService = (serviceId) => {
    setSelectedItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item.serviceId !== serviceId);
    });
  };

  const handleQuickCustomerSave = async () => {
    if (!newCustName.trim() || !newCustPhone.trim() || !newCustAddress.trim()) {
      notify('Please fill in customer name, contact, and address.', 'error');
      return;
    }
    const created = await addCustomer({
      fullName: newCustName.trim(),
      contactNumber: newCustPhone.trim(),
      address: newCustAddress.trim(),
    });
    if (created) {
      setCustomerId(created.id);
      setAddingCustomer(false);
      setNewCustName('');
      setNewCustPhone('+63 9');
      setNewCustAddress('');
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedCustomer || selectedLines.length === 0) {
      notify('Please choose at least one service and customer.', 'error');
      return;
    }
    const payAmt =
      initialPayment.trim() === ''
        ? 0
        : Math.min(estimatedTotal, Math.max(0, parseFloat(initialPayment) || 0));

    setSubmitting(true);
    try {
      const order = await createOrder({
        customerId: selectedCustomer.id,
        services: selectedLines.map((l) => ({
          serviceId: l.service.id,
          weightKg: l.weightKg,
        })),
        additionalCharges: addNum,
        discount: discNum,
        initialPayment: payAmt,
        paymentMethod,
        expectedCompletionDate: new Date(expectedDate).toISOString(),
        assignedStaffId,
        specialInstructions,
      });

      if (order) {
        setCreatedOrder(order);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const ordersPath = mode === 'admin' ? '/admin/orders' : '/staff/orders';

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate(ordersPath)}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#6e7891] hover:text-[#13213c]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to orders
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
        <section className="border border-[#e5eaf2] bg-white rounded-[14px] overflow-hidden">
          <div className="grid grid-cols-3 px-6 sm:px-9 py-6 border-b border-[#e5eaf2]">
            {[
              { n: 1, label: 'Choose services' },
              { n: 2, label: 'Customer & schedule' },
              { n: 3, label: 'Review & payment' },
            ].map((s, idx) => {
              const done = step > s.n;
              const active = step === s.n;
              return (
                <div key={s.n} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setStep(s.n)}
                    className="flex items-center gap-2.5 text-left"
                  >
                    <span
                      className={`w-[26px] h-[26px] rounded-full grid place-items-center text-[11px] font-bold shrink-0 ${
                        done || active
                          ? 'bg-[#246bfd] text-white'
                          : 'bg-[#eef1f5] text-[#8c96a7]'
                      }`}
                    >
                      {done ? <Check className="w-3.5 h-3.5" /> : s.n}
                    </span>
                    <small
                      className={`hidden sm:inline text-[12px] whitespace-nowrap ${
                        active ? 'text-[#246bfd] font-bold' : 'text-[#6e7891] font-medium'
                      }`}
                    >
                      {s.label}
                    </small>
                  </button>
                  {idx < 2 && <div className="flex-1 h-[1px] bg-[#dfe4ed] mx-3" />}
                </div>
              );
            })}
          </div>

          {step === 1 && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-[1px] text-[#246bfd]">
                    Step 1 of 3
                  </span>
                  <h2 className="font-display text-[22px] font-extrabold text-[#13213c] mt-1">
                    What laundry services are needed?
                  </h2>
                  <p className="text-[12.5px] text-[#6e7891] mt-0.5">
                    Select one or multiple services below, then set each service weight in kg.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-[7px] bg-[#eaf2ff] text-[#246bfd] text-[11px] font-bold tabular-nums">
                  {selectedLines.length} selected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableServices.map((srv) => {
                  const selected = selectedItems.some((i) => i.serviceId === srv.id);
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => toggleService(srv.id)}
                      className={`relative flex items-center gap-3.5 p-4 rounded-[12px] border text-left transition-all ${
                        selected
                          ? 'border-[#246bfd] bg-[#f7faff] ring-1 ring-[#246bfd]'
                          : 'border-[#e5eaf2] bg-white hover:border-[#cfdbed]'
                      }`}
                    >
                      <span
                        className={`w-[42px] h-[42px] rounded-[11px] grid place-items-center shrink-0 ${
                          COLOR_MAP[srv.colorVariant] || COLOR_MAP.blue
                        }`}
                      >
                        {ICON_MAP[srv.iconKey] || ICON_MAP.shirt}
                      </span>
                      <div className="flex-1 min-w-0">
                        <b className="block text-[13px] font-bold text-[#13213c] truncate">
                          {srv.name}
                        </b>
                        <small className="block text-[11px] text-[#6e7891] truncate">
                          Est. {srv.estimatedTime}
                        </small>
                      </div>
                      <strong className="text-[12.5px] font-extrabold text-[#13213c] tabular-nums shrink-0">
                        {formatPHP(srv.pricePerKg)}/kg
                      </strong>
                      {selected && (
                        <i className="w-5 h-5 rounded-full bg-[#246bfd] text-white grid place-items-center absolute -top-2 -right-2 shadow">
                          <Check className="w-3 h-3" />
                        </i>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#13213c]">
                    Weight per selected service (kg)
                  </span>
                  <small className="text-[11.5px] text-[#6e7891] tabular-nums">
                    Total load: <b className="text-[#13213c]">{totalWeightKg} kg</b>
                  </small>
                </div>

                <div className="divide-y divide-[#e5eaf2] border border-[#e5eaf2] rounded-[12px] bg-[#fcfdff]">
                  {selectedLines.map(({ service, weightKg, subtotal }) => (
                    <div
                      key={service.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-8 h-8 rounded-[9px] grid place-items-center shrink-0 ${
                            COLOR_MAP[service.colorVariant] || COLOR_MAP.blue
                          }`}
                        >
                          {ICON_MAP[service.iconKey] || ICON_MAP.shirt}
                        </span>
                        <div className="min-w-0">
                          <b className="block text-[13px] font-bold text-[#13213c] truncate">
                            {service.name}
                          </b>
                          <small className="text-[11px] text-[#6e7891] tabular-nums">
                            {formatPHP(service.pricePerKg)}/kg · Subtotal{' '}
                            <b className="text-[#17223b]">{formatPHP(subtotal)}</b>
                          </small>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center border border-[#e5eaf2] rounded-[9px] overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() => updateServiceWeight(service.id, weightKg - 0.5)}
                            className="w-9 h-9 grid place-items-center text-[#5d6880] hover:bg-[#f5f7fb]"
                            aria-label={`Decrease ${service.name} weight`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={weightKg}
                            onChange={(e) =>
                              updateServiceWeight(
                                service.id,
                                parseFloat(e.target.value) || 0.5
                              )
                            }
                            className="w-14 h-9 text-center text-[13px] font-bold text-[#13213c] border-x border-[#e5eaf2] tabular-nums"
                          />
                          <button
                            type="button"
                            onClick={() => updateServiceWeight(service.id, weightKg + 0.5)}
                            className="w-9 h-9 grid place-items-center text-[#246bfd] hover:bg-[#f5f7fb]"
                            aria-label={`Increase ${service.name} weight`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {selectedLines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeService(service.id)}
                            title={`Remove ${service.name}`}
                            className="p-2 rounded-[8px] text-[#8d97a9] hover:text-[#dc2626] hover:bg-[#fff1f2]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[#e5eaf2]">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#246bfd] hover:bg-[#1557dc] text-white text-[13px] font-bold shadow-[0_8px_20px_rgba(36,107,253,0.2)] transition-all"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-6 sm:p-8 space-y-5">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[1px] text-[#246bfd]">
                  Step 2 of 3
                </span>
                <h2 className="font-display text-[22px] font-extrabold text-[#13213c] mt-1">
                  Customer &amp; completion schedule
                </h2>
                <p className="text-[12.5px] text-[#6e7891] mt-0.5">
                  Choose an existing customer or quickly register a walk-in guest.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12px] font-bold text-[#17223b]">
                    Customer
                  </label>
                  <button
                    type="button"
                    onClick={() => setAddingCustomer((p) => !p)}
                    className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#246bfd] hover:underline"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {addingCustomer ? 'Select existing' : 'New customer'}
                  </button>
                </div>

                {addingCustomer ? (
                  <div className="p-4 rounded-[12px] border border-[#e5eaf2] bg-[#f9fafc] space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Full name"
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        className="h-[40px] px-3 rounded-[9px] border border-[#e5eaf2] bg-white text-[13px]"
                      />
                      <input
                        type="text"
                        placeholder="Contact number"
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value)}
                        className="h-[40px] px-3 rounded-[9px] border border-[#e5eaf2] bg-white text-[13px] tabular-nums"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Address"
                      value={newCustAddress}
                      onChange={(e) => setNewCustAddress(e.target.value)}
                      className="w-full h-[40px] px-3 rounded-[9px] border border-[#e5eaf2] bg-white text-[13px]"
                    />
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={handleQuickCustomerSave}
                        className="px-4 py-1.5 rounded-[8px] bg-[#246bfd] text-white text-[12px] font-bold"
                      >
                        Save &amp; Select Customer
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] bg-white text-[13px]"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.contactNumber})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                    Expected completion date
                  </label>
                  <input
                    type="datetime-local"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                    Assigned staff
                  </label>
                  <select
                    value={assignedStaffId}
                    onChange={(e) => setAssignedStaffId(e.target.value)}
                    className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] bg-white text-[13px]"
                  >
                    {activeStaff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                  Special instructions (optional)
                </label>
                <textarea
                  rows={2}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Delicate items, stain notes, folding preferences..."
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#e5eaf2] text-[13px] resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#e5eaf2]">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-[10px] border border-[#e5eaf2] text-[13px] font-semibold text-[#5d6880] hover:bg-[#f9fbff]"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#246bfd] hover:bg-[#1557dc] text-white text-[13px] font-bold shadow-[0_8px_20px_rgba(36,107,253,0.2)]"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-6 sm:p-8 space-y-5">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[1px] text-[#246bfd]">
                  Step 3 of 3
                </span>
                <h2 className="font-display text-[22px] font-extrabold text-[#13213c] mt-1">
                  Review &amp; payment
                </h2>
                <p className="text-[12.5px] text-[#6e7891] mt-0.5">
                  Confirm selected services and record any drop-off payment in PHP.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-[11px] border border-[#e5eaf2] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-[9px] bg-[#eaf2ff] text-[#246bfd] grid place-items-center shrink-0">
                        <Shirt className="w-4 h-4" />
                      </span>
                      <div>
                        <small className="block text-[10.5px] text-[#6e7891]">
                          Selected Services ({selectedLines.length})
                        </small>
                        <b className="text-[13px] text-[#13213c]">
                          {totalWeightKg} kg total load
                        </b>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[12px] font-bold text-[#246bfd] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="pl-11 space-y-1 text-[12px] text-[#5d6880] tabular-nums">
                    {selectedLines.map(({ service, weightKg, subtotal }) => (
                      <div key={service.id} className="flex justify-between">
                        <span>
                          {service.name} ({weightKg} kg × {formatPHP(service.pricePerKg)})
                        </span>
                        <b className="text-[#13213c]">{formatPHP(subtotal)}</b>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3.5 p-3.5 rounded-[11px] border border-[#e5eaf2]">
                  <span className="w-9 h-9 rounded-[9px] bg-[#e3f8f1] text-[#16a276] grid place-items-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <small className="block text-[10.5px] text-[#6e7891]">
                      Customer &amp; Schedule
                    </small>
                    <b className="text-[13px] text-[#13213c]">{selectedCustomer?.fullName}</b>
                    <p className="text-[11.5px] text-[#6e7891] tabular-nums">
                      Ready by {formatDateTime(expectedDate)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-[12px] font-bold text-[#246bfd] hover:underline"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                    Additional charges (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={additionalCharges}
                    onChange={(e) => setAdditionalCharges(e.target.value)}
                    className="w-full h-[40px] px-3 rounded-[9px] border border-[#e5eaf2] text-[13px] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                    Discount (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full h-[40px] px-3 rounded-[9px] border border-[#e5eaf2] text-[13px] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                    Payment method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full h-[40px] px-3 rounded-[9px] border border-[#e5eaf2] bg-white text-[13px]"
                  >
                    <option value="Cash">Cash</option>
                    <option value="GCash">GCash</option>
                    <option value="Maya">Maya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                    Amount paid now (₱)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max={estimatedTotal}
                      placeholder="0.00"
                      value={initialPayment}
                      onChange={(e) => setInitialPayment(e.target.value)}
                      className="flex-1 h-[40px] px-3 rounded-[9px] border border-[#e5eaf2] text-[13px] tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() => setInitialPayment(String(estimatedTotal))}
                      className="px-3 h-[40px] rounded-[9px] bg-[#e3f8f1] text-[#14936c] text-[11.5px] font-bold whitespace-nowrap"
                    >
                      Pay Full
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#e5eaf2]">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-[10px] border border-[#e5eaf2] text-[13px] font-semibold text-[#5d6880] hover:bg-[#f9fbff]"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmOrder}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#246bfd] hover:bg-[#1557dc] text-white text-[13px] font-bold shadow-[0_8px_20px_rgba(36,107,253,0.2)] disabled:opacity-60"
                >
                  <CreditCard className="w-4 h-4" />
                  {submitting ? 'Creating Order...' : 'Create Order'}
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="border border-[#e5eaf2] bg-white rounded-[14px] p-5 sticky top-[106px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-[14.5px] font-bold text-[#13213c]">
              Order summary
            </h3>
            <span className="text-[11px] font-bold text-[#6e7891] tabular-nums">
              {selectedLines.length} {selectedLines.length === 1 ? 'service' : 'services'}
            </span>
          </div>

          <div className="space-y-3 pb-4 border-b border-[#e5eaf2]">
            {selectedLines.map(({ service, weightKg, subtotal }) => (
              <div key={service.id} className="flex items-center gap-3">
                <span
                  className={`w-9 h-9 rounded-[9px] grid place-items-center shrink-0 ${
                    COLOR_MAP[service.colorVariant] || COLOR_MAP.blue
                  }`}
                >
                  {ICON_MAP[service.iconKey] || ICON_MAP.shirt}
                </span>
                <div className="flex-1 min-w-0">
                  <b className="block text-[12.5px] text-[#13213c] truncate">
                    {service.name}
                  </b>
                  <small className="text-[11px] text-[#6e7891] tabular-nums">
                    {weightKg} kg × {formatPHP(service.pricePerKg)}
                  </small>
                </div>
                <b className="text-[12.5px] text-[#13213c] tabular-nums shrink-0">
                  {formatPHP(subtotal)}
                </b>
              </div>
            ))}
          </div>

          <div className="space-y-2 py-4 text-[12.5px] text-[#6e7891] tabular-nums">
            <div className="flex justify-between">
              <span>Total weight</span>
              <b className="text-[#17223b]">{totalWeightKg} kg</b>
            </div>
            <div className="flex justify-between">
              <span>Services subtotal</span>
              <b className="text-[#17223b]">{formatPHP(servicesSubtotal)}</b>
            </div>
            {addNum > 0 && (
              <div className="flex justify-between">
                <span>Additional charges</span>
                <b className="text-[#17223b]">{formatPHP(addNum)}</b>
              </div>
            )}
            {discNum > 0 && (
              <div className="flex justify-between text-[#14936c]">
                <span>Discount</span>
                <b>-{formatPHP(discNum)}</b>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3.5 border-t border-[#e5eaf2] tabular-nums">
            <span className="text-[13px] font-bold text-[#13213c]">Estimated total</span>
            <strong className="font-display text-[20px] font-extrabold text-[#13213c]">
              {formatPHP(estimatedTotal)}
            </strong>
          </div>

          <div className="mt-4 rounded-[10px] bg-[#f3f7fe] p-3 flex items-start gap-2.5 text-[#246bfd]">
            <Tag className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#65718a] leading-relaxed">
              Official Wash n&apos; Dash receipt and 7-stage tracking start immediately once created.
            </p>
          </div>
        </aside>
      </div>

      <ReceiptModal
        open={Boolean(createdOrder)}
        onClose={() => {
          setCreatedOrder(null);
          navigate(ordersPath);
        }}
        order={createdOrder}
      />
    </div>
  );
};
