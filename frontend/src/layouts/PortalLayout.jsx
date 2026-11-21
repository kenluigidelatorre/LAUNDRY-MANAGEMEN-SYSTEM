import React, { useMemo, useRef, useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  Boxes,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Shirt,
  Truck,
  UserCheck,
  UserCog,
  PlusCircle,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Logo } from '../components/common/Logo';
import { getInitials } from '../utils/formatters';

const ROUTE_TITLES = {
  '/admin/dashboard': {
    title: 'Dashboard overview',
    subtitle: "Manage and monitor your Wash n' Dash laundry operations.",
  },
  '/admin/orders': {
    title: 'Orders management',
    subtitle: 'Create, assign, update, and track customer laundry orders.',
  },
  '/admin/orders/new': {
    title: 'Create new order',
    subtitle: 'Log a walk-in or pickup laundry order in three simple steps.',
  },
  '/admin/tracking': {
    title: 'Notification settings',
    subtitle: 'Monitor laundry progress from drop-off to pickup.',
  },
  '/admin/customers': {
    title: 'Customers',
    subtitle: 'Manage customer profiles, contacts, and order histories.',
  },
  '/admin/services': {
    title: 'Services & pricing',
    subtitle: "Manage Wash n' Dash services, turnaround times, and PHP rates.",
  },
  '/admin/staff': {
    title: 'Staff management',
    subtitle: 'Manage team accounts, shifts, and assigned workloads.',
  },
  '/admin/payments': {
    title: 'Payments & transactions',
    subtitle: 'Record Cash, GCash, and Maya payments and print receipts.',
  },
  '/admin/reports': {
    title: 'Reports & analytics',
    subtitle: 'Track daily, weekly, and monthly revenue and service performance.',
  },
  '/admin/inventory': {
    title: 'Inventory',
    subtitle: 'Monitor detergents, packaging, and low-stock alerts.',
  },
  '/admin/settings': {
    title: 'Settings',
    subtitle: "Configure Wash n' Dash branch details and receipt formatting.",
  },
  '/staff/dashboard': {
    title: 'POS Counter',
    subtitle: 'Enter customer info, pick laundry services, collect payment, and print receipts.',
  },
  '/staff/orders': {
    title: 'Orders',
    subtitle: 'Create laundry orders, update status, and print receipts.',
  },
  '/staff/orders/new': {
    title: 'Create new order',
    subtitle: 'Log a laundry order in three simple steps.',
  },
  '/staff/tracking': {
    title: 'Notification settings',
    subtitle: 'Update processing stages and log laundry remarks.',
  },
  '/staff/customers': {
    title: 'Customers',
    subtitle: 'Register customers and view order histories.',
  },
  '/staff/payments': {
    title: 'Payments',
    subtitle: 'Record Cash, GCash, and Maya payments and print receipts.',
  },
  '/staff/profile': {
    title: 'My profile',
    subtitle: 'Manage your personal details and view recent activity.',
  },
  '/customer/dashboard': {
    title: 'My Laundry Overview',
    subtitle: "Track your active orders, pickup schedule, and balances with Wash n' Dash.",
  },
  '/customer/book': {
    title: 'Book Laundry Service',
    subtitle: 'Select your services, estimate weight, and submit a laundry request.',
  },
  '/customer/orders': {
    title: 'My Orders',
    subtitle: 'Review your active and past laundry orders and view official receipts.',
  },
  '/customer/tracking': {
    title: 'Track My Laundry',
    subtitle: 'Follow live 7-stage progress from drop-off to ready for pickup.',
  },
  '/customer/services': {
    title: 'Services & PHP Rates',
    subtitle: "Explore Wash n' Dash laundry services, turnaround times, and pricing.",
  },
  '/customer/payments': {
    title: 'Payment History',
    subtitle: 'View payment history, remaining balances, and printable receipts.',
  },
  '/customer/profile': {
    title: 'My Profile',
    subtitle: 'Update your contact number, email, and pickup/delivery address.',
  },
  '/customer/settings': {
    title: 'Account & Notification Settings',
    subtitle: 'Manage order alerts, auto-refresh intervals, and account security.',
  },
};

