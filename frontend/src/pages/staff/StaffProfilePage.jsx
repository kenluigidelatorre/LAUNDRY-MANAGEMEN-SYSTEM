import React, { useEffect, useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateOnly, formatDateTime, getInitials } from '../../utils/formatters';

export const StaffProfilePage = () => {
  const { user, orders, staff, updateCurrentUserProfile } = useApp();

  const staffRecord = staff.find((s) => s.id === user?.id);

  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [contactNumber, setContactNumber] = useState(user?.contactNumber || '');
  const [shift, setShift] = useState(staffRecord?.shift || user?.shift || 'Morning Shift');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setEmail(user.email || '');
      setContactNumber(user.contactNumber || '');
    }
    if (staffRecord?.shift || user?.shift) {
      setShift(staffRecord?.shift || user?.shift || 'Morning Shift');
    }
  }, [user, staffRecord?.shift]);

  const assignedOrders = useMemo(
    () => orders.filter((o) => o.assignedStaffId === user?.id),
    [orders, user?.id]
  );
  const completedCount = assignedOrders.filter(
    (o) => o.laundryStatus === 'Completed'
  ).length;

  const personalActivity = useMemo(() => {
    const events = orders.flatMap((o) =>
      (o.trackingHistory || [])
        .filter((h) => h.staffId === user?.id || h.staffName === user?.name)
        .map((h) => ({ ...h, customerName: o.customerName }))
    );
    return events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);
  }, [orders, user?.id, user?.name]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;
    setSaving(true);
    try {
      await updateCurrentUserProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        contactNumber: contactNumber.trim(),
        shift: shift.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start">
      <section className="border border-[#e5eaf2] bg-white rounded-[14px] p-7 text-center">
        <span className="w-[74px] h-[74px] rounded-[22px] bg-[#dce9ff] text-[#246bfd] font-display text-[22px] font-extrabold grid place-items-center mx-auto">
          {user ? getInitials(user.name) : 'ST'}
        </span>
        <h2 className="font-display text-[17px] font-extrabold text-[#13213c] mt-3.5">
          {user?.name}
        </h2>
        <p className="text-[11.5px] text-[#6e7891] mt-0.5">
          Staff since {formatDateOnly(user?.dateRegistered || '2024-03-14')}
        </p>

        <div className="grid grid-cols-2 border-t border-b border-[#e5eaf2] my-5 py-3.5">
          <div className="border-r border-[#e5eaf2]">
            <b className="font-display text-[19px] font-extrabold text-[#13213c] block tabular-nums">
              {assignedOrders.length}
            </b>
            <small className="text-[11px] text-[#6e7891]">Assigned</small>
          </div>
          <div>
            <b className="font-display text-[19px] font-extrabold text-[#14936c] block tabular-nums">
              {completedCount}
            </b>
            <small className="text-[11px] text-[#6e7891]">Completed</small>
          </div>
        </div>

        <div className="text-left text-[12px] text-[#5d6880] bg-[#f5f7fb] rounded-[10px] p-3">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#246bfd]">
            Assigned Shift
          </span>
          <b className="block text-[#13213c] mt-0.5">{staffRecord?.shift || shift}</b>
        </div>
      </section>

      <div className="space-y-5">
        <form
          onSubmit={handleSave}
          className="border border-[#e5eaf2] bg-white rounded-[14px] overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-[#e5eaf2]">
            <h3 className="font-display text-[15px] font-bold text-[#13213c]">
              Personal Information
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11.5px] font-bold text-[#17223b] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-bold text-[#17223b] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-bold text-[#17223b] mb-1.5">
                Contact Number
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-bold text-[#17223b] mb-1.5">
                Role
              </label>
              <input
                type="text"
                value="Laundry Operations Staff"
                readOnly
                className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] bg-[#f5f7fb] text-[13px] text-[#6e7891]"
              />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-[#e5eaf2] bg-[#fafbfc] text-right">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-[10px] bg-[#246bfd] hover:bg-[#1557dc] text-white text-[13px] font-bold disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>

        <section className="border border-[#e5eaf2] bg-white rounded-[14px] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5eaf2]">
            <h3 className="font-display text-[15px] font-bold text-[#13213c]">
              My Recent Processing Activity
            </h3>
          </div>
          <div className="divide-y divide-[#e5eaf2]">
            {personalActivity.length === 0 ? (
              <p className="p-6 text-[12.5px] text-[#6e7891]">
                No processing updates recorded yet.
              </p>
            ) : (
              personalActivity.map((act) => (
                <div key={act.id} className="px-6 py-3.5 flex items-start gap-3">
                  <span className="w-8 h-8 rounded-[8px] bg-[#eaf2ff] text-[#246bfd] grid place-items-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
                      <b className="text-[#13213c]">
                        Order {act.orderId} ({act.customerName}) → {act.newStatus}
                      </b>
                      <span className="text-[11px] text-[#6e7891] tabular-nums">
                        {formatDateTime(act.timestamp)}
                      </span>
                    </div>
                    {act.remarks && (
                      <p className="text-[12px] text-[#6e7891] mt-0.5">{act.remarks}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
