import React, { useState, useLayoutEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { usePlan } from '../../hooks/usePlan';
import { authService } from '../../services/authService';
import {
  APP_COLORS,
  FINANCIAL_PILLARS,
  PREMIUM_PILLAR_TITLES,
  NAV_ITEMS,
} from '../../theme/tokens';
import logoImg from '../../assets/app/logo.png';
import mascotImg from '../../assets/app/mascot.png';

export interface AppShellProps {
  children?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { effectiveTheme, toggleTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const { showToast } = useToast();
  const { isPro } = usePlan();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Theme isolation: apply effectiveTheme to <html> while mounted, restore landing styles on unmount
  useLayoutEffect(() => {
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }

    return () => {
      // Restore landing page / public auth styles (dark)
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    };
  }, [effectiveTheme]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    } finally {
      navigate('/');
    }
  };

  const handlePillarClick = (pillar: (typeof FINANCIAL_PILLARS)[number]) => {
    const isPremium = PREMIUM_PILLAR_TITLES.includes(
      pillar.title as (typeof PREMIUM_PILLAR_TITLES)[number]
    );
    const isLocked = isPremium && !isPro;

    if (isLocked) {
      showToast({
        message: 'Upgrade to PRO to unlock this pillar! 🚀',
        backgroundColor: APP_COLORS.accent,
        action: {
          label: 'UPGRADE',
          onClick: () => {
            navigate('/subscription');
          },
        },
      });
      return;
    }

    setDrawerOpen(false);
    navigate(pillar.webRoute);
  };

  const isRouteActive = (route: string) => {
    if (!route) return false;
    const path = location.pathname;
    if (path === route) return true;
    if (route !== '/' && route !== '/dashboard' && path.startsWith(route)) return true;
    return false;
  };

  return (
    <div
      data-testid="app-shell"
      style={{
        backgroundColor: isDark ? APP_COLORS.darkBackground : APP_COLORS.background,
        color: isDark ? APP_COLORS.textPrimaryDark : APP_COLORS.textPrimaryLight,
      }}
      className="min-h-screen flex flex-col md:flex-row transition-colors duration-200"
    >
      {/* Desktop Left Sidebar */}
      <aside
        data-testid="desktop-sidebar"
        style={{
          backgroundColor: isDark ? APP_COLORS.darkCard : '#FFFFFF',
          borderColor: isDark ? APP_COLORS.darkBorder : APP_COLORS.borderLight,
        }}
        className="hidden md:flex flex-col w-72 border-r select-none h-screen sticky top-0 z-30"
      >
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b" style={{ borderColor: isDark ? APP_COLORS.darkBorder : APP_COLORS.borderLight }}>
          <img src={logoImg} alt="MoneyMapper Logo" className="h-9 w-auto object-contain" />
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tight leading-tight">MoneyMapper</span>
            <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider">
              {isPro ? 'PRO ACCOUNT' : 'STANDARD'}
            </span>
          </div>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Main Navigation Links */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isRouteActive(item.path);
              return (
                <button
                  key={item.id}
                  data-testid={`sidebar-nav-${item.id}`}
                  onClick={() => navigate(item.path)}
                  style={{
                    backgroundColor: active
                      ? 'rgba(79, 70, 229, 0.12)'
                      : 'transparent',
                    color: active
                      ? APP_COLORS.primary
                      : isDark
                      ? APP_COLORS.textSecondaryDark
                      : APP_COLORS.textSecondaryLight,
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all duration-150 hover:opacity-100 ${
                    active ? 'font-black' : 'hover:bg-zinc-800/10 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Financial Pillars Section */}
          <div className="space-y-2">
            <div className="px-2 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                Financial Pillars
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800/10 dark:bg-zinc-800 text-zinc-400">
                5 ACTIVE
              </span>
            </div>

            <div className="space-y-1.5">
              {FINANCIAL_PILLARS.map((pillar) => {
                const isPremium = PREMIUM_PILLAR_TITLES.includes(
                  pillar.title as (typeof PREMIUM_PILLAR_TITLES)[number]
                );
                const isLocked = isPremium && !isPro;
                const active = isRouteActive(pillar.webRoute);

                return (
                  <button
                    key={pillar.title}
                    data-testid={`pillar-nav-${pillar.title.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => handlePillarClick(pillar)}
                    style={{
                      backgroundColor: active
                        ? 'rgba(79, 70, 229, 0.12)'
                        : isDark
                        ? APP_COLORS.darkBackground
                        : '#F3F7FC',
                      borderColor: active
                        ? APP_COLORS.primary
                        : isDark
                        ? APP_COLORS.darkBorder
                        : APP_COLORS.borderLight,
                      opacity: isLocked ? 0.65 : 1,
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all duration-150 ${
                      active ? 'ring-1 ring-indigo-500' : 'hover:border-indigo-400/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                        style={{
                          backgroundColor: isLocked ? '#71717A20' : `${pillar.color}25`,
                          color: isLocked ? '#71717A' : pillar.color,
                        }}
                      >
                        ●
                      </div>
                      <div className="min-w-0">
                        <div
                          className="text-xs font-bold truncate"
                          style={{
                            color: isDark ? APP_COLORS.textPrimaryDark : APP_COLORS.textPrimaryLight,
                          }}
                        >
                          {pillar.title}
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate">
                          {pillar.desc}
                        </div>
                      </div>
                    </div>

                    {isLocked ? (
                      <span className="text-amber-400 text-xs shrink-0">🔒</span>
                    ) : (
                      <span className="text-zinc-400 text-xs shrink-0">→</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mascot + Assistant Banner */}
        <div className="px-4 py-3 border-t" style={{ borderColor: isDark ? APP_COLORS.darkBorder : APP_COLORS.borderLight }}>
          <div
            onClick={() => navigate('/ai-assistant')}
            className="cursor-pointer p-3 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <img
              src={mascotImg}
              alt="Mascot"
              className="w-10 h-10 object-contain shrink-0 animate-bounce"
              style={{ animationDuration: '3s' }}
            />
            <div className="min-w-0">
              <div className="text-xs font-black text-indigo-400">Ask MoneyMapper</div>
              <div className="text-[10px] text-zinc-400 truncate">AI financial assistant</div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer (Theme Toggle & Logout) */}
        <div
          className="p-4 border-t flex items-center justify-between gap-2"
          style={{ borderColor: isDark ? APP_COLORS.darkBorder : APP_COLORS.borderLight }}
        >
          <button
            type="button"
            data-testid="theme-toggle"
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800/10 dark:bg-zinc-800/80 hover:bg-zinc-800/20 dark:hover:bg-zinc-700 transition-colors"
          >
            <span>{isDark ? '☀️ Light' : '🌙 Dark'}</span>
          </button>

          <button
            type="button"
            data-testid="logout-button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors"
          >
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Navbar */}
      <header
        data-testid="mobile-top-bar"
        style={{
          backgroundColor: isDark ? APP_COLORS.darkCard : '#FFFFFF',
          borderColor: isDark ? APP_COLORS.darkBorder : APP_COLORS.borderLight,
        }}
        className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b"
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="drawer-toggle"
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <img src={logoImg} alt="Logo" className="h-7 w-auto object-contain" />
          <span className="font-black text-base">MoneyMapper</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="mobile-theme-toggle"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-sm bg-zinc-800/10 dark:bg-zinc-800"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            type="button"
            data-testid="mobile-logout-button"
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-xs font-bold text-red-500 bg-red-500/10"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Mobile Slide-over Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer content */}
          <div
            data-testid="mobile-drawer"
            style={{
              backgroundColor: isDark ? APP_COLORS.darkBackground : '#F9FAFB',
              borderColor: isDark ? APP_COLORS.darkBorder : APP_COLORS.borderLight,
            }}
            className="relative w-4/5 max-w-sm h-full z-10 flex flex-col border-r shadow-2xl p-5"
          >
            <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: isDark ? APP_COLORS.darkBorder : APP_COLORS.borderLight }}>
              <div>
                <h2 className="text-xl font-black">MoneyMapper</h2>
                <p className="text-xs font-bold text-zinc-400">Active Financial Pillars</p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2">
              {FINANCIAL_PILLARS.map((p) => {
                const isPremium = PREMIUM_PILLAR_TITLES.includes(
                  p.title as (typeof PREMIUM_PILLAR_TITLES)[number]
                );
                const isLocked = isPremium && !isPro;
                const active = isRouteActive(p.webRoute);

                return (
                  <div
                    key={p.title}
                    data-testid={`drawer-pillar-${p.title.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => handlePillarClick(p)}
                    style={{
                      backgroundColor: isDark ? APP_COLORS.darkCard : '#FFFFFF',
                      borderColor: active
                        ? APP_COLORS.primary
                        : isDark
                        ? APP_COLORS.darkBorder
                        : APP_COLORS.borderLight,
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between ${
                      active ? 'ring-2 ring-indigo-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{
                          backgroundColor: isLocked ? '#71717A20' : `${p.color}25`,
                          color: isLocked ? '#71717A' : p.color,
                        }}
                      >
                        ●
                      </div>
                      <div style={{ opacity: isLocked ? 0.5 : 1 }}>
                        <div className="text-xs font-black">{p.title}</div>
                        <div className="text-[10px] text-zinc-400">{p.desc}</div>
                      </div>
                    </div>
                    {isLocked ? (
                      <span className="text-amber-400 text-xs">🔒</span>
                    ) : (
                      <span className="text-zinc-400 text-xs">→</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t" style={{ borderColor: isDark ? APP_COLORS.darkBorder : APP_COLORS.borderLight }}>
              <button
                type="button"
                data-testid="drawer-logout-button"
                onClick={handleLogout}
                className="w-full py-3 rounded-xl font-bold text-sm text-red-500 bg-red-500/10 hover:bg-red-500/20 text-center"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto pb-20 md:pb-0">
        {children || <Outlet />}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        data-testid="bottom-nav"
        style={{
          backgroundColor: isDark ? APP_COLORS.darkCard : '#FFFFFF',
          borderColor: isDark ? APP_COLORS.darkBorder : APP_COLORS.borderLight,
        }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t flex items-center justify-around py-2 px-3 select-none"
      >
        {NAV_ITEMS.map((item, idx) => {
          const active = isRouteActive(item.path);
          const isMascotItem = idx === 2; // AI Assistant tab

          return (
            <button
              key={item.id}
              data-testid={`bottom-nav-${item.id}`}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center px-3 py-1 text-xs font-bold transition-transform active:scale-95"
              style={{
                color: active
                  ? APP_COLORS.primary
                  : isDark
                  ? APP_COLORS.textSecondaryDark
                  : APP_COLORS.textSecondaryLight,
              }}
            >
              {isMascotItem ? (
                <img
                  src={mascotImg}
                  alt="Mascot"
                  className="w-8 h-8 object-contain mb-0.5"
                />
              ) : (
                <div
                  className="w-6 h-6 flex items-center justify-center rounded-full mb-0.5"
                  style={{
                    backgroundColor: active ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
                  }}
                >
                  ●
                </div>
              )}
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
