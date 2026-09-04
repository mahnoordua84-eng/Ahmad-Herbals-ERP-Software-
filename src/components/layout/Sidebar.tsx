import React from 'react';
import { useERP } from '../../context/ERPContext';
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Monitor,
  Users,
  Package,
  Tags,
  Building2,
  Boxes,
  Warehouse,
  ArrowLeftRight,
  TriangleAlert,
  ShoppingBag,
  Truck,
  Receipt,
  CreditCard,
  Wallet,
  BookOpen,
  ChartNoAxesCombined,
  MapPin,
  Ticket,
  Megaphone,
  Star,
  UserRoundCog,
  ShieldCheck,
  BarChart3,
  ChartPie,
  Globe,
  Images,
  FileText,
  Bell,
  History,
  DatabaseBackup,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ModuleName } from '../../types/erp';

interface SidebarProps {
  activeModule: ModuleName;
  onSelectModule: (module: ModuleName) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavGroup {
  title: string;
  items: {
    id: ModuleName;
    label: string;
    icon: React.ElementType;
    badge?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { brandSettings, t, hasPermission, notifications, currentRole } = useERP();

  const unreadStockCount = notifications.filter(
    (n) => !n.read && n.type === 'STOCK'
  ).length;
  const unreadOrderCount = notifications.filter(
    (n) => !n.read && n.type === 'ORDER'
  ).length;

  const navigationGroups: NavGroup[] = [
    {
      title: 'MAIN',
      items: [
        { id: 'dashboard', label: t('dashboard') || 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'SALES',
      items: [
        { id: 'sales', label: t('sales') || 'Sales', icon: ShoppingCart },
        { id: 'orders', label: t('orders') || 'Orders', icon: ClipboardList, badge: unreadOrderCount > 0 ? `${unreadOrderCount}` : undefined },
        { id: 'pos', label: t('pos') || 'POS', icon: Monitor, badge: 'HOT' },
        { id: 'customers', label: t('customers') || 'Customers', icon: Users },
      ],
    },
    {
      title: 'PRODUCTS',
      items: [
        { id: 'products', label: t('products') || 'Products', icon: Package },
        { id: 'categories', label: t('categories') || 'Categories', icon: Tags },
        { id: 'brands', label: t('brands') || 'Brands', icon: Building2 },
      ],
    },
    {
      title: 'INVENTORY',
      items: [
        { id: 'inventory', label: t('inventory') || 'Inventory', icon: Boxes, badge: unreadStockCount > 0 ? 'ALERT' : undefined },
        { id: 'warehouses', label: t('warehouses') || 'Warehouses', icon: Warehouse },
        { id: 'stock_transfers', label: 'Stock Transfers', icon: ArrowLeftRight },
        { id: 'low_stock', label: 'Low Stock', icon: TriangleAlert, badge: 'ALERT' },
      ],
    },
    {
      title: 'PURCHASE',
      items: [
        { id: 'purchases', label: t('purchases') || 'Purchases', icon: ShoppingBag },
        { id: 'suppliers', label: t('suppliers') || 'Suppliers', icon: Truck },
      ],
    },
    {
      title: 'FINANCE',
      items: [
        { id: 'invoices', label: t('invoices') || 'Invoices', icon: Receipt },
        { id: 'payments', label: t('payments') || 'Payments', icon: CreditCard },
        { id: 'expenses', label: t('expenses') || 'Expenses', icon: Wallet },
        { id: 'accounting', label: t('accounting') || 'Accounting', icon: BookOpen },
        { id: 'profit_loss', label: 'Profit & Loss', icon: ChartNoAxesCombined },
      ],
    },
    {
      title: 'DELIVERY',
      items: [
        { id: 'delivery', label: t('delivery') || 'Delivery', icon: Truck },
        { id: 'tracking', label: 'Tracking', icon: MapPin },
      ],
    },
    {
      title: 'MARKETING',
      items: [
        { id: 'coupons', label: t('coupons') || 'Coupons', icon: Ticket },
        { id: 'marketing', label: 'Marketing', icon: Megaphone },
        { id: 'reviews', label: 'Reviews', icon: Star },
      ],
    },
    {
      title: 'PEOPLE',
      items: [
        { id: 'employees', label: t('employees') || 'Employees', icon: UserRoundCog },
        { id: 'roles', label: t('roles') || 'Roles & Permissions', icon: ShieldCheck },
      ],
    },
    {
      title: 'REPORTS',
      items: [
        { id: 'reports', label: t('reports') || 'Reports', icon: BarChart3 },
        { id: 'analytics', label: 'Analytics', icon: ChartPie },
      ],
    },
    {
      title: 'WEBSITE',
      items: [
        { id: 'website', label: t('website') || 'Website', icon: Globe },
        { id: 'media', label: t('media') || 'Media Library', icon: Images },
        { id: 'pages', label: 'Pages', icon: FileText },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'notifications', label: t('notifications') || 'Notifications', icon: Bell },
        { id: 'audit', label: t('audit') || 'Audit Logs', icon: History },
        { id: 'backup', label: t('backup') || 'Backup', icon: DatabaseBackup },
        { id: 'settings', label: t('settings') || 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 z-50 flex flex-col border-r border-slate-800 bg-[#0F172A] text-slate-300 transition-all duration-300 ${
          isMobileOpen ? 'left-0 w-64' : '-left-64 lg:left-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4 sm:px-6">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-emerald-500 text-white font-bold text-sm tracking-tight shadow-sm">
              {brandSettings.shortName?.[0] || 'A'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-sm font-bold text-white tracking-tight">
                  {brandSettings.businessName.toUpperCase()}
                </h1>
                <p className="truncate text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                  Enterprise ERP
                </p>
              </div>
            )}
          </div>

          <button
            id="btn-toggle-sidebar"
            onClick={onToggleCollapse}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          {navigationGroups.map((group) => {
            // Filter items by permission (if user is Super Admin or has permission)
            const visibleItems = group.items.filter((item) => {
              if (currentRole === 'Super Admin') return true;
              return hasPermission(item.id, 'view');
            });
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {group.title}
                  </div>
                )}

                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeModule === item.id;

                  return (
                    <button
                      key={item.id}
                      id={`nav-${item.id}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        onSelectModule(item.id);
                        if (isMobileOpen) onCloseMobile();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectModule(item.id);
                          if (isMobileOpen) onCloseMobile();
                        }
                      }}
                      title={isCollapsed ? item.label : undefined}
                      className={`group flex w-full items-center gap-3 px-3 py-2 text-xs font-medium transition-all cursor-pointer rounded-md ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-r-2 border-emerald-500 font-semibold shadow-xs'
                          : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                      } ${isCollapsed ? 'justify-center px-2' : ''}`}
                    >
                      <Icon
                        size={21}
                        strokeWidth={1.8}
                        className={`shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                          isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-white'
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="truncate flex-1 text-left font-medium tracking-tight">
                          {item.label}
                        </span>
                      )}
                      {!isCollapsed && item.badge && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                            item.badge === 'HOT'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : item.badge === 'ALERT'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer User Card */}
        <div className="p-3 border-t border-slate-800 bg-[#0F172A]">
          {!isCollapsed ? (
            <div className="flex items-center p-2 bg-slate-800/50 rounded-lg border border-slate-800/80">
              <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                {currentRole?.substring(0, 2).toUpperCase() || 'SA'}
              </div>
              <div className="ml-3 overflow-hidden text-ellipsis whitespace-nowrap min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{currentRole || 'Super Admin'}</p>
                <p className="text-[10px] text-slate-500 truncate">{brandSettings.businessName}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-emerald-400"
                title={currentRole}
              >
                {currentRole?.substring(0, 2).toUpperCase() || 'SA'}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
