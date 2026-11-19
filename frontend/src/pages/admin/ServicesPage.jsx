import React, { useState } from 'react';
import {
  Droplets,
  Edit3,
  Eye,
  Layers,
  Plus,
  Power,
  Shirt,
  Sparkles,
  Wind,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatPHP } from '../../utils/formatters';
import { Modal } from '../../components/common/UIPrimitives';

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

const ICON_COLOR_MAP = {
  shirt: 'blue',
  droplets: 'mint',
  sparkles: 'violet',
  layers: 'peach',
  wind: 'mint',
  zap: 'peach',
};

export const ServicesPage = () => {
  const {
    services,
    addService,
    updateService,
    toggleServiceStatus,
  } = useApp();
=======
export const ServicesPage = () => {
  const { services, addService, updateService, toggleServiceStatus } = useApp();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerKg, setPricePerKg] = useState('45');
  const [estimatedTime, setEstimatedTime] = useState('24 hrs');
  const [available, setAvailable] = useState(true);
  const [iconKey, setIconKey] = useState('shirt');

=======
  const [colorVariant, setColorVariant] = useState('blue');
  
  const [error, setError] = useState('');

  const openAdd = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setPricePerKg('45');
    setEstimatedTime('24 hrs');
    setAvailable(true);
    setIconKey('shirt');
=======
    setColorVariant('blue');

    setError('');
    setFormOpen(true);
  };

  const openEdit = (srv) => {
    setEditing(srv);
    setName(srv.name);
    setDescription(srv.description);
    setPricePerKg(String(srv.pricePerKg));
    setEstimatedTime(srv.estimatedTime);
    setAvailable(srv.available);
    setIconKey(srv.iconKey || 'shirt');
=======
    setIconKey(srv.iconKey);
    setColorVariant(srv.colorVariant);
    setError('');
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();


    const priceNum = parseFloat(pricePerKg);

    if (!name.trim() || !description.trim() || !estimatedTime.trim()) {
      setError(
        'Service name, description, and estimated processing time are required.'
      );
      return;
    }

=======
    const priceNum = parseFloat(pricePerKg);
    if (!name.trim() || !description.trim() || !estimatedTime.trim()) {
      setError('Service name, description, and estimated processing time are required.');
      return;
    }

    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setError('Price per kilogram must be greater than ₱0.00.');
      return;
    }

    setSaving(true);

    try {
      const serviceData = {
        name: name.trim(),
        description: description.trim(),
        pricePerKg: priceNum,
        estimatedTime: estimatedTime.trim(),
        available,
        iconKey,
        colorVariant: ICON_COLOR_MAP[iconKey] || 'blue',
      };

      let saved;

      if (editing) {
        saved = await updateService({
          ...editing,
          ...serviceData,
        });
      } else {
        saved = await addService(serviceData);
      }

=======
    try {
      let saved;
      if (editing) {
        saved = await updateService({
          ...editing,
          name: name.trim(),
          description: description.trim(),
          pricePerKg: priceNum,
          estimatedTime: estimatedTime.trim(),
          available,
          iconKey,
          colorVariant,
        });
      } else {
        saved = await addService({
          name: name.trim(),
          description: description.trim(),
          pricePerKg: priceNum,
          estimatedTime: estimatedTime.trim(),
          available,
          iconKey,
          colorVariant,
        });
      }

      if (saved) {
        setFormOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-[18px] font-extrabold text-[#13213c]">
            Service Catalog &amp; PHP Pricing
          </h2>

          <p className="text-[12.5px] text-[#6e7891] mt-0.5">
            Manage Wash n&apos; Dash service availability, turnaround times,
            and Philippine Peso (₱) per-kilogram rates.
          </p>
        </div>

=======
          <p className="text-[12.5px] text-[#6e7891] mt-0.5">
            Manage Wash n&apos; Dash service availability, turnaround times, and Philippine Peso (₱) per-kilogram rates.
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#246bfd] hover:bg-[#1557dc] text-white text-[13px] font-bold shadow-[0_8px_20px_rgba(36,107,253,0.2)] transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {services.map((srv) => {
          const serviceColor =
            ICON_COLOR_MAP[srv.iconKey] || 'blue';

          return (
            <article
              key={srv.id}
              className="border border-[#e5eaf2] bg-white rounded-[14px] p-5 flex flex-col transition-all hover:border-[#cfdbed]"
            >
              <div className="flex items-start justify-between">
                <span
                  className={`w-[48px] h-[48px] rounded-[14px] grid place-items-center ${
                    COLOR_MAP[serviceColor] || COLOR_MAP.blue
                  }`}
                >
                  {ICON_MAP[srv.iconKey] || ICON_MAP.shirt}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="View Service Details"
                    onClick={() => setViewing(srv)}
                    className="p-1.5 rounded-[8px] text-[#6e7891] hover:text-[#246bfd] hover:bg-[#eaf2ff]"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    title={
                      srv.available
                        ? 'Deactivate Service'
                        : 'Activate Service'
                    }
                    onClick={() => toggleServiceStatus(srv.id)}
                    className="p-1.5 rounded-[8px] text-[#6e7891] hover:text-[#13213c] hover:bg-[#f5f7fb]"
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <span className="text-[10.5px] font-bold text-[#9aa3b5] tabular-nums">
                  {srv.id}
                </span>

                <h3 className="font-display text-[16px] font-bold text-[#13213c] mt-0.5">
                  {srv.name}
                </h3>

                <p className="text-[12.5px] text-[#6e7891] mt-1.5 leading-relaxed min-h-[40px]">
                  {srv.description}
                </p>
              </div>

              <div className="grid grid-cols-2 border-t border-[#e5eaf2] mt-4 pt-3.5">
                <div>
                  <small className="block text-[10.5px] text-[#6e7891]">
                    Price per KG
                  </small>

                  <b className="font-display text-[15px] font-extrabold text-[#13213c] tabular-nums">
                    {formatPHP(srv.pricePerKg)}
                  </b>
                </div>

                <div>
                  <small className="block text-[10.5px] text-[#6e7891]">
                    Est. Processing
                  </small>

                  <b className="text-[13.5px] font-bold text-[#17223b]">
                    {srv.estimatedTime}
                  </b>
                </div>
              </div>

              <footer className="flex items-center justify-between border-t border-[#e5eaf2] mt-4 pt-3.5">
                <span
                  className={`inline-flex rounded-[6px] px-2.5 py-1 text-[11px] font-bold ${
                    srv.available
                      ? 'bg-[#e3f8f1] text-[#14936c]'
                      : 'bg-[#edf0f4] text-[#778195]'
                  }`}
                >
                  {srv.available ? 'Active' : 'Inactive'}
                </span>

                <button
                  type="button"
                  onClick={() => openEdit(srv)}
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#246bfd] hover:underline"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Service
                </button>
              </footer>
            </article>
          );
        })}
=======
        {services.map((srv) => (
          <article
            key={srv.id}
            className="border border-[#e5eaf2] bg-white rounded-[14px] p-5 flex flex-col transition-all hover:border-[#cfdbed]"
          >
            <div className="flex items-start justify-between">
              <span
                className={`w-[48px] h-[48px] rounded-[14px] grid place-items-center ${COLOR_MAP[srv.colorVariant] || COLOR_MAP.blue}`}
              >
                {ICON_MAP[srv.iconKey] || ICON_MAP.shirt}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="View Service Details"
                  onClick={() => setViewing(srv)}
                  className="p-1.5 rounded-[8px] text-[#6e7891] hover:text-[#246bfd] hover:bg-[#eaf2ff]"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title={srv.available ? 'Deactivate Service' : 'Activate Service'}
                  onClick={() => toggleServiceStatus(srv.id)}
                  className="p-1.5 rounded-[8px] text-[#6e7891] hover:text-[#13213c] hover:bg-[#f5f7fb]"
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-[10.5px] font-bold text-[#9aa3b5] tabular-nums">
                {srv.id}
              </span>
              <h3 className="font-display text-[16px] font-bold text-[#13213c] mt-0.5">
                {srv.name}
              </h3>
              <p className="text-[12.5px] text-[#6e7891] mt-1.5 leading-relaxed min-h-[40px]">
                {srv.description}
              </p>
            </div>

            <div className="grid grid-cols-2 border-t border-[#e5eaf2] mt-4 pt-3.5">
              <div>
                <small className="block text-[10.5px] text-[#6e7891]">Price per KG</small>
                <b className="font-display text-[15px] font-extrabold text-[#13213c] tabular-nums">
                  {formatPHP(srv.pricePerKg)}
                </b>
              </div>
              <div>
                <small className="block text-[10.5px] text-[#6e7891]">Est. Processing</small>
                <b className="text-[13.5px] font-bold text-[#17223b]">{srv.estimatedTime}</b>
              </div>
            </div>

            <footer className="flex items-center justify-between border-t border-[#e5eaf2] mt-4 pt-3.5">
              <span
                className={`inline-flex rounded-[6px] px-2.5 py-1 text-[11px] font-bold ${
                  srv.available
                    ? 'bg-[#e3f8f1] text-[#14936c]'
                    : 'bg-[#edf0f4] text-[#778195]'
                }`}
              >
                {srv.available ? 'Active' : 'Inactive'}
              </span>
              <button
                type="button"
                onClick={() => openEdit(srv)}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#246bfd] hover:underline"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Service
              </button>
            </footer>
          </article>
        ))}

      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}

        title={
          editing
            ? `Edit Service · ${editing.name}`
            : 'Add New Laundry Service'
        }
=======
        title={editing ? `Edit Service · ${editing.name}` : 'Add New Laundry Service'}
        subtitle="Set Philippine Peso (₱) per-kilogram rate and estimated turnaround time."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="rounded-[10px] bg-[#fff1f2] border border-[#fecdd3] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#dc2626]">
              {error}
            </div>
          )}

