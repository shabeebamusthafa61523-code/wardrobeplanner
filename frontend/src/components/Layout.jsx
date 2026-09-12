import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Shirt, Calendar, History, Camera, Plus, User, LogOut, Shield, Sun, Moon } from 'lucide-react';
import { AddClothingModal } from './AddClothingModal';
import { WearTrackerModal } from './WearTrackerModal';
import { UserAuthModal } from './UserAuthModal';
import { logoutUser, elevateToAdmin } from '../services/api';

export const Layout = ({ children, onRefreshData }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWearModalOpen, setIsWearModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState('user');

  // Theme Light / Dark state
  const [theme, setTheme] = useState(() => localStorage.getItem('wardrobe_theme') || 'light');

  // Hidden admin PIN modal
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [logoClickTimer, setLogoClickTimer] = useState(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('wardrobe_theme', nextTheme);
  };

  useEffect(() => {
    const savedName = localStorage.getItem('wardrobe_user_name');
    const savedRole = localStorage.getItem('wardrobe_user_role');
    setCurrentUserName(savedName || 'Guest User');
    setCurrentUserRole(savedRole || 'user');

    // Allow WearTrackerModal login gate to open the auth modal
    const openAuth = () => setIsAuthModalOpen(true);
    window.addEventListener('open-auth-modal', openAuth);
    return () => window.removeEventListener('open-auth-modal', openAuth);
  }, []);

  // 5 taps on logo within 3 seconds → open PIN modal
  const handleLogoClick = () => {
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);
    if (logoClickTimer) clearTimeout(logoClickTimer);
    if (newCount >= 5) {
      setLogoClickCount(0);
      setPin('');
      setPinError('');
      setPinSuccess('');
      setIsPinModalOpen(true);
    } else {
      const t = setTimeout(() => setLogoClickCount(0), 3000);
      setLogoClickTimer(t);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');
    setPinLoading(true);
    try {
      const res = await elevateToAdmin(pin);
      // Save new token + role
      localStorage.setItem('wardrobe_token', res.token);
      localStorage.setItem('wardrobe_user_role', res.user.role);
      localStorage.setItem('wardrobe_user_name', res.user.name);
      localStorage.setItem('wardrobe_user_id', res.user._id);
      setPinSuccess(res.message || '✓ You are now superadmin!');
      setTimeout(() => { setIsPinModalOpen(false); window.location.reload(); }, 1500);
    } catch (err) {
      setPinError(err.response?.data?.error || 'Incorrect PIN. Try again.');
    } finally {
      setPinLoading(false);
    }
  };

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Wardrobe', path: '/wardrobe', icon: Shirt },
    { name: 'Planner', path: '/planner', icon: Calendar },
    { name: 'History', path: '/history', icon: History },
    ...(currentUserRole === 'superadmin'
      ? [{ name: 'Admin', path: '/admin', icon: Shield }]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-sand-50 text-sand-900 pb-24 md:pb-8">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-sand-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          {/* Logo Brand — tap 5× quickly to open hidden admin PIN */}
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group flex-shrink-0"
          >
            <img
              src="/logo.png"
              alt="Wardrobe Logo"
              onClick={handleLogoClick}
              className="h-9 w-9 sm:h-10 sm:w-10 object-contain group-hover:scale-105 transition-transform filter drop-shadow-sm select-none"
            />
            <div className="leading-none">
              <span className="font-extrabold text-base sm:text-lg text-sand-900 tracking-tight block">
                Wardrobe
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-sand-400 block mt-0.5">
                Personal Planner
              </span>
            </div>
          </div>

          {/* Desktop Nav Links (Medium & Larger Screens) */}
          <nav className="hidden md:flex items-center gap-1 bg-sand-100/70 p-1.5 rounded-2xl border border-sand-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm border border-sand-200'
                        : 'text-sand-600 hover:text-sand-900 hover:bg-white/50'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Theme Toggle Button (Light / Dark) */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:px-3 sm:py-2 rounded-xl bg-sand-100 dark:bg-slate-800 hover:bg-sand-200 text-slate-800 dark:text-amber-400 text-xs font-bold transition-all border border-sand-200 dark:border-slate-700 flex items-center gap-1.5 shadow-2xs"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="h-4 w-4 text-slate-700" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              )}
            </button>

            {/* User Profile Badge */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-sand-100 hover:bg-sand-200 text-slate-900 text-xs font-bold transition-all border border-sand-200 shadow-2xs"
              title="Switch User / Account"
            >
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-800" />
              <span className="truncate max-w-[70px] sm:max-w-[110px] lowercase">{currentUserName}</span>
            </button>

            {/* Quick AI Scanner Button */}
            <button
              onClick={() => navigate('/scan')}
              className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-sand-200/80 hover:bg-sand-200 text-sand-900 text-xs font-bold transition-all border border-sand-300"
              title="Scan Today's Outfit"
            >
              <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-800" />
              <span className="hidden sm:inline">Scan</span>
            </button>

            {/* Prominent "+ Add Clothes" Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">+ Add Clothes</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 sm:pt-6">
        {children}
      </main>

      {/* Mobile Floating Action Button (+ Add Clothes) on bottom right */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="md:hidden fixed right-4 bottom-20 z-40 h-13 w-13 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xl border border-sand-400 active:scale-90 transition-transform"
        aria-label="Add Clothes"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Mobile Responsive Bottom Navigation Bar (< 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-sand-200 px-2 py-2 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-slate-900 text-white font-extrabold shadow-sm scale-105'
                  : 'text-sand-500 hover:text-sand-900 hover:bg-sand-100'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-bold tracking-tight">{item.name}</span>
            </NavLink>
          );
        })}

        {/* Mobile Scan Outfit Tab */}
        <NavLink
          to="/scan"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              isActive
                ? 'bg-slate-900 text-white font-extrabold shadow-sm scale-105'
                : 'text-sand-500 hover:text-sand-900 hover:bg-sand-100'
            }`
          }
        >
          <Camera className="h-5 w-5" />
          <span className="text-[10px] font-bold tracking-tight">Scan</span>
        </NavLink>
      </nav>

      {/* Modals */}
      <AddClothingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onItemAdded={() => {
          onRefreshData && onRefreshData();
        }}
      />

      <WearTrackerModal
        isOpen={isWearModalOpen}
        onClose={() => setIsWearModalOpen(false)}
        onWearSaved={() => {
          onRefreshData && onRefreshData();
        }}
      />

      <UserAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUserName(user.name);
          window.location.reload();
        }}
      />

      {/* ── Hidden Admin PIN Modal ── */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-sand-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-xs shadow-2xl border border-sand-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-300" />
                <span className="text-white font-extrabold text-sm tracking-wide">Admin Access</span>
              </div>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePinSubmit} className="p-6 space-y-4">
              <p className="text-xs text-sand-500 font-semibold text-center">
                Enter the admin PIN to gain superadmin access.
              </p>

              {pinError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold text-center">
                  ❌ {pinError}
                </div>
              )}
              {pinSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center animate-pulse">
                  {pinSuccess}
                </div>
              )}

              <input
                type="password"
                inputMode="numeric"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={10}
                className="w-full px-4 py-3 rounded-2xl bg-sand-50 border border-sand-200 text-center text-xl font-extrabold tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-slate-800"
                autoFocus
              />

              <button
                type="submit"
                disabled={pinLoading || !pin}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {pinLoading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><Shield className="h-4 w-4" /> Verify PIN</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
