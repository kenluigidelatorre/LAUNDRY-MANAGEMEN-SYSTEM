import React, { useEffect, useState } from 'react';
import { Building2, Printer, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SettingsPage = () => {
  const { user, settings, updateSettings, updateCurrentUserProfile } = useApp();

  const [contactNumber, setContactNumber] = useState(settings.contactNumber || '');
  const [address, setAddress] = useState(settings.address || '');
  const [email, setEmail] = useState(settings.email || '');
  const [receiptHeader, setReceiptHeader] = useState(settings.receiptHeader || '');
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter || '');
  const [includeStaffOnReceipt, setIncludeStaffOnReceipt] = useState(
    Boolean(settings.includeStaffOnReceipt)
  );
  const [includePaymentBreakdown, setIncludePaymentBreakdown] = useState(
    Boolean(settings.includePaymentBreakdown)
  );
  const [autoLowStockAlerts, setAutoLowStockAlerts] = useState(
    Boolean(settings.autoLowStockAlerts)
  );

  const [adminName, setAdminName] = useState(user?.name || '');
  const [adminEmail, setAdminEmail] = useState(user?.email || '');
  const [adminPhone, setAdminPhone] = useState(user?.contactNumber || '');
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);

  useEffect(() => {
    setContactNumber(settings.contactNumber || '');
    setAddress(settings.address || '');
    setEmail(settings.email || '');
    setReceiptHeader(settings.receiptHeader || '');
    setReceiptFooter(settings.receiptFooter || '');
    setIncludeStaffOnReceipt(Boolean(settings.includeStaffOnReceipt));
    setIncludePaymentBreakdown(Boolean(settings.includePaymentBreakdown));
    setAutoLowStockAlerts(Boolean(settings.autoLowStockAlerts));
  }, [settings]);

  useEffect(() => {
    if (user) {
      setAdminName(user.name || '');
      setAdminEmail(user.email || '');
      setAdminPhone(user.contactNumber || '');
    }
  }, [user]);

  const handleSaveBusiness = async (e) => {
    e.preventDefault();
    setSavingBusiness(true);
    try {
      await updateSettings({
        businessName: "Wash n' Dash",
        contactNumber: contactNumber.trim(),
        address: address.trim(),
        email: email.trim(),
        currency: 'PHP',
        receiptHeader: receiptHeader.trim(),
        receiptFooter: receiptFooter.trim(),
        includeStaffOnReceipt,
        includePaymentBreakdown,
        autoLowStockAlerts,
      });
    } finally {
      setSavingBusiness(false);
    }
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setSavingAccount(true);
    try {
      await updateCurrentUserProfile({
        fullName: adminName.trim(),
        email: adminEmail.trim(),
        contactNumber: adminPhone.trim(),
      });
    } finally {
      setSavingAccount(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <form
        onSubmit={handleSaveBusiness}
        className="lg:col-span-2 border border-[#e5eaf2] bg-white rounded-[14px] overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-[#e5eaf2] flex items-center gap-2.5">
          <Building2 className="w-4 h-4 text-[#246bfd]" />
          <h2 className="font-display text-[15px] font-bold text-[#13213c]">
            Business Information &amp; Receipt Configuration
          </h2>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11.5px] font-bold text-[#17223b] mb-1.5">
              Official Business Name
            </label>
            <input
              type="text"
              value="Wash n' Dash"
              readOnly
              className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] bg-[#f5f7fb] text-[13px] font-bold text-[#13213c]"
            />
          </div>

          <div>
            <label className="block text-[11.5px] font-bold text-[#17223b] mb-1.5">
              Official Currency
            </label>
            <input
              type="text"
              value="Philippine Peso (PHP · ₱)"
              readOnly
              className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] bg-[#f5f7fb] text-[13px] font-bold text-[#14936c]"
            />
          </div>

          <div>
            <label className="block text-[11.5px] font-bold text-[#17223b] mb-1.5">
              Business Contact Number
            </label>
            <input
              type="text"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] tabular-nums focus:border-[#246bfd]"
            />
          </div>

          <div>
            <label className="block text-[11.5px] font-bold text-[#17223b] mb-1.5">
              Business Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] focus:border-[#246bfd]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11.5px] font-bold text-[#17223b] mb-1.5">
              Business Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] focus:border-[#246bfd]"
            />
          </div>

          <div className="sm:col-span-2 pt-2 border-t border-[#e5eaf2]">
            <div className="flex items-center gap-2 mb-3">
              <Printer className="w-4 h-4 text-[#246bfd]" />
              <h3 className="font-display text-[13.5px] font-bold text-[#13213c]">
                Receipt Configuration
              </h3>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11.5px] font-bold text-[#17223b] mb-1.5">
              Receipt Tagline / Header
            </label>
            <input
              type="text"
              value={receiptHeader}
              onChange={(e) => setReceiptHeader(e.target.value)}
              className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] focus:border-[#246bfd]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11.5px] font-bold text-[#17223b] mb-1.5">
              Receipt Footer Message
            </label>
            <textarea
              rows={2}
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#e5eaf2] text-[13px] resize-none focus:border-[#246bfd]"
            />
          </div>
        </div>

        <div className="border-t border-[#e5eaf2] divide-y divide-[#e5eaf2]">
          <label className="flex items-center justify-between px-6 py-4 cursor-pointer">
            <div>
              <b className="block text-[13px] text-[#13213c]">
                Show Assigned Staff on Printable Receipts
              </b>
              <small className="text-[11.5px] text-[#6e7891]">
                Include the assigned staff name and expected ready timestamp.
              </small>
            </div>
            <input
              type="checkbox"
              checked={includeStaffOnReceipt}
              onChange={(e) => setIncludeStaffOnReceipt(e.target.checked)}
              className="w-5 h-5 accent-[#246bfd]"
            />
          </label>
          <label className="flex items-center justify-between px-6 py-4 cursor-pointer">
            <div>
              <b className="block text-[13px] text-[#13213c]">
                Show Payment &amp; Balance Breakdown
              </b>
              <small className="text-[11.5px] text-[#6e7891]">
                Print amount paid and remaining PHP balance on receipts.
              </small>
            </div>
            <input
              type="checkbox"
              checked={includePaymentBreakdown}
              onChange={(e) => setIncludePaymentBreakdown(e.target.checked)}
              className="w-5 h-5 accent-[#246bfd]"
            />
          </label>
          <label className="flex items-center justify-between px-6 py-4 cursor-pointer">
            <div>
              <b className="block text-[13px] text-[#13213c]">
                Automatic Low-Stock Inventory Alerts
              </b>
              <small className="text-[11.5px] text-[#6e7891]">
                Highlight supplies that drop at or below threshold levels.
              </small>
            </div>
            <input
              type="checkbox"
              checked={autoLowStockAlerts}
              onChange={(e) => setAutoLowStockAlerts(e.target.checked)}
              className="w-5 h-5 accent-[#246bfd]"
            />
          </label>
        </div>

        <div className="px-6 py-4 border-t border-[#e5eaf2] bg-[#fafbfc] text-right">
          <button
            type="submit"
            disabled={savingBusiness}
            className="px-5 py-2.5 rounded-[10px] bg-[#246bfd] hover:bg-[#1557dc] text-white text-[13px] font-bold shadow-[0_8px_20px_rgba(36,107,253,0.2)] transition-all disabled:opacity-60"
          >
            {savingBusiness ? 'Saving Settings...' : 'Save System Settings'}
          </button>
        </div>
      </form>

      <form
        onSubmit={handleSaveAccount}
        className="border border-[#e5eaf2] bg-white rounded-[14px] overflow-hidden self-start"
      >
        <div className="px-6 py-4 border-b border-[#e5eaf2] flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#246bfd]" />
          <h2 className="font-display text-[15px] font-bold text-[#13213c]">
            Admin Account Settings
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11.5px] font-bold text-[#17223b] mb-1.5">
              Administrator Name
            </label>
            <input
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[11.5px] font-bold text-[#17223b] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[11.5px] font-bold text-[#17223b] mb-1.5">
              Contact Number
            </label>
            <input
              type="text"
              value={adminPhone}
              onChange={(e) => setAdminPhone(e.target.value)}
              className="w-full h-[42px] px-3.5 rounded-[10px] border border-[#e5eaf2] text-[13px] tabular-nums"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#e5eaf2] bg-[#fafbfc] text-right">
          <button
            type="submit"
            disabled={savingAccount}
            className="w-full py-2.5 rounded-[10px] bg-[#13213c] hover:bg-[#1e3259] text-white text-[13px] font-bold transition-colors disabled:opacity-60"
          >
            {savingAccount ? 'Updating Profile...' : 'Update Account Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};
