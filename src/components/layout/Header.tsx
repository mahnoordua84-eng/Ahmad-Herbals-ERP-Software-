import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Globe,
  Shield,
  Store,
  ChevronDown,
  Check,
  Building2,
  Receipt,
  X,
  ExternalLink,
  Menu,
} from 'lucide-react';
import { RoleType } from '../../types/erp';

interface HeaderProps {
  onOpenSearch: () => void;
  onNavigateToPOS: () => void;
  onNavigateToModule: (module: string) => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onNavigateToPOS,
  onNavigateToModule,
  onToggleMobileSidebar,
}) => {
  const {
    brandSettings,
    brands,
    activeBrandId,
    setActiveBrandId,
    language,
    setLanguage,
    t,
    isDarkMode,
    toggleDarkMode,
    currentRole,
    setCurrentRole,
    notifications,
    markNotificationAsRead,
  } = useERP();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showBrandMenu, setShowBrandMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const activeBrand = brands.find((b) => b.id === activeBrandId) || brands[0];

  const rolesList: RoleType[] = [
    'Super Admin',
    'Admin',
    'Manager',
    'Inventory Manager',
    'Sales Manager',
    'Accountant',
    'POS User',
    'Delivery Manager',
  ];

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8 dark:border-slate-800 dark:bg-slate-900 transition-colors shadow-xs"
    >
      {/* Left: Global Search trigger & Brand Quick Switch */}
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="flex lg:hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle Navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <button
          id="btn-global-search"
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs sm:text-sm text-slate-500 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-800 transition-all cursor-pointer w-48 sm:w-72"
        >
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="flex-1 text-left truncate">Global Search (Ctrl + K)...</span>
        </button>

        {/* Multi-Brand Switcher (Requirement #38) */}
        <div className="relative hidden md:block">
          <button
            id="btn-brand-switcher"
            onClick={() => setShowBrandMenu(!showBrandMenu)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-all cursor-pointer"
            title="Multi-Brand Switcher"
          >
            <Building2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="truncate max-w-[120px]">{activeBrand?.name || brandSettings.businessName}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {showBrandMenu && (
            <div className="absolute left-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Business Entity
              </div>
              {brands.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setActiveBrandId(b.id);
                    setShowBrandMenu(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    b.id === activeBrandId
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{b.name}</span>
                  {b.id === activeBrandId && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions, POS Quick Button, Language, Dark Mode, Notifications, Role Matrix */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* POS Quick Button */}
        <button
          id="btn-pos-quick"
          onClick={onNavigateToPOS}
          className="hidden sm:flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition-all cursor-pointer"
        >
          <Store className="h-3.5 w-3.5" />
          <span>{t('pos')}</span>
        </button>

        {/* Language Toggle: English (LTR) <-> Urdu (RTL) (Requirement #43) */}
        <button
          id="btn-lang-toggle"
          onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          title={language === 'en' ? 'Switch to Urdu (RTL)' : 'انگریزی میں تبدیل کریں (LTR)'}
        >
          <Globe className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          <span className="font-semibold">{language === 'en' ? 'اردو' : 'English'}</span>
        </button>

        {/* Dark / Light Mode Toggle (Requirement #41) */}
        <button
          id="btn-dark-toggle"
          onClick={toggleDarkMode}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            id="btn-notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{t('notifications')}</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 py-1">
                {notifications.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        if (n.linkToModule) {
                          onNavigateToModule(n.linkToModule);
                          setShowNotifications(false);
                        }
                      }}
                      className={`flex flex-col gap-1 p-2.5 rounded-lg transition-colors cursor-pointer ${
                        !n.read
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{n.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  onClick={() => {
                    onNavigateToModule('notifications');
                    setShowNotifications(false);
                  }}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
                >
                  View All Notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Role Switcher (Requirement #25 RBAC Simulator) */}
        <div className="relative">
          <button
            id="btn-role-switcher"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-all cursor-pointer"
            title="Switch Active RBAC Role"
          >
            <Shield className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <div className="text-left hidden lg:block">
              <span className="block text-[10px] text-slate-400 font-normal leading-tight">Role</span>
              <span className="block text-xs font-semibold leading-tight">{currentRole}</span>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Simulate RBAC Persona
              </div>
              {rolesList.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setCurrentRole(r);
                    setShowRoleMenu(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    r === currentRole
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{r}</span>
                  {r === currentRole && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-semibold text-white shadow-xs">
            {brandSettings.shortName?.[0] || 'A'}
          </div>
        </div>
      </div>
    </header>
  );
};
