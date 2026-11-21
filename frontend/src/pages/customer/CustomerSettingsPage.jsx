import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  KeyRound,
  LogOut,
  RefreshCw,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CustomerSettingsPage = () => {
  const { user, logout, updateNotificationPreferences, refreshPortalData, notify } = useApp();
  const navigate = useNavigate();

  const [prefs, setPrefs] = useState({
    orderUpdates: true,
    readyForPickup: true,
    paymentUpdates: true,
    promotions: false,
    autoRefreshSeconds: 15,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.notificationPreferences) {
      setPrefs({
        orderUpdates: user.notificationPreferences.orderUpdates !== false,
        readyForPickup: user.notificationPreferences.readyForPickup !== false,
        paymentUpdates: user.notificationPreferences.paymentUpdates !== false,
        promotions: Boolean(user.notificationPreferences.promotions),
        autoRefreshSeconds: Number(
          user.notificationPreferences.autoRefreshSeconds ?? 15
        ),
      });
    }
  }, [user]);

  const togglePref = (key) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateNotificationPreferences(prefs);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <section className="lg:col-span-7 border border-[#e5eaf2] bg-white rounded-[14px] p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#e5eaf2]">
          <div className="w-9 h-9 rounded-[9px] bg-[#eaf1ff] text-[#1d5ef3] grid place-items-center">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-[16px] font-extrabold text-[#13213c]">
              Notification Preferences
            </h2>
            <p className="text-[12.5px] text-[#6e7891]">
              Choose which real-time updates appear in your Customer Portal.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          {[
            {
              key: 'orderUpdates',
              title: 'Order Placed & Stage Updates',
              desc: 'Receive notifications when your order is received, updated, washed, dried, or completed.',
            },
            {
              key: 'readyForPickup',
              title: 'Ready for Pickup Alerts',
              desc: 'Get an immediate alert as soon as your freshly folded laundry is ready at the counter.',
            },
            {
              key: 'paymentUpdates',
              title: 'Payment Confirmations',
              desc: 'Notify whenever Cash, GCash, or Maya payments and receipts are recorded.',
            },
            {
              key: 'promotions',
              title: 'Shop Announcements',
              desc: 'Receive occasional Wash n\' Dash holiday hours and service announcements.',
            },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-start justify-between gap-4 p-3.5 rounded-[12px] border border-[#e5eaf2] hover:bg-[#f9fbff] cursor-pointer transition-colors"
            >
              <div>
                <b className="text-[13.5px] text-[#13213c] block">{item.title}</b>
                <span className="text-[12px] text-[#6e7891]">{item.desc}</span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(prefs[item.key])}
                onChange={() => togglePref(item.key)}
                className="w-4 h-4 mt-1 accent-[#1d5ef3] rounded shrink-0"
              />
            </label>
          ))}

          <div className="pt-2">
            <label
              htmlFor="cs-refresh"
              className="block text-[12px] font-bold text-[#13213c] mb-1.5"
            >
              Automatic Notification &amp; Order Refresh
            </label>
            <select
              id="cs-refresh"
              value={prefs.autoRefreshSeconds}
              onChange={(e) =>
                setPrefs((prev) => ({
                  ...prev,
                  autoRefreshSeconds: Number(e.target.value),
                }))
              }
              className="w-full sm:w-[260px] h-[42px] px-3 rounded-[10px] border border-[#dce6fa] bg-white text-[13px] font-semibold text-[#13213c]"
            >
              <option value={15}>Every 15 seconds (Recommended)</option>
              <option value={30}>Every 30 seconds</option>
              <option value={60}>Every 60 seconds</option>
              <option value={0}>Manual refresh only</option>
            </select>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#e5eaf2]">
            <button
              type="button"
              onClick={async () => {
                await refreshPortalData();
                notify('Latest orders and notifications synced.');
              }}
              className="h-[40px] px-4 rounded-[10px] border border-[#dce6fa] bg-[#f8fbff] hover:bg-[#eef4ff] text-[#13213c] text-[12.5px] font-bold inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#1d5ef3]" />
              Sync Now
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-[42px] px-5 rounded-[10px] bg-[#1d5ef3] hover:bg-[#154fd6] text-white text-[13px] font-bold inline-flex items-center gap-2 shadow-[0_8px_20px_rgba(29,94,243,0.2)] disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </section>

      <section className="lg:col-span-5 border border-[#e5eaf2] bg-white rounded-[14px] p-6 space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#e5eaf2]">
          <div className="w-9 h-9 rounded-[9px] bg-[#e3f8f1] text-[#14936c] grid place-items-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-[16px] font-extrabold text-[#13213c]">
              Account &amp; Security
            </h2>
            <p className="text-[12.5px] text-[#6e7891]">
              Manage credentials and active session access.
            </p>
          </div>
        </div>

        <div className="space-y-2.5 text-[12.5px]">
          <div className="flex justify-between py-1.5 border-b border-[#f0f3f8]">
            <span className="text-[#6e7891]">Signed-in Email</span>
            <b className="text-[#13213c]">{user?.email}</b>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#f0f3f8]">
            <span className="text-[#6e7891]">Role Scope</span>
            <b className="text-[#1d5ef3]">Customer Portal Only</b>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[#6e7891]">Customer Record ID</span>
            <b className="text-[#13213c] tabular-nums">
              {user?.customerId || user?.id}
            </b>
          </div>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={() => navigate('/customer/profile')}
            className="w-full h-[42px] px-4 rounded-[10px] border border-[#dce6fa] bg-[#f8fbff] hover:bg-[#eaf2ff] text-[#1d5ef3] text-[13px] font-bold inline-flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            Change Account Password
          </button>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full h-[42px] px-4 rounded-[10px] border border-[#fecdd3] bg-[#fff1f2] hover:bg-[#ffe4e6] text-[#dc2626] text-[13px] font-bold inline-flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out of Customer Portal
          </button>
        </div>
      </section>
    </div>
  );
};
