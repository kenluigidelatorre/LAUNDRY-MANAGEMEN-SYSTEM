import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Smile, Zap } from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { LaundryHeroIllustration } from '../components/common/LaundryHeroIllustration';
import { useApp } from '../context/AppContext';

export const WelcomePage = () => {
  const { user } = useApp();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/staff/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#ebf2ff] text-[#111c33] relative overflow-hidden flex flex-col">
      <div
        className="pointer-events-none absolute top-0 left-0 w-[520px] h-[240px] bg-[#9fbaff]/70"
        style={{ clipPath: 'polygon(0 0, 100% 0, 0 72%)' }}
        aria-hidden="true"
      />

      <header className="relative z-10 w-full max-w-[1280px] mx-auto px-6 sm:px-10 py-6 flex items-center justify-between gap-8">
        <Link to="/" className="whitespace-nowrap shrink-0">
          <Logo />
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-[14px] font-semibold text-[#334155]">
          <a
            href="#overview"
            className="hover:text-[#1d5ef3] transition-colors whitespace-nowrap shrink-0"
          >
            Overview
          </a>
          <a
            href="#features"
            className="hover:text-[#1d5ef3] transition-colors whitespace-nowrap shrink-0"
          >
            Features
          </a>
          <Link
            to="/login"
            className="hover:text-[#1d5ef3] transition-colors whitespace-nowrap shrink-0"
          >
            Sign In
          </Link>
          <Link
            to="/login?mode=register"
            className="hover:text-[#1d5ef3] transition-colors whitespace-nowrap shrink-0"
          >
            Register
          </Link>
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={handleGetStarted}
            className="px-5 py-2.5 rounded-[10px] bg-[#1d5ef3] hover:bg-[#154fd6] text-white text-[13.5px] font-bold shadow-[0_8px_20px_rgba(29,94,243,0.24)] transition-all whitespace-nowrap shrink-0"
          >
            {user ? 'Go to Portal' : 'Get Started'}
          </button>
        </div>
      </header>

      <main
        id="overview"
        className="relative z-10 flex-1 w-full max-w-[1280px] mx-auto px-6 sm:px-10 pt-4 pb-10 flex flex-col justify-center"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-6 text-left">
            <h1 className="font-display text-[38px] sm:text-[50px] lg:text-[56px] font-extrabold tracking-[-0.03em] leading-[1.06] text-[#0f172a] text-balance">
              Welcome to the{' '}
              <span className="block text-[#1d5ef3]">
                Laundry Management System
              </span>
            </h1>

            <p className="mt-5 text-[16px] sm:text-[17px] leading-[1.65] text-[#3f4d67] max-w-[490px]">
              Manage your laundry services with ease. Track your orders, check status, and enjoy a cleaner, more convenient experience.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleGetStarted}
                className="min-w-[200px] h-[50px] px-8 rounded-[10px] bg-[#1d5ef3] hover:bg-[#154fd6] text-white font-display text-[15px] font-bold shadow-[0_12px_26px_rgba(29,94,243,0.28)] transition-all whitespace-nowrap shrink-0"
              >
                {user ? 'Open Dashboard' : 'Get Started'}
              </button>

              {!user && (
                <Link
                  to="/login?mode=register"
                  className="h-[50px] px-6 rounded-[10px] bg-white/80 hover:bg-white border border-[#c9dafc] text-[#1d5ef3] font-display text-[14.5px] font-bold inline-flex items-center justify-center transition-all whitespace-nowrap shrink-0"
                >
                  Create Account
                </Link>
              )}
            </div>
          </div>

          <div className="lg:col-span-6 flex items-center justify-center">
            <LaundryHeroIllustration className="w-full max-w-[560px] h-auto" />
          </div>
        </div>

        <section
          id="features"
          aria-label="System highlights"
          className="mt-10 lg:mt-12 rounded-[16px] bg-[#dbe7fe] border border-[#c5d8fc] px-6 sm:px-8 py-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0">
            <div className="flex items-center gap-4 md:pr-6">
              <span className="w-12 h-12 rounded-full bg-[#a8c3ff]/80 text-[#1d5ef3] grid place-items-center shrink-0">
                <Zap className="w-5 h-5 fill-current" />
              </span>
              <div>
                <h2 className="font-display text-[15.5px] font-extrabold text-[#0f172a]">
                  Easy Management
                </h2>
                <p className="text-[13px] text-[#3f4d67] mt-0.5 leading-[1.45]">
                  Handle laundry requests in just a few clicks.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 md:px-6 md:border-l md:border-[#9ebbf9]/70">
              <span className="w-12 h-12 rounded-full bg-[#a8c3ff]/80 text-[#1d5ef3] grid place-items-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-display text-[15.5px] font-extrabold text-[#0f172a]">
                  Track in Real-Time
                </h2>
                <p className="text-[13px] text-[#3f4d67] mt-0.5 leading-[1.45]">
                  Know the status of your laundry anytime, anywhere.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 md:pl-6 md:border-l md:border-[#9ebbf9]/70">
              <span className="w-12 h-12 rounded-full bg-[#a8c3ff]/80 text-[#1d5ef3] grid place-items-center shrink-0">
                <Smile className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-display text-[15.5px] font-extrabold text-[#0f172a]">
                  Clean and Convenient
                </h2>
                <p className="text-[13px] text-[#3f4d67] mt-0.5 leading-[1.45]">
                  A hassle-free laundry service for everyone.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
