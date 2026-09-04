import React, { useState } from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { ProductsView } from './components/catalog/ProductsView';
import { CategoriesView } from './components/catalog/CategoriesView';
import { BrandsView } from './components/catalog/BrandsView';
import { InventoryView } from './components/inventory/InventoryView';
import { WarehousesView } from './components/inventory/WarehousesView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { SuppliersView } from './components/purchases/SuppliersView';
import { POSView } from './components/pos/POSView';
import { SalesOrdersView } from './components/sales/SalesOrdersView';
import { InvoicesView } from './components/sales/InvoicesView';
import { CustomersView } from './components/sales/CustomersView';
import { ExpensesView } from './components/finance/ExpensesView';
import { AccountingView } from './components/finance/AccountingView';
import { EmployeesView } from './components/admin/EmployeesView';
import { AuditLogsView } from './components/admin/AuditLogsView';
import { MarketingView } from './components/marketing/MarketingView';
import { SettingsView } from './components/settings/SettingsView';
import { ReportsView } from './components/finance/ReportsView';

import { ModuleName } from './types/erp';
import { ShieldAlert } from 'lucide-react';

const ERPMainContent: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    currentRole,
    setCurrentRole,
    currentUserRole,
    hasPermission,
    language,
    t,
  } = useERP();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Check RBAC permission for the active module
  const isAllowed = hasPermission(currentRole, activeModule);

  const renderActiveModule = () => {
    if (!isAllowed) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-rose-100 p-4 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            Access Restricted
          </h2>
          <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
            Your current simulated role ({currentRole}) does not have permission to access the{' '}
            <span className="font-semibold">{activeModule}</span> module.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => setCurrentRole('Super Admin')}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
            >
              Switch to Super Admin
            </button>
            <button
              onClick={() => setActiveModule('dashboard')}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    switch (activeModule) {
      case 'dashboard':
        return <DashboardView onNavigate={(m) => setActiveModule(m)} />;
      case 'sales':
      case 'orders':
      case 'delivery':
      case 'tracking':
      case 'returns':
        return <SalesOrdersView />;
      case 'pos':
        return <POSView />;
      case 'customers':
        return <CustomersView />;
      case 'products':
        return <ProductsView />;
      case 'categories':
        return <CategoriesView />;
      case 'brands':
        return <BrandsView />;
      case 'inventory':
      case 'low_stock':
        return <InventoryView />;
      case 'warehouses':
      case 'stock_transfers':
        return <WarehousesView />;
      case 'purchases':
        return <PurchasesView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'invoices':
        return <InvoicesView />;
      case 'payments':
      case 'accounting':
      case 'profit_loss':
        return <AccountingView />;
      case 'expenses':
        return <ExpensesView />;
      case 'employees':
      case 'roles':
        return <EmployeesView />;
      case 'reports':
      case 'analytics':
        return <ReportsView />;
      case 'coupons':
      case 'marketing':
      case 'reviews':
      case 'website':
      case 'media':
      case 'pages':
        return <MarketingView />;
      case 'audit':
      case 'notifications':
        return <AuditLogsView />;
      case 'settings':
      case 'backup':
        return <SettingsView />;
      default:
        return <DashboardView onNavigate={(m) => setActiveModule(m)} />;
    }
  };

  const isRtl = language === 'ur';

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100 font-sans ${
        isRtl ? 'font-urdu' : ''
      }`}
    >
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeModule={activeModule}
          onSelectModule={(mod) => {
            setActiveModule(mod);
            setIsMobileSidebarOpen(false);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Content Wrapper */}
        <div className="flex flex-1 flex-col overflow-hidden bg-[#F8FAFC] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 min-w-0">
          {/* Global Header */}
          <Header
            onOpenSearch={() => setIsSearchModalOpen(true)}
            onNavigateToPOS={() => setActiveModule('pos')}
            onNavigateToModule={(mod) => setActiveModule(mod as ModuleName)}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          />

          {/* Main View Port */}
          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
            <div className="mx-auto max-w-7xl">
              {renderActiveModule()}
            </div>
          </main>

          {/* Professional Polish Status Footer */}
          <footer className="h-8 shrink-0 bg-white border-t border-slate-200 px-4 sm:px-8 flex items-center justify-between text-[10px] text-slate-400 font-medium dark:bg-slate-900 dark:border-slate-800 dark:text-slate-500">
            <div className="flex items-center gap-1.5">
              <span>Server Status:</span>
              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block"></span>
                Operational
              </span>
              <span className="hidden sm:inline text-slate-400">(0.42ms Latency)</span>
            </div>
            <div className="hidden md:block text-slate-400">
              © 2026 Ahmad Herbals Enterprise ERP v4.1.0-stable
            </div>
            <div>
              Multi-Tenant Mode: <span className="text-slate-600 dark:text-slate-300 font-semibold">Active</span>
            </div>
          </footer>
        </div>
      </div>

      {/* Global Command / Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onNavigate={(mod) => {
          setActiveModule(mod);
          setIsSearchModalOpen(false);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ERPProvider>
      <ERPMainContent />
    </ERPProvider>
  );
}
