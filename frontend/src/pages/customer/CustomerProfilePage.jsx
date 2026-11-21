import React, { useEffect, useState } from 'react';
import {
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateOnly, getInitials } from '../../utils/formatters';

export const CustomerProfilePage = () => {
  const {
    user,
    customerProfile,
    orders,
    updateCurrentUserProfile,
    changeCurrentUserPassword,
    notify,
  } = useApp();

  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [contactNumber, setContactNumber] = useState(
    customerProfile?.contactNumber || user?.contactNumber || ''
  );
  const [address, setAddress] = useState(
    customerProfile?.address || user?.address || ''
  );
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    setFullName(user?.name || '');
    setEmail(user?.email || '');
    setContactNumber(customerProfile?.contactNumber || user?.contactNumber || '');
    setAddress(customerProfile?.address || user?.address || '');
  }, [user, customerProfile]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      notify('Full name is required.', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      notify('Please enter a valid email address.', 'error');
      return;
    }
    setSaving(true);
    try {
      await updateCurrentUserProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        contactNumber: contactNumber.trim(),
        address: address.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      notify('Please enter your current password.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      notify('New password must be at least 6 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      notify('New password and confirmation do not match.', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await changeCurrentUserPassword({
        currentPassword,
        newPassword,
      });
      if (res.ok) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <section className="lg:col-span-4 border border-[#e5eaf2] bg-white rounded-[14px] p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#eaf1ff] text-[#1d5ef3] font-display text-[26px] font-extrabold grid place-items-center mx-auto">
          {getInitials(user?.name)}
        </div>
        <h2 className="font-display text-[19px] font-extrabold text-[#13213c] mt-4">
          {user?.name}
        </h2>
        <p className="text-[13px] text-[#6e7891] mt-0.5">{user?.email}</p>
        <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-[7px] bg-[#eaf1ff] text-[#1d5ef3] text-[11.5px] font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Customer Account
        </div>

        <div className="mt-6 pt-5 border-t border-[#e5eaf2] space-y-2.5 text-left text-[12.5px]">
          <div className="flex justify-between">
            <span className="text-[#6e7891]">Customer ID</span>
            <b className="text-[#13213c] tabular-nums">
              {user?.customerId || customerProfile?.id || user?.id}
            </b>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6e7891]">Account Status</span>
            <b className="text-[#14936c]">{user?.status || 'Active'}</b>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6e7891]">Registered</span>
            <b className="text-[#13213c] tabular-nums">
              {formatDateOnly(user?.dateRegistered)}
            </b>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6e7891]">Total Orders Placed</span>
            <b className="text-[#13213c] tabular-nums">{orders.length}</b>
          </div>
        </div>
      </section>

      <div className="lg:col-span-8 space-y-5">
        <section className="border border-[#e5eaf2] bg-white rounded-[14px] p-6">
          <h3 className="font-display text-[16px] font-extrabold text-[#13213c]">
            Personal &amp; Pickup Details
          </h3>
          <p className="text-[12.5px] text-[#6e7891] mt-0.5 mb-5">
            Keep your contact number and address updated for smooth order notifications and pickups.
          </p>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="cp-name"
                  className="block text-[12px] font-bold text-[#13213c] mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="cp-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-[42px] pl-10 pr-3 rounded-[10px] border border-[#dce6fa] text-[13px] text-[#13213c] focus:border-[#1d5ef3]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="cp-email"
                  className="block text-[12px] font-bold text-[#13213c] mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="cp-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-[42px] pl-10 pr-3 rounded-[10px] border border-[#dce6fa] text-[13px] text-[#13213c] focus:border-[#1d5ef3]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="cp-phone"
                className="block text-[12px] font-bold text-[#13213c] mb-1.5"
              >
                Contact Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="cp-phone"
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+63 917 000 0000"
                  className="w-full h-[42px] pl-10 pr-3 rounded-[10px] border border-[#dce6fa] text-[13px] text-[#13213c] focus:border-[#1d5ef3]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="cp-address"
                className="block text-[12px] font-bold text-[#13213c] mb-1.5"
              >
                Pickup / Delivery Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-3.5" />
                <textarea
                  id="cp-address"
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, Barangay, City"
                  className="w-full pl-10 pr-3 py-2.5 rounded-[10px] border border-[#dce6fa] text-[13px] text-[#13213c] focus:border-[#1d5ef3]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="h-[42px] px-5 rounded-[10px] bg-[#1d5ef3] hover:bg-[#154fd6] text-white text-[13px] font-bold inline-flex items-center gap-2 shadow-[0_8px_20px_rgba(29,94,243,0.2)] disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </section>

        {/* Secure Password Update Card */}
        <section className="border border-[#e5eaf2] bg-white rounded-[14px] p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="font-display text-[16px] font-extrabold text-[#13213c]">
                Change Password
              </h3>
              <p className="text-[12.5px] text-[#6e7891] mt-0.5">
                Verify your current password before setting a new account password.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswords((p) => !p)}
              className="text-[12px] font-bold text-[#1d5ef3] hover:underline inline-flex items-center gap-1"
            >
              {showPasswords ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" /> Hide
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" /> Show
                </>
              )}
            </button>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label
                htmlFor="cp-current-pass"
                className="block text-[12px] font-bold text-[#13213c] mb-1.5"
              >
                Current Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="cp-current-pass"
                  type={showPasswords ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full h-[42px] pl-10 pr-3 rounded-[10px] border border-[#dce6fa] text-[13px] text-[#13213c] focus:border-[#1d5ef3]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="cp-new-pass"
                  className="block text-[12px] font-bold text-[#13213c] mb-1.5"
                >
                  New Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="cp-new-pass"
                    type={showPasswords ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full h-[42px] pl-10 pr-3 rounded-[10px] border border-[#dce6fa] text-[13px] text-[#13213c] focus:border-[#1d5ef3]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="cp-confirm-pass"
                  className="block text-[12px] font-bold text-[#13213c] mb-1.5"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="cp-confirm-pass"
                    type={showPasswords ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full h-[42px] pl-10 pr-3 rounded-[10px] border border-[#dce6fa] text-[13px] text-[#13213c] focus:border-[#1d5ef3]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="submit"
                disabled={changingPassword}
                className="h-[42px] px-5 rounded-[10px] border border-[#dce6fa] bg-[#f8fbff] hover:bg-[#eaf2ff] text-[#1d5ef3] text-[13px] font-bold inline-flex items-center gap-2 disabled:opacity-60"
              >
                <KeyRound className="w-4 h-4" />
                {changingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};