=======

          <div>
            <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
              Service Name
            </label>


=======

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Wash, Dry & Fold"
              className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] focus:border-[#246bfd]"
            />
          </div>


=======

          <div>
            <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
              Description
            </label>


=======
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#e5eaf2] text-[13px] resize-none focus:border-[#246bfd]"
            />
          </div>

=======
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                Price per Kilogram (₱)
              </label>

=======
              <input
                type="number"
                step="1"
                min="1"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(e.target.value)}
                className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] tabular-nums focus:border-[#246bfd]"
              />
            </div>

=======

            <div>
              <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                Estimated Processing Time
              </label>


=======

              <input
                type="text"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                placeholder="e.g., 24 hrs"
                className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] focus:border-[#246bfd]"
              />
            </div>
          </div>


          <div>
            <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
              Icon Style
            </label>

            <select
              value={iconKey}
              onChange={(e) => setIconKey(e.target.value)}
              className="w-full h-[42px] px-3 rounded-[10px] border border-[#e5eaf2] text-[13px] bg-white"
            >
              <option value="shirt">Garment / Fold</option>
              <option value="droplets">Wash &amp; Rinse</option>
              <option value="sparkles">Dry Cleaning</option>
              <option value="layers">Comforters</option>
              <option value="wind">Steam / Iron</option>
              <option value="zap">Express</option>
            </select>

            <p className="text-[11px] text-[#9aa3b5] mt-1.5">
              Accent color is automatically assigned based on the selected icon.
            </p>
=======
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                Icon Style
              </label>
              <select
                value={iconKey}
                onChange={(e) => setIconKey(e.target.value)}
                className="w-full h-[42px] px-3 rounded-[10px] border border-[#e5eaf2] text-[13px] bg-white"
              >
                <option value="shirt">Garment / Fold</option>
                <option value="droplets">Wash &amp; Rinse</option>
                <option value="sparkles">Dry Cleaning</option>
                <option value="layers">Comforters</option>
                <option value="wind">Steam / Iron</option>
                <option value="zap">Express</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                Color Accent
              </label>
              <select
                value={colorVariant}
                onChange={(e) => setColorVariant(e.target.value)}
                className="w-full h-[42px] px-3 rounded-[10px] border border-[#e5eaf2] text-[13px] bg-white"
              >
                <option value="blue">Primary Blue</option>
                <option value="mint">Fresh Mint</option>
                <option value="violet">Soft Violet</option>
                <option value="peach">Warm Amber</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-[13px] font-semibold text-[#17223b] cursor-pointer">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
              className="w-4 h-4 accent-[#246bfd]"
            />
            Service available for new orders
          </label>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2.5 rounded-[10px] border border-[#e5eaf2] text-[13px] font-semibold text-[#5d6880]"
            >
              Cancel
            </button>

=======

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-[10px] bg-[#246bfd] hover:bg-[#1557dc] text-white text-[13px] font-bold disabled:opacity-60"
            >

              {saving
                ? 'Saving...'
                : editing
                  ? 'Update Service'
                  : 'Save Service'}
=======
              {saving ? 'Saving...' : editing ? 'Update Service' : 'Save Service'}

            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing ? viewing.name : ''}
        subtitle={
          viewing
            ? `${viewing.id} · Wash n' Dash Service Catalog`
            : ''
        }
=======
        subtitle={viewing ? `${viewing.id} · Wash n' Dash Service Catalog` : ''}

        maxWidth="max-w-md"
      >
        {viewing && (
          <div className="space-y-4 text-[13px]">

            <p className="text-[#5d6880] leading-relaxed">
              {viewing.description}
            </p>

            <div className="border-t border-[#e5eaf2] pt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-[#6e7891]">Rate per KG</span>
                <b className="tabular-nums">
                  {formatPHP(viewing.pricePerKg)}
                </b>
              </div>

              <div className="flex justify-between">
                <span className="text-[#6e7891]">
                  Estimated Processing Time
                </span>
                <b>{viewing.estimatedTime}</b>
              </div>

              <div className="flex justify-between">
                <span className="text-[#6e7891]">Availability</span>
                <b
                  className={
                    viewing.available
                      ? 'text-[#14936c]'
                      : 'text-[#6e7891]'
                  }
                >
=======
            <p className="text-[#5d6880] leading-relaxed">{viewing.description}</p>
            <div className="border-t border-[#e5eaf2] pt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-[#6e7891]">Rate per KG</span>
                <b className="tabular-nums">{formatPHP(viewing.pricePerKg)}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6e7891]">Estimated Processing Time</span>
                <b>{viewing.estimatedTime}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6e7891]">Availability</span>
                <b className={viewing.available ? 'text-[#14936c]' : 'text-[#6e7891]'}>

                  {viewing.available ? 'Active' : 'Inactive'}
                </b>
              </div>
            </div>


=======

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const target = viewing;
                  setViewing(null);
                  openEdit(target);
                }}
                className="px-4 py-2 rounded-[9px] bg-[#246bfd] text-white text-[12.5px] font-bold"
              >
                Edit Service
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