export const PortalLayout = ({ variant, children }) => {
  const { user, logout, notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const isAdmin = variant === 'admin';
  const isCustomer = variant === 'customer';

  const visibleNotifications = useMemo(
    () =>
      notifications.filter((n) => {
        if (isCustomer) return n.targetRole === 'CUSTOMER';
        return n.targetRole === 'ALL' || n.targetRole === (isAdmin ? 'ADMIN' : 'STAFF');
      }),
    [notifications, isAdmin, isCustomer]
  );
  const unreadCount = visibleNotifications.filter((n) => !n.read).length;

  const adminNav = [
    { label: 'Dashboard', to: '/admin/dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    { label: 'Orders Management', to: '/admin/orders', icon: <ClipboardList className="w-[18px] h-[18px]" /> },
    { label: 'Order Tracking', to: '/admin/tracking', icon: <Truck className="w-[18px] h-[18px]" /> },
    { label: 'Customers', to: '/admin/customers', icon: <Users className="w-[18px] h-[18px]" /> },
    { label: 'Services & Pricing', to: '/admin/services', icon: <Shirt className="w-[18px] h-[18px]" /> },
    { label: 'Staff Management', to: '/admin/staff', icon: <UserCog className="w-[18px] h-[18px]" /> },
    { label: 'Payments & Transactions', to: '/admin/payments', icon: <CreditCard className="w-[18px] h-[18px]" /> },
    { label: 'Reports & Analytics', to: '/admin/reports', icon: <BarChart3 className="w-[18px] h-[18px]" /> },
    { label: 'Inventory', to: '/admin/inventory', icon: <Boxes className="w-[18px] h-[18px]" /> },
  ];

  const staffNav = [
    { label: 'POS Counter', to: '/staff/dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    { label: 'Orders', to: '/staff/orders', icon: <ClipboardList className="w-[18px] h-[18px]" /> },
    { label: 'Order Tracking', to: '/staff/tracking', icon: <Truck className="w-[18px] h-[18px]" /> },
    { label: 'Customers', to: '/staff/customers', icon: <Users className="w-[18px] h-[18px]" /> },
    { label: 'Payments', to: '/staff/payments', icon: <CreditCard className="w-[18px] h-[18px]" /> },
    { label: 'My Profile', to: '/staff/profile', icon: <UserCheck className="w-[18px] h-[18px]" /> },
  ];

  const customerNav = [
    { label: 'Overview', to: '/customer/dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    { label: 'Book Laundry', to: '/customer/book', icon: <PlusCircle className="w-[18px] h-[18px]" /> },
    { label: 'My Orders', to: '/customer/orders', icon: <ClipboardList className="w-[18px] h-[18px]" /> },
    { label: 'Order Tracking', to: '/customer/tracking', icon: <Truck className="w-[18px] h-[18px]" /> },
    { label: 'Services & Rates', to: '/customer/services', icon: <Sparkles className="w-[18px] h-[18px]" /> },
    { label: 'Billing & Receipts', to: '/customer/payments', icon: <CreditCard className="w-[18px] h-[18px]" /> },
    { label: 'My Profile', to: '/customer/profile', icon: <UserCheck className="w-[18px] h-[18px]" /> },
  ];

  const navItems = isAdmin ? adminNav : isCustomer ? customerNav : staffNav;
  const pageInfo = ROUTE_TITLES[location.pathname] || {
    title: isAdmin ? 'Dashboard overview' : isCustomer ? 'Customer Portal' : 'Overview',
    subtitle: "Wash n' Dash Laundry Shop Management System",
  };

  const handleGlobalSearchSubmit = (e) => {
    e.preventDefault();
    const q = globalSearch.trim();
    if (!q) return;
    navigate(`${isAdmin ? '/admin/orders' : isCustomer ? '/customer/orders' : '/staff/orders'}?q=${encodeURIComponent(q)}`);
    setGlobalSearch('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-dvh overflow-hidden bg-[#eef4ff] text-[#13213c]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-25 bg-[#0c182e]/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-[246px] flex flex-col px-[15px] pt-[24px] pb-[18px] transition-transform duration-200 lg:translate-x-0 no-print ${
          sidebarOpen ? 'translate-x-0 shadow-[15px_0_50px_rgba(22,73,198,0.2)]' : '-translate-x-full'
        } ${
          isAdmin
            ? 'bg-[#1649c6] text-[#d6e4ff]'
            : 'bg-white border-r border-[#dce6fa] text-[#5d6a85]'
        }`}
      >
        <div className="flex items-center justify-between px-[10px] pb-[24px]">
          <Logo inverted={isAdmin} darkText={isAdmin} />
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
            className={`lg:hidden p-1.5 rounded-lg ${
              isAdmin ? 'text-[#d6e4ff] hover:text-white' : 'text-[#5d6a85] hover:text-[#13213c]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className={`px-[12px] pb-[12px] text-[10px] font-extrabold uppercase tracking-[1.4px] ${
            isAdmin ? 'text-[#a5c1ff]' : 'text-[#8ea0c2]'
          }`}
        >
          {isAdmin ? 'Admin Workspace' : isCustomer ? 'Customer Portal' : 'Staff Workspace'}
        </div>

        <nav className="flex-1 flex flex-col gap-[4px] overflow-y-auto pr-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 h-[42px] px-3 rounded-[9px] text-[13px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  isAdmin
                    ? isActive
                      ? 'bg-[#2b62ea] text-white'
                      : 'text-[#d6e4ff] hover:text-white hover:bg-white/10'
                    : isActive
                    ? 'bg-[#eaf1ff] text-[#1d5ef3]'
                    : 'text-[#5d6a85] hover:text-[#13213c] hover:bg-[#eef4ff]'
                }`
              }
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div
          className={`mt-auto pt-3 border-t flex flex-col gap-1 ${
            isAdmin ? 'border-[#2f63dc]' : 'border-[#dce6fa]'
          }`}
        >
          {(isAdmin || isCustomer) && (
            <NavLink
              to={isAdmin ? '/admin/settings' : '/customer/settings'}
              className={({ isActive }) =>
                `flex items-center gap-3 h-[42px] px-3 rounded-[9px] text-[13px] font-semibold transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#2b62ea] text-white'
                    : 'text-[#d6e4ff] hover:text-white hover:bg-white/10'
                }`
              }
            >
              <Settings className="w-[18px] h-[18px]" />
              <span>Settings</span>
            </NavLink>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className={`flex items-center gap-3 h-[42px] px-3 rounded-[9px] text-[13px] font-semibold transition-colors w-full text-left ${
              isAdmin
                ? 'text-[#d6e4ff] hover:text-white hover:bg-white/10'
                : 'text-[#5d6a85] hover:text-[#dc2626] hover:bg-[#fff1f2]'
            }`}
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Log out</span>
          </button>

          <div
            className={`mt-2 pt-3 border-t flex items-center gap-2.5 px-2 ${
              isAdmin ? 'border-[#2f63dc]' : 'border-[#dce6fa]'
            }`}
          >
            <span className="w-[35px] h-[35px] rounded-[10px] bg-[#dbe7fe] text-[#1d5ef3] font-display text-[11px] font-extrabold grid place-items-center shrink-0">
              {user ? getInitials(user.name) : 'WD'}
            </span>
            <div className="min-w-0 flex-1">
              <b
                className={`block text-[12px] font-bold truncate ${
                  isAdmin ? 'text-white' : 'text-[#13213c]'
                }`}
              >
                {user?.name || "Wash n' Dash User"}
              </b>
              <small
                className={`block text-[10.5px] truncate ${
                  isAdmin ? 'text-[#b8d0ff]' : 'text-[#5d6a85]'
                }`}
              >
                {user?.role === 'ADMIN' ? 'Administrator' : user?.email}
              </small>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:ml-[246px] h-dvh flex flex-col min-w-0 overflow-hidden">
        <header className="shrink-0 z-20 h-[84px] bg-white border-b border-[#dce6fa] px-4 sm:px-[30px] flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="lg:hidden w-10 h-10 rounded-[10px] border border-[#e5eaf2] bg-white grid place-items-center text-[#13213c] shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-display text-[19px] sm:text-[21px] font-extrabold text-[#13213c] truncate leading-tight">
                {pageInfo.title}
              </h1>
              <p className="hidden sm:block text-[12px] text-[#6e7891] truncate mt-0.5">
                {pageInfo.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <form
              onSubmit={handleGlobalSearchSubmit}
              className="hidden md:flex items-center gap-2 h-[40px] px-3.5 bg-[#f9fafc] border border-[#e5eaf2] rounded-[10px] focus-within:border-[#8db5ff] focus-within:bg-white transition-all"
            >
              <Search className="w-4 h-4 text-[#9ba6b8]" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search..."
                className="w-[180px] bg-transparent text-[12.5px] text-[#17223b] placeholder:text-[#9ba6b8]"
              />
            </form>

            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((p) => !p);
                  setProfileOpen(false);
                }}
                aria-label="Notifications"
                className="relative w-[40px] h-[40px] rounded-[10px] border border-[#e5eaf2] bg-white hover:bg-[#f9fbff] grid place-items-center text-[#13213c] transition-colors"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ff5a66] border border-white" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-[320px] sm:w-[340px] bg-white border border-[#e5eaf2] rounded-[14px] shadow-[0_14px_40px_rgba(39,59,103,0.16)] overflow-hidden z-40">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5eaf2]">
                    <span className="font-display text-[13px] font-bold text-[#13213c]">
                      Notifications ({unreadCount})
                    </span>
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="text-[11px] font-bold text-[#246bfd] hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-[280px] overflow-y-auto divide-y divide-[#e5eaf2]">
                    {visibleNotifications.length === 0 ? (
                      <p className="p-4 text-[12px] text-[#6e7891]">No notifications yet.</p>
                    ) : (
                      visibleNotifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => markNotificationRead(n.id)}
                          className={`w-full text-left px-4 py-3 hover:bg-[#f9fbff] transition-colors ${
                            n.read ? 'opacity-70' : 'bg-[#f5f8fe]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12px] font-bold text-[#13213c]">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-[#6e7891] whitespace-nowrap">
                              {n.time}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-[#6e7891] mt-0.5 leading-snug">
                            {n.description}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((p) => !p);
                  setNotifOpen(false);
                }}
                aria-label="Account menu"
                className="w-[38px] h-[38px] rounded-full bg-[#d9e7ff] text-[#246bfd] font-display text-[12px] font-extrabold grid place-items-center hover:ring-2 hover:ring-[#8db5ff] transition-all"
              >
                {user ? getInitials(user.name) : 'WD'}
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-[215px] bg-white border border-[#e5eaf2] rounded-[14px] shadow-[0_14px_40px_rgba(39,59,103,0.16)] py-2 z-40">
                  <div className="px-4 py-2 border-b border-[#e5eaf2]">
                    <p className="text-[12.5px] font-bold text-[#13213c] truncate">
                      {user?.name}
                    </p>
                    <p className="text-[11px] text-[#6e7891] truncate">{user?.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate(isAdmin ? '/admin/settings' : isCustomer ? '/customer/profile' : '/staff/profile');
                    }}
                    className="w-full text-left px-4 py-2 text-[12.5px] font-semibold text-[#17223b] hover:bg-[#f5f7fb]"
                  >
                    {isAdmin ? 'Settings' : 'My profile'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate(isAdmin ? '/admin/tracking' : isCustomer ? '/customer/tracking' : '/staff/tracking');
                    }}
                    className="w-full text-left px-4 py-2 text-[12.5px] font-semibold text-[#17223b] hover:bg-[#f5f7fb]"
                  >
                    Notification settings
                  </button>
                  <div className="my-1 border-t border-[#e5eaf2]" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-[12.5px] font-semibold text-[#dc2626] hover:bg-[#fff1f2]"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <main className="w-full max-w-[1400px] mx-auto px-4 sm:px-[30px] py-[24px]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
