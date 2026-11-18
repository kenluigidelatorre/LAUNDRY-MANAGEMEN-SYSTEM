import React, { useEffect, useMemo, useState } from 'react';
import { Check, Minus, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  calculateMultiServiceTotal,
  formatPHP,
  getOrderServiceLines,
} from '../../utils/formatters';
import { Modal } from '../common/UIPrimitives';

export const OrderFormModal = ({ open, onClose, editingOrder }) => {
  const {
    user,
    customers,
    services,
    staff,
    createOrder,
    updateOrder,
  } = useApp();

  const editingIds = editingOrder
    ? new Set(getOrderServiceLines(editingOrder).map((l) => l.serviceId))
    : new Set();

  const availableServices = services.filter(
    (s) => s.available || editingIds.has(s.id)
  );
  const activeStaff = staff.filter((s) => s.status === 'Active');

  const defaultDue = () => {
    const d = new Date(Date.now() + 24 * 3600 * 1000);
    return d.toISOString().slice(0, 16);
  };

  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [selectedItems, setSelectedItems] = useState([]);
  const [additionalCharges, setAdditionalCharges] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [initialPayment, setInitialPayment] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [expectedDate, setExpectedDate] = useState(defaultDue());
  const [assignedStaffId, setAssignedStaffId] = useState(
    user?.id || activeStaff[0]?.id || ''
  );
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setSubmitting(false);
    if (editingOrder) {
      setCustomerId(editingOrder.customerId);
      setSelectedItems(
        getOrderServiceLines(editingOrder).map((l) => ({
          serviceId: l.serviceId,
          weightKg: l.weightKg,
        }))
      );
      setAdditionalCharges(String(editingOrder.additionalCharges));
      setDiscount(String(editingOrder.discount));
      setExpectedDate(
        new Date(editingOrder.expectedCompletionDate).toISOString().slice(0, 16)
      );
      setAssignedStaffId(editingOrder.assignedStaffId);
      setSpecialInstructions(editingOrder.specialInstructions || '');
    } else {
      const first = availableServices[0] || services[0];
      setCustomerId(customers[0]?.id || '');
      setSelectedItems(first ? [{ serviceId: first.id, weightKg: 5 }] : []);
      setAdditionalCharges('0');
      setDiscount('0');
      setInitialPayment('0');
      setPaymentMethod('Cash');
      setExpectedDate(defaultDue());
      setAssignedStaffId(
        activeStaff.find((s) => s.id === user?.id)?.id || activeStaff[0]?.id || ''
      );
      setSpecialInstructions('');
    }
  }, [open, editingOrder]);

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

  const addNum = Math.max(0, parseFloat(additionalCharges) || 0);
  const discNum = Math.max(0, parseFloat(discount) || 0);
  const totalWeightKg =
    Math.round(selectedLines.reduce((s, l) => s + l.weightKg, 0) * 10) / 10;
  const computedTotal = calculateMultiServiceTotal(
    selectedLines.map((l) => ({
      weightKg: l.weightKg,
      pricePerKg: l.service.pricePerKg,
    })),
    addNum,
    discNum
  );

  const toggleService = (serviceId) => {
    setSelectedItems((prev) => {
      if (prev.some((i) => i.serviceId === serviceId)) {
        if (prev.length <= 1) return prev;
        return prev.filter((i) => i.serviceId !== serviceId);
      }
      return [...prev, { serviceId, weightKg: 3 }];
    });
  };

  const updateWeight = (serviceId, weightKg) => {
    const clamped = Math.max(0.5, Math.round(weightKg * 10) / 10);
    setSelectedItems((prev) =>
      prev.map((i) => (i.serviceId === serviceId ? { ...i, weightKg: clamped } : i))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId || selectedLines.length === 0) {
      setError('Please select a customer and at least one laundry service.');
      return;
    }
    if (!expectedDate) {
      setError('Please select an expected completion date.');
      return;
    }

    const payloadServices = selectedLines.map((l) => ({
      serviceId: l.service.id,
      weightKg: l.weightKg,
    }));

    setSubmitting(true);
    setError('');
    try {
      if (editingOrder) {
        const ok = await updateOrder({
          id: editingOrder.id,
          services: payloadServices,
          additionalCharges: addNum,
          discount: discNum,
          expectedCompletionDate: new Date(expectedDate).toISOString(),
          assignedStaffId,
          specialInstructions,
        });
        if (ok) onClose();
      } else {
        const initPay = Math.max(0, parseFloat(initialPayment) || 0);
        if (initPay > computedTotal) {
          setError(
            `Initial payment cannot exceed total amount (${formatPHP(computedTotal)}).`
          );
          return;
        }
        const created = await createOrder({
          customerId,
          services: payloadServices,
          additionalCharges: addNum,
          discount: discNum,
          initialPayment: initPay,
          paymentMethod,
          expectedCompletionDate: new Date(expectedDate).toISOString(),
          assignedStaffId,
          specialInstructions,
        });
        if (created) onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingOrder ? `Edit Order · ${editingOrder.id}` : 'Create New Laundry Order'}
      subtitle="Select one or more services. All totals are calculated in Philippine Peso (₱)."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-[10px] bg-[#fff1f2] border border-[#fecdd3] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#dc2626]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
              Customer
            </label>
            <select
              value={customerId}
              disabled={Boolean(editingOrder)}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full h-[42px] px-3 rounded-[10px] border border-[#e5eaf2] text-[13px] bg-white disabled:bg-[#f5f7fb]"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.contactNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
              Assigned Staff
            </label>
            <select
              value={assignedStaffId}
              onChange={(e) => setAssignedStaffId(e.target.value)}
              className="w-full h-[42px] px-3 rounded-[10px] border border-[#e5eaf2] text-[13px] bg-white"
            >
              {activeStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Multi-service picker */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[12px] font-bold text-[#17223b]">
              Laundry Services (select one or multiple)
            </label>
            <span className="text-[11px] font-bold text-[#246bfd] tabular-nums">
              {selectedLines.length} selected · {totalWeightKg} kg
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {availableServices.map((s) => {
              const active = selectedItems.some((i) => i.serviceId === s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleService(s.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] border text-[12px] font-semibold transition-colors ${
                    active
                      ? 'border-[#246bfd] bg-[#eaf2ff] text-[#246bfd]'
                      : 'border-[#e5eaf2] bg-white text-[#5d6880] hover:border-[#cfdbed]'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                  <span>{s.name}</span>
                  <span className="text-[11px] opacity-80 tabular-nums">
                    ({formatPHP(s.pricePerKg)}/kg)
                  </span>
                </button>
              );
            })}
          </div>

          <div className="divide-y divide-[#e5eaf2] border border-[#e5eaf2] rounded-[11px] bg-[#fcfdff]">
            {selectedLines.map(({ service, weightKg, subtotal }) => (
              <div
                key={service.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5"
              >
                <div>
                  <b className="text-[12.5px] text-[#13213c] block">{service.name}</b>
                  <small className="text-[11px] text-[#6e7891] tabular-nums">
                    {formatPHP(service.pricePerKg)}/kg · {formatPHP(subtotal)}
                  </small>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center border border-[#e5eaf2] rounded-[8px] overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => updateWeight(service.id, weightKg - 0.5)}
                      className="w-8 h-8 grid place-items-center text-[#5d6880] hover:bg-[#f5f7fb]"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={weightKg}
                      onChange={(e) =>
                        updateWeight(service.id, parseFloat(e.target.value) || 0.5)
                      }
                      className="w-14 h-8 text-center text-[12.5px] font-bold text-[#13213c] border-x border-[#e5eaf2] tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() => updateWeight(service.id, weightKg + 0.5)}
                      className="w-8 h-8 grid place-items-center text-[#246bfd] hover:bg-[#f5f7fb]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {selectedLines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => toggleService(service.id)}
                      className="p-1.5 rounded-[7px] text-[#8d97a9] hover:text-[#dc2626] hover:bg-[#fff1f2]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
              Additional Charges (₱)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={additionalCharges}
              onChange={(e) => setAdditionalCharges(e.target.value)}
              className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] tabular-nums focus:border-[#246bfd]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
              Discount (₱)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] tabular-nums focus:border-[#246bfd]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
              Expected Completion Date
            </label>
            <input
              type="datetime-local"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full h-[42px] px-3 rounded-[10px] border border-[#e5eaf2] text-[12.5px] tabular-nums focus:border-[#246bfd]"
            />
          </div>

          {!editingOrder && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                  Amount Paid (₱)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={initialPayment}
                  onChange={(e) => setInitialPayment(e.target.value)}
                  className="w-full h-[42px] px-3 rounded-[10px] border border-[#e5eaf2] text-[13px] tabular-nums focus:border-[#246bfd]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                  Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-[42px] px-2.5 rounded-[10px] border border-[#e5eaf2] text-[12.5px] bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="GCash">GCash</option>
                  <option value="Maya">Maya</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
            Special Instructions
          </label>
          <textarea
            rows={2}
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Fabric sensitivity, stain notes, folding preference..."
            className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#e5eaf2] text-[13px] focus:border-[#246bfd] resize-none"
          />
        </div>

        <div className="rounded-[12px] bg-[#f5f8fe] border border-[#dce8ff] p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[12px] text-[#5d6880] tabular-nums">
            <span>
              {selectedLines.length} {selectedLines.length === 1 ? 'service' : 'services'} ·{' '}
              {totalWeightKg.toFixed(1)} kg
            </span>
            {addNum > 0 && <span> + {formatPHP(addNum)} extras</span>}
            {discNum > 0 && <span> − {formatPHP(discNum)} discount</span>}
          </div>
          <div className="text-right">
            <span className="block text-[10.5px] font-bold uppercase tracking-wider text-[#246bfd]">
              Total Order Amount
            </span>
            <strong className="font-display text-[22px] font-extrabold text-[#13213c] tabular-nums">
              {formatPHP(computedTotal)}
            </strong>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-[10px] border border-[#e5eaf2] text-[13px] font-semibold text-[#5d6880] hover:bg-[#f9fbff]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-[10px] bg-[#246bfd] hover:bg-[#1557dc] text-white text-[13px] font-bold shadow-[0_8px_20px_rgba(36,107,253,0.2)] transition-all disabled:opacity-60"
          >
            {submitting
              ? 'Saving...'
              : editingOrder
              ? 'Save Order Changes'
              : 'Create Order'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
