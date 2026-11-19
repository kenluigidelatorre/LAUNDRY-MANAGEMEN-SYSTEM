import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  Boxes,
  Edit3,
  Minus,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateTime, getStockStatus } from '../../utils/formatters';
import {
  ConfirmationDialog,
  EmptyState,
  Modal,
  SearchBar,
  StockStatusBadge,
} from '../../components/common/UIPrimitives';

export const InventoryPage = () => {
  const {
    inventory,
    addInventoryItem,
    updateInventoryItem,
    updateInventoryStock,
    archiveInventoryItem,
  } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [archiving, setArchiving] = useState(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Detergents');
  const [quantity, setQuantity] = useState('20');
  const [minThreshold, setMinThreshold] = useState('10');
  const [unit, setUnit] = useState('Liters');
  const [error, setError] = useState('');

  const activeItems = useMemo(
    () => inventory.filter((i) => !i.archived),
    [inventory]
  );

  const alertItems = useMemo(
    () =>
      activeItems.filter(
        (i) => getStockStatus(i.quantity, i.minThreshold) !== 'In Stock'
      ),
    [activeItems]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeItems.filter((item) => {
      const st = getStockStatus(item.quantity, item.minThreshold);
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (statusFilter !== 'ALL' && st !== statusFilter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [activeItems, search, categoryFilter, statusFilter]);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setCategory('Detergents');
    setQuantity('20');
    setMinThreshold('10');
    setUnit('Liters');
    setError('');
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setName(item.name);
    setCategory(item.category);
    setQuantity(String(item.quantity));
    setMinThreshold(String(item.minThreshold));
    setUnit(item.unit);
    setError('');
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const qty = Math.max(0, parseInt(quantity, 10) || 0);
    const min = Math.max(1, parseInt(minThreshold, 10) || 1);
    if (!name.trim() || !unit.trim()) {
      setError('Item Name and Unit are required.');
      return;
    }

    setSaving(true);
    try {
      let saved;
      if (editing) {
        saved = await updateInventoryItem({
          ...editing,
          name: name.trim(),
          category,
          quantity: qty,
          minThreshold: min,
          unit: unit.trim(),
        });
      } else {
        saved = await addInventoryItem({
          name: name.trim(),
          category,
          quantity: qty,
          minThreshold: min,
          unit: unit.trim(),
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
      {alertItems.length > 0 && (
        <div className="rounded-[14px] border border-[#fde68a] bg-[#fffbeb] p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-[10px] bg-[#fef3c7] text-[#c26d18] grid place-items-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <b className="block text-[13.5px] text-[#92400e]">
                Low Stock Alerts ({alertItems.length} item{alertItems.length > 1 ? 's' : ''})
              </b>
              <p className="text-[12px] text-[#b45309]">
                {alertItems.map((i) => `${i.name} (${i.quantity} ${i.unit})`).join(' · ')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter('Low Stock')}
            className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#fcd34d] text-[#92400e] text-[12px] font-bold hover:bg-[#fef3c7]"
          >
            Filter Low Stock
          </button>
        </div>
      )}

      <section className="border border-[#e5eaf2] bg-white rounded-[14px]">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-b border-[#e5eaf2]">
          <div>
            <h2 className="font-display text-[16px] font-bold text-[#13213c]">
              Laundry Supplies &amp; Inventory
            </h2>
            <p className="text-[12px] text-[#6e7891] mt-0.5 tabular-nums">
              {activeItems.length} active stock items · Automatic threshold monitoring
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#246bfd] hover:bg-[#1557dc] text-white text-[13px] font-bold shadow-[0_8px_20px_rgba(36,107,253,0.2)] transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Inventory Item
          </button>
        </div>

        <div className="p-4 border-b border-[#e5eaf2] flex flex-wrap items-center gap-2.5 bg-[#fcfdff]">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by item ID, name, or category..."
            className="flex-1 min-w-[230px]"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-[40px] px-3 rounded-[10px] border border-[#e5eaf2] bg-white text-[12.5px]"
          >
            <option value="ALL">All Categories</option>
            <option value="Detergents">Detergents</option>
            <option value="Fabric Care">Fabric Care</option>
            <option value="Stain Removal">Stain Removal</option>
            <option value="Packaging">Packaging</option>
            <option value="Supplies">Supplies</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-[40px] px-3 rounded-[10px] border border-[#e5eaf2] bg-white text-[12.5px]"
          >
            <option value="ALL">All Stock Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Boxes className="w-6 h-6" />}
            title="No inventory items found"
            description="Add laundry detergents, fabric softeners, or packaging items."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] border-collapse">
              <thead>
                <tr className="bg-[#fafbfc] text-[10.5px] font-bold uppercase tracking-[0.5px] text-[#8b96aa]">
                  <th className="text-left px-5 py-3">Item ID</th>
                  <th className="text-left px-4 py-3">Item Name</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-center px-4 py-3">Quantity</th>
                  <th className="text-left px-4 py-3">Unit</th>
                  <th className="text-left px-4 py-3">Stock Status</th>
                  <th className="text-left px-4 py-3">Last Updated</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5eaf2] text-[12.5px]">
                {filtered.map((item) => {
                  const st = getStockStatus(item.quantity, item.minThreshold);
                  return (
                    <tr key={item.id} className="hover:bg-[#f9fbff]">
                      <td className="px-5 py-3.5 font-display font-bold text-[#13213c] tabular-nums">
                        {item.id}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#17223b]">{item.name}</td>
                      <td className="px-4 py-3.5 text-[#5d6880]">{item.category}</td>
                      <td className="px-4 py-3.5">
                        <div className="inline-flex items-center gap-1.5 border border-[#e5eaf2] rounded-[8px] bg-white px-1 py-0.5">
                          <button
                            type="button"
                            onClick={() => updateInventoryStock(item.id, -1, 'delta')}
                            className="w-6 h-6 rounded-[6px] hover:bg-[#f5f7fb] grid place-items-center text-[#5d6880]"
                            aria-label="Decrease stock"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <b className="w-10 text-center tabular-nums text-[#13213c]">
                            {item.quantity}
                          </b>
                          <button
                            type="button"
                            onClick={() => updateInventoryStock(item.id, 1, 'delta')}
                            className="w-6 h-6 rounded-[6px] hover:bg-[#f5f7fb] grid place-items-center text-[#246bfd]"
                            aria-label="Increase stock"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[#5d6880]">{item.unit}</td>
                      <td className="px-4 py-3.5">
                        <StockStatusBadge status={st} />
                      </td>
                      <td className="px-4 py-3.5 text-[#6e7891] tabular-nums whitespace-nowrap">
                        {formatDateTime(item.lastUpdated)}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          title="Edit Item"
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-[7px] text-[#6e7891] hover:text-[#246bfd] hover:bg-[#eaf2ff]"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Archive Item"
                          onClick={() => setArchiving(item)}
                          className="p-1.5 rounded-[7px] text-[#6e7891] hover:text-[#dc2626] hover:bg-[#fff1f2] ml-1"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit Item · ${editing.name}` : 'Add Inventory Item'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="rounded-[10px] bg-[#fff1f2] border border-[#fecdd3] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#dc2626]">
              {error}
            </div>
          )}
          <div>
            <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
              Item Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-[42px] px-3 rounded-[10px] border border-[#e5eaf2] text-[13px] bg-white"
              >
                <option value="Detergents">Detergents</option>
                <option value="Fabric Care">Fabric Care</option>
                <option value="Stain Removal">Stain Removal</option>
                <option value="Packaging">Packaging</option>
                <option value="Supplies">Supplies</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Liters, Kg, Boxes, Pieces..."
                className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                Current Quantity
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                min="1"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] tabular-nums"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2.5 rounded-[10px] border border-[#e5eaf2] text-[13px] font-semibold text-[#5d6880]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-[10px] bg-[#246bfd] text-white text-[13px] font-bold disabled:opacity-60"
            >
              {saving ? 'Saving...' : editing ? 'Update Item' : 'Save Item'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog
        open={Boolean(archiving)}
        onClose={() => setArchiving(null)}
        onConfirm={async () => {
          if (archiving) await archiveInventoryItem(archiving.id);
        }}
        title={`Archive "${archiving?.name}"?`}
        message="Archived items are hidden from active stock monitoring."
        confirmLabel="Archive Item"
        danger
      />
    </div>
  );
};
