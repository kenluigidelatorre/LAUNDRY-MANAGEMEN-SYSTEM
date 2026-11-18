import React, { useMemo, useState } from 'react';
import {
  Edit3,
  Eye,
  Plus,
  Power,
  ShieldCheck,
  UserCheck,
  UserCog,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateOnly, formatPHP, getInitials } from '../../utils/formatters';
import {
  Modal,
  OrderStatusBadge,
  SearchBar,
} from '../../components/common/UIPrimitives';

export const StaffManagementPage = () => {
  const {
    staff,
    orders,
    addStaff,
    updateStaff,
    toggleStaffStatus,
    assignStaffToOrder,
  } = useApp();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [assigningOrderId, setAssigningOrderId] = useState('');
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STAFF');
  const [shift, setShift] = useState('Morning Shift (7:00 AM – 3:00 PM)');
  const [status, setStatus] = useState('Active');
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff.filter((s) => {
      if (roleFilter !== 'ALL' && s.role !== roleFilter) return false;
      if (!q) return true;
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    });
  }, [staff, search, roleFilter]);

  const activeOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.laundryStatus !== 'Completed' && o.laundryStatus !== 'Cancelled'
      ),
    [orders]
  );

  const openAdd = () => {
    setEditing(null);
    setFullName('');
    setEmail('');
    setContactNumber('+63 917 ');
    setPassword('');
    setRole('STAFF');
    setShift('Morning Shift (7:00 AM – 3:00 PM)');
    setStatus('Active');
    setError('');
    setFormOpen(true);
  };

  const openEdit = (member) => {
    setEditing(member);
    setFullName(member.fullName);
    setEmail(member.email);
    setContactNumber(member.contactNumber);
    setPassword('');
    setRole(member.role);
    setShift(member.shift);
    setStatus(member.status);
    setError('');
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !contactNumber.trim()) {
      setError('Full Name, Email Address, and Contact Number are required.');
      return;
    }

    setSaving(true);
    try {
      let saved;
      if (editing) {
        saved = await updateStaff({
          ...editing,
          fullName: fullName.trim(),
          email: email.trim(),
          contactNumber: contactNumber.trim(),
          role,
          shift: shift.trim(),
          status,
        });
      } else {
        saved = await addStaff({
          fullName: fullName.trim(),
          email: email.trim(),
          contactNumber: contactNumber.trim(),
          ...(password.trim() ? { password: password.trim() } : {}),
          role,
          shift: shift.trim(),
          status,
        });
      }
      if (saved) {
        setFormOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const viewingOrders = viewing
    ? orders.filter((o) => o.assignedStaffId === viewing.id)
    : [];

  return (
    <div className="space-y-5">
      <section className="border border-[#e5eaf2] bg-white rounded-[14px]">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-b border-[#e5eaf2]">
          <div>
            <h2 className="font-display text-[16px] font-bold text-[#13213c]">
              Staff Accounts &amp; Workload
            </h2>
            <p className="text-[12px] text-[#6e7891] mt-0.5 tabular-nums">
              {staff.filter((s) => s.status === 'Active').length} active team members at Wash n&apos; Dash
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#246bfd] hover:bg-[#1557dc] text-white text-[13px] font-bold shadow-[0_8px_20px_rgba(36,107,253,0.2)] transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Staff
          </button>
        </div>

        <div className="p-4 border-b border-[#e5eaf2] flex flex-wrap items-center justify-between gap-3 bg-[#fcfdff]">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search staff by ID, name, or email..."
            className="flex-1 min-w-[230px]"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-[40px] px-3 rounded-[10px] border border-[#e5eaf2] bg-white text-[12.5px]"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="STAFF">Staff</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse">
            <thead>
              <tr className="bg-[#fafbfc] text-[10.5px] font-bold uppercase tracking-[0.5px] text-[#8b96aa]">
                <th className="text-left px-5 py-3">Staff Member</th>
                <th className="text-left px-4 py-3">Contact &amp; Email</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Assigned Orders</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date Registered</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5eaf2] text-[12.5px]">
              {filtered.map((member) => {
                const assigned = orders.filter((o) => o.assignedStaffId === member.id);
                const activeCount = assigned.filter(
                  (o) => o.laundryStatus !== 'Completed' && o.laundryStatus !== 'Cancelled'
                ).length;

                return (
                  <tr key={member.id} className="hover:bg-[#f9fbff] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-[9px] bg-[#eaf2ff] text-[#246bfd] font-display text-[11px] font-extrabold grid place-items-center shrink-0">
                          {getInitials(member.fullName)}
                        </span>
                        <div>
                          <button
                            type="button"
                            onClick={() => setViewing(member)}
                            className="font-bold text-[#13213c] hover:text-[#246bfd] block text-left"
                          >
                            {member.fullName}
                          </button>
                          <small className="text-[10.5px] text-[#929bad] tabular-nums">
                            {member.id} · {member.shift}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="block font-medium text-[#17223b]">{member.email}</span>
                      <small className="text-[11px] text-[#6e7891] tabular-nums">
                        {member.contactNumber}
                      </small>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-[6px] px-2.5 py-1 text-[11px] font-bold ${
                          member.role === 'ADMIN'
                            ? 'bg-[#f1edff] text-[#7d5cde]'
                            : 'bg-[#eaf2ff] text-[#246bfd]'
                        }`}
                      >
                        {member.role === 'ADMIN' ? (
                          <ShieldCheck className="w-3 h-3" />
                        ) : (
                          <UserCheck className="w-3 h-3" />
                        )}
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 tabular-nums">
                      <b className="text-[#13213c]">{assigned.length} total</b>
                      <small className="block text-[10.5px] text-[#246bfd]">
                        {activeCount} currently active
                      </small>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-[6px] px-2.5 py-1 text-[11px] font-bold ${
                          member.status === 'Active'
                            ? 'bg-[#e3f8f1] text-[#14936c]'
                            : 'bg-[#edf0f4] text-[#778195]'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[#5d6880] tabular-nums">
                      {formatDateOnly(member.dateRegistered)}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        title="View Staff Details & Activity"
                        onClick={() => setViewing(member)}
                        className="p-1.5 rounded-[7px] text-[#6e7891] hover:text-[#246bfd] hover:bg-[#eaf2ff]"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Edit Staff"
                        onClick={() => openEdit(member)}
                        className="p-1.5 rounded-[7px] text-[#6e7891] hover:text-[#13213c] hover:bg-[#f1f3f7] ml-1"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title={member.status === 'Active' ? 'Deactivate' : 'Activate'}
                        onClick={() => toggleStaffStatus(member.id)}
                        className="p-1.5 rounded-[7px] text-[#6e7891] hover:text-[#dc2626] hover:bg-[#fff1f2] ml-1"
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit Staff · ${editing.fullName}` : 'Add Staff Account'}
        subtitle="Manage Wash n' Dash staff credentials and permissions."
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
              className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] focus:border-[#246bfd]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] focus:border-[#246bfd]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                Contact Number
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] tabular-nums focus:border-[#246bfd]"
              />
            </div>
          </div>
          {!editing && (
            <div>
              <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                Initial Password (optional — defaults to staff123)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank for default password (staff123)"
                className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] focus:border-[#246bfd]"
              />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-[42px] px-3 rounded-[10px] border border-[#e5eaf2] text-[13px] bg-white"
              >
                <option value="STAFF">STAFF</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
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
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[#17223b] mb-1.5">
              Shift Schedule
            </label>
            <input
              type="text"
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] focus:border-[#246bfd]"
            />
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
              className="px-5 py-2.5 rounded-[10px] bg-[#246bfd] hover:bg-[#1557dc] text-white text-[13px] font-bold disabled:opacity-60"
            >
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Staff Account'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing ? `Staff Details · ${viewing.fullName}` : ''}
        subtitle={viewing ? `${viewing.id} · ${viewing.role} · ${viewing.shift}` : ''}
        maxWidth="max-w-3xl"
      >
        {viewing && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#f5f7fb] border border-[#e5eaf2] rounded-[12px] p-4 text-[12.5px]">
              <div>
                <span className="text-[#6e7891] block text-[11px]">Email</span>
                <b>{viewing.email}</b>
              </div>
              <div>
                <span className="text-[#6e7891] block text-[11px]">Contact Number</span>
                <b className="tabular-nums">{viewing.contactNumber}</b>
              </div>
              <div>
                <span className="text-[#6e7891] block text-[11px]">Account Status</span>
                <b className={viewing.status === 'Active' ? 'text-[#14936c]' : 'text-[#6e7891]'}>
                  {viewing.status}
                </b>
              </div>
            </div>

            {viewing.status === 'Active' && activeOrders.length > 0 && (
              <div className="flex flex-wrap items-center gap-2.5 border border-[#e5eaf2] rounded-[12px] p-4">
                <UserCog className="w-4 h-4 text-[#246bfd]" />
                <span className="text-[12.5px] font-bold text-[#13213c]">
                  Assign Active Order:
                </span>
                <select
                  value={assigningOrderId}
                  onChange={(e) => setAssigningOrderId(e.target.value)}
                  className="flex-1 min-w-[200px] h-[38px] px-3 rounded-[9px] border border-[#e5eaf2] text-[12.5px] bg-white"
                >
                  <option value="">Select an order...</option>
                  {activeOrders
                    .filter((o) => o.assignedStaffId !== viewing.id)
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.id} — {o.customerName} ({o.laundryStatus})
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  disabled={!assigningOrderId}
                  onClick={async () => {
                    if (assigningOrderId) {
                      await assignStaffToOrder(assigningOrderId, viewing.id);
                      setAssigningOrderId('');
                    }
                  }}
                  className="px-4 h-[38px] rounded-[9px] bg-[#246bfd] text-white text-[12.5px] font-bold disabled:opacity-40"
                >
                  Assign
                </button>
              </div>
            )}

            <div className="border border-[#e5eaf2] rounded-[12px] overflow-hidden">
              <div className="px-4 py-3 bg-[#fafbfc] border-b border-[#e5eaf2]">
                <h4 className="font-display text-[13.5px] font-bold text-[#13213c]">
                  Assigned Orders &amp; Activity ({viewingOrders.length})
                </h4>
              </div>
              {viewingOrders.length === 0 ? (
                <p className="p-4 text-[12.5px] text-[#6e7891]">
                  No orders currently assigned to {viewing.fullName}.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-[#fafbfc] text-[#8b96aa] text-[10px] uppercase">
                        <th className="text-left px-4 py-2.5">Order ID</th>
                        <th className="text-left px-4 py-2.5">Customer</th>
                        <th className="text-left px-4 py-2.5">Service</th>
                        <th className="text-left px-4 py-2.5">Status</th>
                        <th className="text-right px-4 py-2.5">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5eaf2]">
                      {viewingOrders.map((o) => (
                        <tr key={o.id}>
                          <td className="px-4 py-2.5 font-bold text-[#246bfd] tabular-nums">
                            {o.id}
                          </td>
                          <td className="px-4 py-2.5 font-medium">{o.customerName}</td>
                          <td className="px-4 py-2.5 text-[#5d6880]">{o.serviceName}</td>
                          <td className="px-4 py-2.5">
                            <OrderStatusBadge status={o.laundryStatus} />
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
