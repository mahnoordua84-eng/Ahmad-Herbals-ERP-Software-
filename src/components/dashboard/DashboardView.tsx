import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Clock,
  Clock3,
  CheckCircle2,
  XCircle,
  Users,
  Package,
  AlertTriangle,
  TriangleAlert,
  Receipt,
  Wallet,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  Store,
  RotateCcw,
  Boxes,
  Banknote,
  ShoppingBag,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ModuleName } from '../../types/erp';

interface DashboardViewProps {
  onNavigate: (module: ModuleName) => void;
}

type PeriodOption =
  | 'Today'
  | 'Yesterday'
  | 'Last 7 Days'
  | 'Last 30 Days'
  | 'This Month'
  | 'Last Month'
  | 'This Year'
  | 'Custom';

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    brandSettings,
    orders = [],
    products = [],
    customers = [],
    expenses = [],
    purchases = [],
    paymentRecords = [],
    auditLogs = [],
    stockMovements = [],
    formatCurrency,
    t,
  } = useERP();

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('This Month');
  const [customStartDate, setCustomStartDate] = useState('2026-08-01');
  const [customEndDate, setCustomEndDate] = useState('2026-09-04');

  // Business Overview KPIs calculations
  const totalSales = useMemo(() => {
    return (orders || []).reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  const todaySales = useMemo(() => {
    const todayStr = '2026-09-04'; // Matches mock system time
    return (orders || [])
      .filter((o) => o.createdAt?.startsWith(todayStr))
      .reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  const monthlySales = useMemo(() => {
    return (orders || [])
      .filter((o) => o.createdAt?.includes('2026-09') || o.createdAt?.includes('2026-08'))
      .reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  const totalOrders = (orders || []).length;
  const pendingOrders = (orders || []).filter((o) => o.orderStatus === 'PENDING' || o.orderStatus === 'PROCESSING').length;
  const completedOrders = (orders || []).filter((o) => o.orderStatus === 'DELIVERED').length;
  const cancelledOrders = (orders || []).filter((o) => o.orderStatus === 'CANCELLED').length;

  const totalCustomers = (customers || []).length;
  const totalProducts = (products || []).length;
  const lowStockProducts = (products || []).filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= (p.minStock || 0)).length;
  const outOfStockProducts = (products || []).filter((p) => (p.stock || 0) <= 0).length;

  const totalExpenses = useMemo(() => {
    return (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [expenses]);

  // COGS and Profit calculations (Requirement #20)
  // Revenue - Discounts - Returns = Net Sales
  // Net Sales - Cost of Goods Sold = Gross Profit
  // Gross Profit - Expenses = Net Profit
  const { cogs, grossProfit, netProfit } = useMemo(() => {
    let calculatedCOGS = 0;
    (orders || []).forEach((o) => {
      (o.items || []).forEach((item) => {
        calculatedCOGS += (item.purchasePrice || item.price * 0.65) * item.quantity;
      });
    });

    const netSales = totalSales;
    const gProfit = Math.max(0, netSales - calculatedCOGS);
    const nProfit = gProfit - totalExpenses;
    return { cogs: calculatedCOGS, grossProfit: gProfit, netProfit: nProfit };
  }, [orders, totalSales, totalExpenses]);

  // Chart Data: Monthly Revenue & Trend
  const monthlyRevenueData = [
    { month: 'Mar', sales: 180000, expenses: 95000, profit: 85000 },
    { month: 'Apr', sales: 245000, expenses: 110000, profit: 135000 },
    { month: 'May', sales: 310000, expenses: 130000, profit: 180000 },
    { month: 'Jun', sales: 290000, expenses: 125000, profit: 165000 },
    { month: 'Jul', sales: 380000, expenses: 160000, profit: 220000 },
    { month: 'Aug', sales: 465000, expenses: 195000, profit: 270000 },
    { month: 'Sep (MTD)', sales: 145000, expenses: 65000, profit: 80000 },
  ];

  // Category sales share
  const categoryData = [
    { name: 'Flours (Atta)', value: 45, color: '#15803d' },
    { name: 'Super Seeds', value: 25, color: '#0284c7' },
    { name: 'Dry Fruits & Nuts', value: 20, color: '#b45309' },
    { name: 'Herbal Oils & Honey', value: 10, color: '#7c3aed' },
  ];

  // Top Products
  const topProducts = [
    { name: '7-Grains Multi Grains Flour (Atta)', sales: 'Rs. 185,000', units: 310, margin: '35%' },
    { name: 'Organic Black Chia Seeds', sales: 'Rs. 98,500', units: 145, margin: '42%' },
    { name: 'Northern Kaghan Valley Walnuts', sales: 'Rs. 84,200', units: 62, margin: '33%' },
    { name: 'Barley Flour (Jau Ka Atta)', sales: 'Rs. 62,400', units: 180, margin: '38%' },
    { name: 'Cold-Pressed Kalonji Black Seed Oil', sales: 'Rs. 45,900', units: 75, margin: '40%' },
  ];

  const periods: PeriodOption[] = [
    'Today',
    'Yesterday',
    'Last 7 Days',
    'Last 30 Days',
    'This Month',
    'Last Month',
    'This Year',
    'Custom',
  ];

  return (
    <div id="dashboard-view" className="space-y-6 pb-12">
      {/* Top Header & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            System Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enterprise Performance Analytics for{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {brandSettings.businessName}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Actions */}
          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
          >
            + Create Order
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
          >
            Export Report
          </button>

          {/* Date Period Filter Bar (Requirement #2) */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            {periods.map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  selectedPeriod === period
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker when selected */}
      {selectedPeriod === 'Custom' && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/20 animate-in fade-in">
          <Calendar className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            Date Range:
          </span>
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
      )}

      {/* Executive KPI Grid - 10 Professional Cards with Dedicated Icons (Requirement #3) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* 1. Total Sales -> Icon: Banknote */}
        <div
          onClick={() => onNavigate('orders')}
          className="group bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 dark:bg-slate-900 dark:border-slate-800 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Banknote className="h-5 w-5" strokeWidth={2} />
            </div>
            <span className="text-emerald-600 bg-emerald-50 text-[10px] font-bold px-2 py-0.5 rounded dark:bg-emerald-950/50 dark:text-emerald-400">
              ↑ 12.5%
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Sales
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalSales)}
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400 font-medium">vs last month</p>
        </div>

        {/* 2. Orders -> Icon: ShoppingCart */}
        <div
          onClick={() => onNavigate('orders')}
          className="group bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 dark:bg-slate-900 dark:border-slate-800 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <ShoppingCart className="h-5 w-5" strokeWidth={2} />
            </div>
            <span className="text-blue-600 bg-blue-50 text-[10px] font-bold px-2 py-0.5 rounded dark:bg-blue-950/50 dark:text-blue-400">
              ↑ 8.4%
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Orders
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalOrders}
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400 font-medium">{pendingOrders} pending dispatch</p>
        </div>

        {/* 3. Customers -> Icon: Users */}
        <div
          onClick={() => onNavigate('customers')}
          className="group bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-purple-300 dark:bg-slate-900 dark:border-slate-800 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2.5">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <Users className="h-5 w-5" strokeWidth={2} />
            </div>
            <span className="text-purple-600 bg-purple-50 text-[10px] font-bold px-2 py-0.5 rounded dark:bg-purple-950/50 dark:text-purple-400">
              ↑ 15.2%
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Customers
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalCustomers}
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400 font-medium">Active client accounts</p>
        </div>

        {/* 4. Products -> Icon: Package */}
        <div
          onClick={() => onNavigate('products')}
          className="group bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 dark:bg-slate-900 dark:border-slate-800 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2.5">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Package className="h-5 w-5" strokeWidth={2} />
            </div>
            <span className="text-amber-600 bg-amber-50 text-[10px] font-bold px-2 py-0.5 rounded dark:bg-amber-950/50 dark:text-amber-400">
              Active SKU
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Products
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalProducts}
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400 font-medium">Catalog SKUs & Variations</p>
        </div>

        {/* 5. Inventory -> Icon: Boxes */}
        <div
          onClick={() => onNavigate('inventory')}
          className="group bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 dark:bg-slate-900 dark:border-slate-800 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2.5">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
              <Boxes className="h-5 w-5" strokeWidth={2} />
            </div>
            <span className="text-teal-600 bg-teal-50 text-[10px] font-bold px-2 py-0.5 rounded dark:bg-teal-950/50 dark:text-teal-400">
              Healthy
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Inventory
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {(products || []).reduce((s, p) => s + (p.stock || 0), 0)}
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400 font-medium">Total physical units</p>
        </div>

        {/* 6. Purchases -> Icon: ShoppingBag */}
        <div
          onClick={() => onNavigate('purchases')}
          className="group bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 dark:bg-slate-900 dark:border-slate-800 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <ShoppingBag className="h-5 w-5" strokeWidth={2} />
            </div>
            <span className="text-indigo-600 bg-indigo-50 text-[10px] font-bold px-2 py-0.5 rounded dark:bg-indigo-950/50 dark:text-indigo-400">
              Procured
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Purchases
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency((purchases || []).reduce((s, p) => s + (p.total || 0), 0))}
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400 font-medium">{(purchases || []).length} supplier invoices</p>
        </div>

        {/* 7. Expenses -> Icon: Wallet */}
        <div
          onClick={() => onNavigate('expenses')}
          className="group bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-300 dark:bg-slate-900 dark:border-slate-800 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2.5">
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <Wallet className="h-5 w-5" strokeWidth={2} />
            </div>
            <span className="text-rose-600 bg-rose-50 text-[10px] font-bold px-2 py-0.5 rounded dark:bg-rose-950/50 dark:text-rose-400">
              ↓ 4.2%
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Expenses
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalExpenses)}
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400 font-medium">Operational & Packaging</p>
        </div>

        {/* 8. Profit -> Icon: TrendingUp */}
        <div
          onClick={() => onNavigate('accounting')}
          className="group bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-400 dark:bg-slate-900 dark:border-slate-800 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" strokeWidth={2} />
            </div>
            <span className="text-emerald-600 bg-emerald-50 text-[10px] font-bold px-2 py-0.5 rounded dark:bg-emerald-950/50 dark:text-emerald-400">
              ↑ 18.0%
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Profit
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(netProfit > 0 ? netProfit : grossProfit - totalExpenses)}
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400 font-medium">Net profit after all costs</p>
        </div>

        {/* 9. Low Stock -> Icon: TriangleAlert */}
        <div
          onClick={() => onNavigate('inventory')}
          className="group bg-white p-4 rounded-xl border border-amber-200 shadow-xs hover:border-amber-400 dark:bg-slate-900 dark:border-amber-900/40 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2.5">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <TriangleAlert className="h-5 w-5" strokeWidth={2} />
            </div>
            <span className="text-amber-700 bg-amber-100/80 text-[10px] font-bold px-2 py-0.5 rounded dark:bg-amber-950 dark:text-amber-300">
              {lowStockProducts > 0 ? 'Action Req.' : 'Safe'}
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Low Stock
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
            {lowStockProducts}
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400 font-medium">Below min reorder level</p>
        </div>

        {/* 10. Pending Payments -> Icon: Clock3 */}
        <div
          onClick={() => onNavigate('payments')}
          className="group bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-orange-300 dark:bg-slate-900 dark:border-slate-800 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2.5">
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
              <Clock3 className="h-5 w-5" strokeWidth={2} />
            </div>
            <span className="text-orange-600 bg-orange-50 text-[10px] font-bold px-2 py-0.5 rounded dark:bg-orange-950/50 dark:text-orange-400">
              Khata Due
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Pending Payments
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(
              (customers || []).reduce((acc, c) => acc + (c.outstandingBalance || 0), 0)
            )}
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400 font-medium">Customer dues & receivables</p>
        </div>
      </div>

      {/* Main Charts & Stock Row: Sales Trend + Recent Stock Movements */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales Performance vs Expenses Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-2">
            <span className="font-bold text-slate-800 text-sm dark:text-slate-100">
              Sales Performance vs Expenses
            </span>
            <div className="flex items-center space-x-4 text-[10px] font-bold text-slate-500 uppercase">
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 inline-block"></span>
                Revenue
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-red-400 mr-1.5 inline-block"></span>
                Expenses
              </span>
            </div>
          </div>

          <div className="p-5 flex-1 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415518" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} stroke="#94a3b8" />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(val), '']}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Sales Revenue"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="Operating Expenses"
                  stroke="#f87171"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#expenseGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Stock Movements Table (Professional Polish Theme) */}
        <div className="col-span-1 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="font-bold text-slate-800 text-sm dark:text-slate-100">
              Recent Stock Movements
            </span>
            <span className="text-xs text-slate-400">Real-time</span>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[10px] text-slate-400 uppercase tracking-wider">
                  <th className="p-3 font-semibold">Item</th>
                  <th className="p-3 font-semibold">Qty</th>
                  <th className="p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800">
                {(stockMovements && stockMovements.length > 0 ? stockMovements.slice(0, 5) : [
                  { id: '1', productName: 'Organic Ispaghol Husk', quantity: 50, type: 'RESTOCK' },
                  { id: '2', productName: 'Black Seed Oil (Pure)', quantity: -12, type: 'SALE' },
                  { id: '3', productName: 'Moringa Powder 250g', quantity: -5, type: 'SALE' },
                  { id: '4', productName: 'Barley Flour 1kg', quantity: 40, type: 'RESTOCK' },
                ]).map((movement: any) => (
                  <tr key={movement.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                      {movement.productName || 'Organic Herb'}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                      {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                    </td>
                    <td className={`p-3 font-bold text-[10px] ${
                      movement.type === 'IN' || movement.type === 'RESTOCK'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {movement.type}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 text-center border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onNavigate('inventory')}
              className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hover:underline cursor-pointer"
            >
              View Full Inventory →
            </button>
          </div>
        </div>
      </div>

      {/* Analytics & Activity Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Category Share Donut Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Top Categories</h2>
            <span className="text-xs text-slate-400">By Sales Volume</span>
          </div>

          <div className="mt-4 h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val}%`, 'Share']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 space-y-2">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  ></span>
                  <span className="text-slate-600 dark:text-slate-400">{cat.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Top Products</h2>
            </div>
            <button
              onClick={() => onNavigate('products')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              All Products →
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            {topProducts.map((p, idx) => (
              <div key={p.name} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-slate-400">{p.units} units sold</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{p.sales}</p>
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    {p.margin} margin
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Admin & Operational Activity Feed (Requirement #46) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Activity</h2>
            </div>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              Audit Trail →
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {auditLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60"
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <ArrowUpRight className="h-3 w-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {log.action}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    By <span className="font-medium">{log.userName}</span> • {log.module}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
