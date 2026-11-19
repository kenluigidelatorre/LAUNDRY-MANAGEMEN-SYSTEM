import React, { useMemo, useState } from 'react';
import { Edit3, Eye, Mail, MapPin, Phone, Plus, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateOnly, formatPHP, getInitials } from '../../utils/formatters';
import {
  EmptyState,
  Modal,
  OrderStatusBadge,
  Pagination,
  PaymentStatusBadge,
  SearchBar,
} from '../../components/common/UIPrimitives';

export const CustomersPage = () => {
  const { customers, orders, addCustomer, updateCustomer } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('Active');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const customerStats = useMemo(() => {
    const map = new Map();
    for (const o of orders) {
      if (o.laundryStatus === 'Cancelled') continue;
      const cur = map.get(o.customerId) || { totalOrders: 0, totalSpent: 0 };
      cur.totalOrders += 1;
      cur.totalSpent += o.totalAmount;
      map.set(o.customerId, cur);
    }
    return map;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.id.toLowerCase().includes(q) ||
        c.fullName.toLowerCase().includes(q) ||
        c.contactNumber.toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      );
    });
  }, [customers, search, statusFilter]);

  const pageSize = 8;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openAdd = () => {
    setEditing(null);
    setFullName('');
    setContactNumber('+63 9');
    setAddress('');
    setEmail('');
    setStatus('Active');
    setError('');
    setFormOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setFullName(c.fullName);
    setContactNumber(c.contactNumber);
    setAddress(c.address);
    setEmail(c.email || '');
    setStatus(c.status);
    setError('');
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !contactNumber.trim() || !address.trim()) {
      setError('Full Name, Contact Number, and Address are required.');
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        const updated = await updateCustomer({
          ...editing,
          fullName: fullName.trim(),
          contactNumber: contactNumber.trim(),
          address: address.trim(),
          email: email.trim() || undefined,
          status,
        });
        if (updated) setFormOpen(false);
      } else {
        const created = await addCustomer({
          fullName: fullName.trim(),
          contactNumber: contactNumber.trim(),
          address: address.trim(),
          email: email.trim() || undefined,
        });
        if (created) setFormOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const viewingOrders = viewing
    ? orders.filter((o) => o.customerId === viewing.id)
    : [];
  const viewingSummary = viewing
    ? customerStats.get(viewing.id) || { totalOrders: 0, totalSpent: 0 }
    : { totalOrders: 0, totalSpent: 0 };

  return (
    <div className="space-y-5">
      <section className="border border-[#e5eaf2] bg-white rounded-[14px]">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-b border-[#e5eaf2]">
          <div>
            <h2 className="font-display text-[16px] font-bold text-[#13213c]">
              Customer Directory
            </h2>
            <p className="text-[12px] text-[#6e7891] mt-0.5 tabular-nums">
              {filtered.length} registered Wash n&apos; Dash customers
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#246bfd] hover:bg-[#1557dc] text-white text-[13px] font-bold shadow-[0_8px_20px_rgba(36,107,253,0.2)] transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>

        <div className="p-4 border-b border-[#e5eaf2] flex flex-wrap items-center justify-between gap-3 bg-[#fcfdff]">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by customer ID, name, phone, or email..."
            className="flex-1 min-w-[240px]"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-[40px] px-3 rounded-[10px] border border-[#e5eaf2] bg-white text-[12.5px]"
          >
            <option value="ALL">All Customers</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {paged.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title="No customers found"
            description="Add a walk-in or regular customer to start creating Wash n' Dash orders."
            action={
              <button
                type="button"
                onClick={openAdd}
                className="px-4 py-2 rounded-[10px] bg-[#246bfd] text-white text-[13px] font-bold"
              >
                Register Customer
              </button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse">
                <thead>
                  <tr className="bg-[#fafbfc] text-[10.5px] font-bold uppercase tracking-[0.5px] text-[#8b96aa]">
                    <th className="text-left px-5 py-3">Customer</th>
                    <th className="text-left px-4 py-3">Contact &amp; Email</th>
                    <th className="text-left px-4 py-3">Address</th>
                    <th className="text-right px-4 py-3">Orders</th>
                    <th className="text-right px-4 py-3">Total Spending</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-right px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5eaf2] text-[12.5px]">
                  {paged.map((c) => {
                    const stats = customerStats.get(c.id) || { totalOrders: 0, totalSpent: 0 };
                    return (
                      <tr key={c.id} className="hover:bg-[#f9fbff] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-[9px] bg-[#e5efff] text-[#246bfd] font-display text-[11px] font-extrabold grid place-items-center shrink-0">
                              {getInitials(c.fullName)}
                            </span>
                            <div>
                              <button
                                type="button"
                                onClick={() => setViewing(c)}
                                className="font-bold text-[#13213c] hover:text-[#246bfd] text-left block"
                              >
                                {c.fullName}
                              </button>
                              <small className="text-[10.5px] text-[#929bad] tabular-nums">
                                {c.id} · Joined {formatDateOnly(c.registrationDate)}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 tabular-nums">
                          <span className="block text-[#17223b] font-medium">
                            {c.contactNumber}
                          </span>
                          <small className="text-[11px] text-[#6e7891]">
                            {c.email || 'No email'}
                          </small>
                        </td>
                        <td className="px-4 py-3.5 text-[#5d6880] max-w-[230px] truncate">
                          {c.address}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold tabular-nums text-[#17223b]">
                          {stats.totalOrders}
                        </td>
                        <td className="px-4 py-3.5 text-right font-extrabold tabular-nums text-[#13213c]">
                          {formatPHP(stats.totalSpent)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex rounded-[6px] px-2.5 py-1 text-[11px] font-bold ${
                              c.status === 'Active'
                                ? 'bg-[#e3f8f1] text-[#14936c]'
                                : 'bg-[#edf0f4] text-[#778195]'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setViewing(c)}
                            title="View Profile & Orders"
                            className="p-1.5 rounded-[7px] text-[#6e7891] hover:text-[#246bfd] hover:bg-[#eaf2ff]"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            title="Edit Customer"
                            className="p-1.5 rounded-[7px] text-[#6e7891] hover:text-[#13213c] hover:bg-[#f1f3f7] ml-1"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
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

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit Customer · ${editing.id}` : 'Register New Customer'}
        subtitle="Wash n' Dash Customer Profile"
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
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g., Camille Navarro"
              className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] focus:border-[#246bfd]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                Contact Number
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+63 917 000 0000"
                className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] tabular-nums focus:border-[#246bfd]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@email.ph"
                className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] focus:border-[#246bfd]"
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
              Address
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House/Unit No., Street, Barangay, City"
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#e5eaf2] text-[13px] resize-none focus:border-[#246bfd]"
            />
          </div>
          {editing && (
            <div>
              <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                Account Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-[42px] px-3 rounded-[10px] border border-[#e5eaf2] text-[13px] bg-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          )}
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
              disabled={submitting}
              className="px-5 py-2.5 rounded-[10px] bg-[#246bfd] hover:bg-[#1557dc] text-white text-[13px] font-bold disabled:opacity-60"
            >
              {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Register Customer'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing ? `Customer Profile · ${viewing.fullName}` : ''}
        subtitle={viewing ? `${viewing.id} · Registered ${formatDateOnly(viewing.registrationDate)}` : ''}
        maxWidth="max-w-3xl"
      >
        {viewing && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-[#e5eaf2] rounded-[14px] p-5 text-center">
                <span className="w-[64px] h-[64px] rounded-[18px] bg-[#dce9ff] text-[#246bfd] font-display text-[20px] font-extrabold grid place-items-center mx-auto">
                  {getInitials(viewing.fullName)}
                </span>
                <h3 className="font-display text-[16px] font-bold text-[#13213c] mt-3">
                  {viewing.fullName}
                </h3>
                <p className="text-[11.5px] text-[#6e7891]">{viewing.status} Customer</p>
                <div className="grid grid-cols-2 border-t border-[#e5eaf2] mt-4 pt-3">
                  <div className="border-r border-[#e5eaf2]">
                    <b className="font-display text-[17px] text-[#13213c] block tabular-nums">
                      {viewingSummary.totalOrders}
                    </b>
                    <small className="text-[10.5px] text-[#6e7891]">Total Orders</small>
                  </div>
                  <div>
                    <b className="font-display text-[17px] text-[#246bfd] block tabular-nums">
                      {formatPHP(viewingSummary.totalSpent)}
                    </b>
                    <small className="text-[10.5px] text-[#6e7891]">Total Spent</small>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 border border-[#e5eaf2] rounded-[14px] p-5 space-y-3 text-[13px]">
                <h4 className="font-display text-[14px] font-bold text-[#13213c]">
                  Contact Information
                </h4>
                <div className="flex items-center gap-2.5 text-[#5d6880]">
                  <Phone className="w-4 h-4 text-[#246bfd]" />
                  <span className="tabular-nums">{viewing.contactNumber}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[#5d6880]">
                  <Mail className="w-4 h-4 text-[#246bfd]" />
                  <span>{viewing.email || 'No email address on file'}</span>
                </div>
                <div className="flex items-start gap-2.5 text-[#5d6880]">
                  <MapPin className="w-4 h-4 text-[#246bfd] mt-0.5 shrink-0" />
                  <span>{viewing.address}</span>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const target = viewing;
                      setViewing(null);
                      openEdit(target);
                    }}
                    className="px-3.5 py-2 rounded-[9px] border border-[#e5eaf2] hover:bg-[#f5f7fb] text-[12px] font-bold text-[#13213c]"
                  >
                    Edit Customer Details
                  </button>
                </div>
              </div>
            </div>

            <div className="border border-[#e5eaf2] rounded-[14px] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#e5eaf2] bg-[#fafbfc]">
                <h4 className="font-display text-[13.5px] font-bold text-[#13213c]">
                  Order History ({viewingOrders.length})
                </h4>
              </div>
              {viewingOrders.length === 0 ? (
                <p className="p-5 text-[12.5px] text-[#6e7891]">
                  No orders recorded for this customer yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-[#fafbfc] text-[#8b96aa] text-[10px] uppercase">
                        <th className="text-left px-4 py-2.5">Order ID</th>
                        <th className="text-left px-4 py-2.5">Service</th>
                        <th className="text-left px-4 py-2.5">Date</th>
                        <th className="text-left px-4 py-2.5">Status</th>
                        <th className="text-left px-4 py-2.5">Payment</th>
                        <th className="text-right px-4 py-2.5">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5eaf2]">
                      {viewingOrders.map((o) => (
                        <tr key={o.id}>
                          <td className="px-4 py-2.5 font-bold text-[#246bfd] tabular-nums">
                            {o.id}
                          </td>
                          <td className="px-4 py-2.5">
                            {o.serviceName} ({o.weightKg} kg)
                          </td>
                          <td className="px-4 py-2.5 tabular-nums text-[#6e7891]">
                            {formatDateOnly(o.dateReceived)}
                          </td>
                          <td className="px-4 py-2.5">
                            <OrderStatusBadge status={o.laundryStatus} />
                          </td>
                          <td className="px-4 py-2.5">
                            <PaymentStatusBadge status={o.paymentStatus} />
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold tabular-nums">
                            {formatPHP(o.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
