import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Check,
  Droplets,
  Layers,
  MapPin,
  Minus,
  Phone,
  Plus,
  Shirt,
  Sparkles,
  Trash2,
  User,
  Wind,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  calculateMultiServiceTotal,
  formatDateTime,
  formatPHP,
} from '../../utils/formatters';

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

export const CustomerBookOrderPage = () => {
  const { user, customerProfile, services, createOrder, notify } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const availableServices = useMemo(
    () => services.filter((s) => s.available),
    [services]
  );

  const [selectedItems, setSelectedItems] = useState([]);
  const [expectedDate, setExpectedDate] = useState(() => {
    const d = new Date(Date.now() + 24 * 3600 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  useEffect(() => {
    const preselect = searchParams.get('service');
    if (selectedItems.length === 0 && availableServices.length > 0) {
      const target =
        (preselect && availableServices.find((s) => s.id === preselect)) ||
        availableServices[0];
      if (target) {
        setSelectedItems([{ serviceId: target.id, weightKg: 5 }]);
      }
    }
  }, [availableServices, searchParams, selectedItems.length]);

  const toggleService = (srv) => {
    if (!srv.available) return;
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.serviceId === srv.id);
      if (exists) {
        if (prev.length === 1) return prev;
        return prev.filter((i) => i.serviceId !== srv.id);
      }
      return [...prev, { serviceId: srv.id, weightKg: 3 }];
    });
  };

  const updateWeight = (serviceId, nextWeight) => {
    const clean = Math.max(0.5, Math.round(Number(nextWeight || 0.5) * 10) / 10);
    setSelectedItems((prev) =>
      prev.map((i) => (i.serviceId === serviceId ? { ...i, weightKg: clean } : i))
    );
  };

  const selectedLines = useMemo(
    () =>
      selectedItems
        .map((item) => {
          const srv = services.find((s) => s.id === item.serviceId);
          if (!srv) return null;
          return {
            service: srv,
            serviceId: srv.id,
            serviceName: srv.name,
            weightKg: item.weightKg,
            pricePerKg: srv.pricePerKg,
            subtotal: Math.round(item.weightKg * srv.pricePerKg * 100) / 100,
          };
        })
        .filter(Boolean),
    [selectedItems, services]
  );

  const totalWeight = useMemo(
    () => Math.round(selectedLines.reduce((s, l) => s + l.weightKg, 0) * 10) / 10,
    [selectedLines]
  );

  const estimatedTotal = useMemo(
    () => calculateMultiServiceTotal(selectedLines, 0, 0),
    [selectedLines]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedLines.length === 0) {
      notify('Please select at least one laundry service.', 'error');
      return;
    }
    if (!expectedDate) {
      notify('Please pick your target pickup date & time.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createOrder({
        services: selectedLines.map((l) => ({
          serviceId: l.serviceId,
          weightKg: l.weightKg,
        })),
        expectedCompletionDate: new Date(expectedDate).toISOString(),
        specialInstructions: specialInstructions.trim(),
      });

      if (created) {
        navigate(`/customer/tracking?order=${encodeURIComponent(created.id)}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const displayAddress = customerProfile?.address || user?.address || 'Not provided';
  const displayPhone = customerProfile?.contactNumber || user?.contactNumber || 'Not provided';

  if (confirmedOrder) {
    return (
      <section className="max-w-2xl mx-auto border border-[#bdecd9] bg-white rounded-[16px] p-6 sm:p-8 space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-[12px] bg-[#e3f8f1] text-[#14936c] grid place-items-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-[#14936c]">Order Confirmation</p>
            <h2 className="font-display text-[22px] font-extrabold text-[#13213c] mt-0.5 tabular-nums">
              Order {confirmedOrder.id} Placed Successfully
            </h2>
            <p className="text-[13px] text-[#5d6a85] mt-1">
              Our shop team has received your booking and will update your status as washing begins.
            </p>
          </div>
        </div>

        <div className="border border-[#e5eaf2] bg-[#f9fbff] rounded-[12px] p-4 space-y-2.5 text-[13px]">
          <div className="flex justify-between gap-3">
            <span className="text-[#6e7891]">Selected Services</span>
            <b className="text-[#13213c] text-right">{confirmedOrder.serviceName}</b>
          </div>
          <div className="flex justify-between gap-3 tabular-nums">
            <span className="text-[#6e7891]">Estimated Total Weight</span>
            <b className="text-[#13213c]">{confirmedOrder.weightKg} kg</b>
          </div>
          <div className="flex justify-between gap-3 tabular-nums">
            <span className="text-[#6e7891]">Target Pickup / Completion</span>
            <b className="text-[#13213c]">{formatDateTime(confirmedOrder.expectedCompletionDate)}</b>
          </div>
          <div className="flex justify-between gap-3 tabular-nums pt-2 border-t border-[#e5eaf2]">
            <span className="font-bold text-[#13213c]">Estimated Total Amount</span>
            <b className="font-display text-[18px] text-[#1d5ef3]">{formatPHP(confirmedOrder.totalAmount)}</b>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate('/customer/tracking?order=' + encodeURIComponent(confirmedOrder.id))}
            className="h-[42px] px-5 rounded-[10px] bg-[#1d5ef3] hover:bg-[#154fd6] text-white text-[13px] font-bold inline-flex items-center gap-2"
          >
            Track This Order
          </button>
          <button
            type="button"
            onClick={() => navigate('/customer/orders')}
            className="h-[42px] px-4 rounded-[10px] border border-[#dce6fa] bg-white hover:bg-[#f8fbff] text-[#13213c] text-[13px] font-bold"
          >
            View My Orders
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmedOrder(null);
              setSpecialInstructions('');
            }}
            className="h-[42px] px-4 rounded-[10px] text-[#1d5ef3] hover:bg-[#eaf1ff] text-[13px] font-bold"
          >
            Place Another Order
          </button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* Left Column: Service Selection & Care Details */}
      <div className="xl:col-span-8 space-y-5">
        <section className="border border-[#e5eaf2] bg-white rounded-[14px] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-display text-[15.5px] font-bold text-[#13213c]">
                1. Choose Laundry Services
              </h3>
              <p className="text-[12.5px] text-[#6e7891]">
                Select one or more services and enter your estimated load weight (kg).
              </p>
            </div>
            <span className="text-[12px] font-bold text-[#1d5ef3] tabular-nums">
              {selectedLines.length} selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((srv) => {
              const selected = selectedItems.find((i) => i.serviceId === srv.id);
              return (
                <div
                  key={srv.id}
                  onClick={() => toggleService(srv)}
                  role="button"
                  tabIndex={srv.available ? 0 : -1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleService(srv);
                    }
                  }}
                  className={`rounded-[12px] border p-4 transition-all ${
                    !srv.available
                      ? 'border-[#e5eaf2] bg-[#f8fafc] opacity-60 cursor-not-allowed'
                      : selected
                      ? 'border-[#1d5ef3] bg-[#f5f9ff] ring-2 ring-[#dce8ff] cursor-pointer'
                      : 'border-[#e5eaf2] bg-white hover:border-[#b7ceff] cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-10 h-10 rounded-[10px] grid place-items-center shrink-0 ${
                          COLOR_MAP[srv.colorVariant] || COLOR_MAP.blue
                        }`}
                      >
                        {ICON_MAP[srv.iconKey] || ICON_MAP.shirt}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-display text-[14px] font-bold text-[#13213c] truncate">
                          {srv.name}
                        </h4>
                        <p className="text-[11.5px] text-[#6e7891]">
                          {srv.estimatedTime} ·{' '}
                          <b className="text-[#1d5ef3] tabular-nums">
                            {formatPHP(srv.pricePerKg)}/kg
                          </b>
                        </p>
                      </div>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-full grid place-items-center shrink-0 border ${
                        selected
                          ? 'bg-[#1d5ef3] border-[#1d5ef3] text-white'
                          : 'border-[#cbd5e1] bg-white'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3" />}
                    </span>
                  </div>

                  <p className="text-[12px] text-[#5d6a85] mt-2.5 line-clamp-2">
                    {srv.description}
                  </p>

                  {!srv.available && (
                    <p className="text-[11px] font-bold text-[#dc2626] mt-2">
                      Currently Unavailable
                    </p>
                  )}

                  {selected && (
                    <div
                      className="mt-3 pt-3 border-t border-[#dce6fa] flex items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[12px] font-bold text-[#13213c]">
                        Estimated Weight (kg)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateWeight(srv.id, selected.weightKg - 0.5)}
                          className="w-7 h-7 rounded-[7px] border border-[#dce6fa] bg-white hover:bg-[#eef4ff] grid place-items-center text-[#13213c]"
                          aria-label="Decrease weight"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={selected.weightKg}
                          onChange={(e) => updateWeight(srv.id, e.target.value)}
                          className="w-16 h-7 text-center rounded-[7px] border border-[#dce6fa] bg-white text-[12.5px] font-bold text-[#13213c] tabular-nums"
                        />
                        <button
                          type="button"
                          onClick={() => updateWeight(srv.id, selected.weightKg + 0.5)}
                          className="w-7 h-7 rounded-[7px] border border-[#dce6fa] bg-white hover:bg-[#eef4ff] grid place-items-center text-[#13213c]"
                          aria-label="Increase weight"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="border border-[#e5eaf2] bg-white rounded-[14px] p-5 space-y-4">
          <h3 className="font-display text-[15.5px] font-bold text-[#13213c]">
            2. Schedule &amp; Garment Instructions
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="cust-expected-date"
                className="block text-[12px] font-bold text-[#13213c] mb-1.5"
              >
                Preferred Target Completion / Pickup
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#6e7891] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="cust-expected-date"
                  type="datetime-local"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full h-[42px] pl-10 pr-3 rounded-[10px] border border-[#dce6fa] bg-white text-[13px] text-[#13213c] focus:border-[#1d5ef3]"
                />
              </div>
            </div>

            <div className="rounded-[10px] border border-[#dce6fa] bg-[#f8fbff] px-3.5 py-2.5 text-[12px] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#13213c] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#1d5ef3]" />
                  {user?.name}
                </span>
                <Link
                  to="/customer/profile"
                  className="text-[11px] font-bold text-[#1d5ef3] hover:underline"
                >
                  Edit profile
                </Link>
              </div>
              <p className="text-[#5d6a85] flex items-center gap-1.5 tabular-nums">
                <Phone className="w-3 h-3 text-[#6e7891]" />
                {displayPhone}
              </p>
              <p className="text-[#5d6a85] flex items-center gap-1.5 truncate">
                <MapPin className="w-3 h-3 text-[#6e7891] shrink-0" />
                <span className="truncate">{displayAddress}</span>
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="cust-notes"
              className="block text-[12px] font-bold text-[#13213c] mb-1.5"
            >
              Special Washing / Folding Notes (Optional)
            </label>
            <textarea
              id="cust-notes"
              rows={3}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g., Separate white school uniforms, use hypoallergenic conditioner, hang dry polos..."
              className="w-full p-3 rounded-[10px] border border-[#dce6fa] bg-white text-[13px] text-[#13213c] focus:border-[#1d5ef3]"
            />
          </div>
        </section>
      </div>

      {/* Right Column: Sticky Order Estimate Ticket */}
      <aside className="xl:col-span-4 border border-[#dce6fa] bg-white rounded-[14px] p-5 xl:sticky xl:top-6 space-y-4">
        <div className="border-b border-[#e5eaf2] pb-3">
          <h3 className="font-display text-[15.5px] font-extrabold text-[#13213c]">
            Order Estimate Summary
          </h3>
          <p className="text-[12px] text-[#6e7891]">
            Final weight &amp; payment are verified at the shop counter upon drop-off.
          </p>
        </div>

        {selectedLines.length === 0 ? (
          <p className="text-[12.5px] text-[#6e7891] py-4 text-center">
            Select at least one service to calculate an estimate.
          </p>
        ) : (
          <div className="divide-y divide-[#f0f3f8] space-y-2">
            {selectedLines.map((line) => (
              <div
                key={line.serviceId}
                className="pt-2 first:pt-0 flex items-center justify-between gap-2 text-[12.5px]"
              >
                <div className="min-w-0">
                  <p className="font-bold text-[#13213c] truncate">{line.serviceName}</p>
                  <p className="text-[11px] text-[#6e7891] tabular-nums">
                    {line.weightKg.toFixed(1)} kg × {formatPHP(line.pricePerKg)}/kg
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <b className="text-[#13213c] tabular-nums">{formatPHP(line.subtotal)}</b>
                  {selectedLines.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedItems((prev) =>
                          prev.filter((i) => i.serviceId !== line.serviceId)
                        )
                      }
                      aria-label={`Remove ${line.serviceName}`}
                      className="text-[#94a3b8] hover:text-[#dc2626]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-[#e5eaf2] pt-3 space-y-1.5 text-[12.5px]">
          <div className="flex justify-between text-[#5d6a85] tabular-nums">
            <span>Estimated Total Weight</span>
            <b className="text-[#13213c]">{totalWeight.toFixed(1)} kg</b>
          </div>
          <div className="flex justify-between text-[#5d6a85] tabular-nums">
            <span>Target Ready Time</span>
            <b className="text-[#13213c]">
              {expectedDate ? formatDateTime(new Date(expectedDate).toISOString()) : '—'}
            </b>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t border-dashed border-[#dce6fa]">
            <span className="font-display font-bold text-[14px] text-[#13213c]">
              Estimated Total
            </span>
            <strong className="font-display text-[22px] font-extrabold text-[#1d5ef3] tabular-nums">
              {formatPHP(estimatedTotal)}
            </strong>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || selectedLines.length === 0}
          className="w-full h-[46px] rounded-[10px] bg-[#1d5ef3] hover:bg-[#154fd6] text-white font-display text-[14px] font-bold shadow-[0_8px_20px_rgba(29,94,243,0.24)] transition-all disabled:opacity-60"
        >
          {submitting ? 'Submitting Request...' : 'Submit Laundry Request'}
        </button>
      </aside>
    </form>
  );
};
