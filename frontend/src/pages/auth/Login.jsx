import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
  UserPlus,
} from 'lucide-react';
import { getHomeRouteByRole, useApp } from '../../context/AppContext';
import { Logo } from '../../components/common/Logo';
import { LaundryHeroIllustration } from '../../components/common/LaundryHeroIllustration';

export const Login = () => {
  const { user, login, registerCustomer, notify } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState(() =>
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );

  // Sign In state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Customer Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const paramMode = searchParams.get('mode');
    if (paramMode === 'register') {
      setMode('register');
    } else if (paramMode === 'login') {
      setMode('login');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      navigate(getHomeRouteByRole(user.role), { replace: true });
    }
  }, [user, navigate]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setSuccessMsg('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim()) {
      setError('Email or Gmail address is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await login(email, password, rememberMe);
      if (!res.ok || !res.user) {
        setError(res.error || 'Authentication failed.');
        return;
      }
      notify(`Welcome back, ${res.user.name}`);
      navigate(getHomeRouteByRole(res.user.role), { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!regEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      setError('Please enter a valid Gmail or email address.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await registerCustomer({
        fullName: regName.trim(),
        email: regEmail.trim(),
        contactNumber: regPhone.trim() || undefined,
        address: regAddress.trim() || undefined,
        password: regPassword,
      });
      const registeredUser = res.user || res.member;
      if (!res.ok || !registeredUser) {
        setError(res.error || 'Unable to register customer account.');
        return;
      }
      notify(`Welcome to Wash n' Dash, ${registeredUser.name}!`);
      navigate(getHomeRouteByRole(registeredUser.role), { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[44%_56%] bg-white">
      <section className="hidden lg:flex flex-col justify-between p-[40px_48px] text-[#111c33] wd-auth-brand border-r border-[#dce6fa]">
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="inline-flex">
            <Logo />
          </Link>
          <Link
            to="/welcome"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#1d5ef3] hover:underline whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Home
          </Link>
        </div>

        <div className="relative z-10 my-auto flex flex-col items-center text-center">
          <LaundryHeroIllustration className="w-full max-w-[380px] h-auto mb-5" />
          <h1 className="font-display text-[30px] font-extrabold tracking-[-0.03em] leading-[1.15] text-[#0f172a] text-balance">
            Laundry Management <span className="text-[#1d5ef3]">System</span>
          </h1>
          <p className="text-[#4b5c7a] text-[14px] mt-2">
            Book laundry, track orders, and manage shop operations.
          </p>
        </div>

        <div className="relative z-10 text-center text-[12px] text-[#5d6a85]">
          Wash n&apos; Dash
        </div>
      </section>

      <section className="grid place-items-center px-6 py-10 bg-white">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center justify-between mb-8">
            <Link to="/">
              <Logo size="lg" />
            </Link>
            <Link
              to="/welcome"
              className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#1d5ef3]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Home
            </Link>
          </div>

          <h2 className="font-display text-[30px] sm:text-[32px] font-extrabold tracking-[-0.03em] text-[#111c33] mb-1.5">
            {mode === 'login' ? 'Sign in' : 'Register an Account'}
          </h2>
          <p className="text-[14px] text-[#5d6a85] mb-5">
            {mode === 'login'
              ? 'Sign in to your Account to continue'
              : 'Create an account'}
          </p>

          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-[11px] bg-[#eef4ff] border border-[#dce6fa] mb-5">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`h-[40px] rounded-[8px] text-[13px] font-bold transition-all ${
                mode === 'login'
                  ? 'bg-white text-[#111c33] shadow-[0_2px_8px_rgba(29,94,243,0.08)]'
                  : 'text-[#5d6a85] hover:text-[#111c33]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`h-[40px] rounded-[8px] text-[13px] font-bold transition-all inline-flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-white text-[#1d5ef3] shadow-[0_2px_8px_rgba(29,94,243,0.08)]'
                  : 'text-[#5d6a85] hover:text-[#111c33]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register
            </button>
          </div>

          {successMsg && (
            <div className="mb-4 rounded-[10px] border border-[#a7f3d0] bg-[#ecfdf5] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#047857] flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-[10px] border border-[#fecdd3] bg-[#fff1f2] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#dc2626]">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} noValidate>
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-[12px] font-bold text-[#13213c] mb-2"
                >
                  Gmail / Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    autoComplete="email"
                    className="w-full h-[46px] pl-10 pr-4 rounded-[10px] border border-[#dce6fa] bg-white text-[13.5px] text-[#13213c] focus:border-[#1d5ef3] focus:ring-3 focus:ring-[#eaf1ff] transition-all"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="login-password"
                  className="block text-[12px] font-bold text-[#13213c] mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full h-[46px] pl-10 pr-12 rounded-[10px] border border-[#dce6fa] bg-white text-[13.5px] text-[#13213c] focus:border-[#1d5ef3] focus:ring-3 focus:ring-[#eaf1ff] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1d5ef3] hover:text-[#154fd6] p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center my-5">
                <label className="inline-flex items-center gap-2 text-[12.5px] font-medium text-[#5d6a85] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-[#1d5ef3] rounded"
                  />
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-[48px] rounded-[10px] bg-[#1d5ef3] hover:bg-[#154fd6] text-white font-display text-[14px] font-bold shadow-[0_8px_20px_rgba(29,94,243,0.24)] transition-all disabled:opacity-60"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>

              <p className="mt-5 text-center text-[13px] text-[#5d6a85]">
                New customer?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="font-bold text-[#1d5ef3] hover:underline"
                >
                  Create a customer account
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5" noValidate>
              <div>
                <label
                  htmlFor="reg-name"
                  className="block text-[12px] font-bold text-[#13213c] mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-name"
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g., Juan Dela Cruz"
                    className="w-full h-[44px] pl-10 pr-4 rounded-[10px] border border-[#dce6fa] bg-white text-[13.5px] text-[#13213c] focus:border-[#1d5ef3] focus:ring-3 focus:ring-[#eaf1ff] transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-[12px] font-bold text-[#13213c] mb-1.5"
                >
                  Gmail / Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full h-[44px] pl-10 pr-4 rounded-[10px] border border-[#dce6fa] bg-white text-[13.5px] text-[#13213c] focus:border-[#1d5ef3] focus:ring-3 focus:ring-[#eaf1ff] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="reg-phone"
                    className="block text-[12px] font-bold text-[#13213c] mb-1.5"
                  >
                    Contact Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="reg-phone"
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+63 917 000 0000"
                      className="w-full h-[44px] pl-10 pr-3 rounded-[10px] border border-[#dce6fa] bg-white text-[13px] text-[#13213c] focus:border-[#1d5ef3] focus:ring-3 focus:ring-[#eaf1ff] transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="reg-address"
                    className="block text-[12px] font-bold text-[#13213c] mb-1.5"
                  >
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="reg-address"
                      type="text"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      placeholder="Makati City"
                      className="w-full h-[44px] pl-10 pr-3 rounded-[10px] border border-[#dce6fa] bg-white text-[13px] text-[#13213c] focus:border-[#1d5ef3] focus:ring-3 focus:ring-[#eaf1ff] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-[12px] font-bold text-[#13213c] mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full h-[44px] pl-10 pr-12 rounded-[10px] border border-[#dce6fa] bg-white text-[13.5px] text-[#13213c] focus:border-[#1d5ef3] focus:ring-3 focus:ring-[#eaf1ff] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((p) => !p)}
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1d5ef3] hover:text-[#154fd6] p-1"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-confirm"
                  className="block text-[12px] font-bold text-[#13213c] mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-confirm"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full h-[44px] pl-10 pr-4 rounded-[10px] border border-[#dce6fa] bg-white text-[13.5px] text-[#13213c] focus:border-[#1d5ef3] focus:ring-3 focus:ring-[#eaf1ff] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-[48px] mt-2 rounded-[10px] bg-[#1d5ef3] hover:bg-[#154fd6] text-white font-display text-[14px] font-bold shadow-[0_8px_20px_rgba(29,94,243,0.24)] transition-all disabled:opacity-60"
              >
                {submitting ? 'Creating Account...' : 'Register'}
              </button>

              <p className="pt-2 text-center text-[13px] text-[#5d6a85]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-bold text-[#1d5ef3] hover:underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
