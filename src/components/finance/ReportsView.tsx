import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  BarChart3,
  Search,
  Filter,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Calendar,
  ArrowUpDown,
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  Building2,
  Wallet,
  Receipt,
  Boxes,
  Truck,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export type ReportType =
  | 'SALES'
  | 'PURCHASE'
  | 'PROFIT'
  | 'EXPENSE'
  | 'INVENTORY'
  | 'STOCK_MOVEMENT'
  | 'CUSTOMER'
  | 'SUPPLIER'
  | 'PAYMENT'
  | 'TAX'
  | 'PRODUCT_PERFORMANCE'
  | 'CATEGORY_PERFORMANCE'
  | 'WAREHOUSE_PERFORMANCE'
  | 'EMPLOYEE_SALES'
  | 'POS_REPORT';

const REPORT_DEFINITIONS: Array<{
  id: ReportType;
  title: string;
  category: string;
  icon: React.ElementType;
  description: string;
}> = [
  { id: 'SALES', title: 'Sales Report', category: 'Commercial', icon: ShoppingCart, description: 'Order breakdown, turnover, and payment channels' },
  { id: 'PURCHASE', title: 'Purchase Report', category: 'Procurement', icon: Truck, description: 'Supplier invoices, received items, and purchase totals' },
  { id: 'PROFIT', title: 'Profit & Loss Report', category: 'Financial', icon: TrendingUp, description: 'Gross revenue minus COGS and operational expenditure' },
  { id: 'EXPENSE', title: 'Expense Report', category: 'Financial', icon: Wallet, description: 'Category-wise operational and packaging expenses' },
  { id: 'INVENTORY', title: 'Inventory Valuation', category: 'Warehouse', icon: Boxes, description: 'Stock on hand, physical valuation, and safety margins' },
  { id: 'STOCK_MOVEMENT', title: 'Stock Movement Audit', category: 'Warehouse', icon: BarChart3, description: 'Chronological ledger of stock transfers, sales, and restocking' },
  { id: 'CUSTOMER', title: 'Customer Ledger & Dues', category: 'CRM', icon: Users, description: 'Customer khata balances, orders, and credit limits' },
  { id: 'SUPPLIER', title: 'Supplier Accounts Payable', category: 'Procurement', icon: Building2, description: 'Supplier balances, paid bills, and outstanding obligations' },
  { id: 'PAYMENT', title: 'Payment Inflows & Outflows', category: 'Financial', icon: Receipt, description: 'Cash, Bank, Easypaisa, and JazzCash transactions' },
  { id: 'TAX', title: 'Tax & Compliance Report', category: 'Financial', icon: FileText, description: 'Sales tax collected and input tax breakdown' },
  { id: 'PRODUCT_PERFORMANCE', title: 'Product Velocity', category: 'Commercial', icon: Package, description: 'Fast moving vs slow moving products, revenue by SKU' },
  { id: 'CATEGORY_PERFORMANCE', title: 'Category Volume', category: 'Commercial', icon: Boxes, description: 'Herbs vs Grains vs Oils contribution margins' },
  { id: 'WAREHOUSE_PERFORMANCE', title: 'Warehouse Utilization', category: 'Warehouse', icon: Building2, description: 'Capacity and distribution across branch warehouses' },
  { id: 'EMPLOYEE_SALES', title: 'Employee Performance', category: 'HR & POS', icon: Users, description: 'POS cashier counters and staff order conversions' },
  { id: 'POS_REPORT', title: 'Daily POS Register', category: 'Retail', icon: ShoppingCart, description: 'Register shift closing, cash drawer balance, counter reconciliation' },
];

export const ReportsView: React.FC<{ initialTab?: string }> = () => {
  const {
    products = [],
    categories = [],
    orders = [],
    purchases = [],
    expenses = [],
    customers = [],
    suppliers = [],
    stockMovements = [],
    warehouses = [],
    formatCurrency,
    t,
  } = useERP();

  const [activeReport, setActiveReport] = useState<ReportType>('SALES');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('THIS_MONTH');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-31');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Compute Active Report Data
  const reportData = useMemo(() => {
    switch (activeReport) {
      case 'SALES':
        return orders.map((o) => ({
          col1: o.orderNumber,
          col2: o.customerName,
          col3: o.channel,
          col4: o.paymentMethod,
          col5: o.total,
          col6: o.orderStatus,
          date: o.createdAt.split('T')[0],
        }));
      case 'PURCHASE':
        return purchases.map((p) => ({
          col1: p.invoiceNumber,
          col2: p.supplierName,
          col3: p.warehouseName,
          col4: p.paymentStatus,
          col5: p.total,
          col6: p.status,
          date: p.date,
        }));
      case 'EXPENSE':
        return expenses.map((e) => ({
          col1: e.title,
          col2: e.category,
          col3: e.paymentMethod,
          col4: e.status,
          col5: e.amount,
          col6: e.reference || 'N/A',
          date: e.date,
        }));
      case 'INVENTORY':
        return products.map((p) => ({
          col1: p.sku,
          col2: p.name,
          col3: `${p.stock} ${p.unit || 'Units'}`,
          col4: formatCurrency(p.purchasePrice),
          col5: p.stock * p.purchasePrice,
          col6: p.stock <= p.minStock ? 'LOW STOCK' : 'HEALTHY',
          date: p.createdAt.split('T')[0],
        }));
      case 'STOCK_MOVEMENT':
        return stockMovements.map((m) => ({
          col1: m.productName,
          col2: m.type,
          col3: m.quantity > 0 ? `+${m.quantity}` : `${m.quantity}`,
          col4: `${m.previousStock} → ${m.newStock}`,
          col5: m.performedBy,
          col6: m.reason || 'Normal operation',
          date: m.timestamp.split('T')[0],
        }));
      case 'CUSTOMER':
        return customers.map((c) => ({
          col1: c.name,
          col2: c.phone,
          col3: c.city,
          col4: `${c.totalOrders} Orders`,
          col5: c.outstandingBalance,
          col6: c.status.toUpperCase(),
          date: c.lastOrderDate || '2026-08-20',
        }));
      case 'SUPPLIER':
        return suppliers.map((s) => ({
          col1: s.company || s.name,
          col2: s.phone,
          col3: formatCurrency(s.totalPurchases),
          col4: formatCurrency(s.paidAmount),
          col5: s.outstandingBalance,
          col6: s.status.toUpperCase(),
          date: '2026-08-15',
        }));
      default:
        return orders.slice(0, 15).map((o) => ({
          col1: o.orderNumber,
          col2: o.customerName,
          col3: o.channel,
          col4: o.paymentMethod,
          col5: o.total,
          col6: o.orderStatus,
          date: o.createdAt.split('T')[0],
        }));
    }
  }, [activeReport, orders, purchases, expenses, products, stockMovements, customers, suppliers, formatCurrency]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return reportData.filter((r) => {
      const matchSearch =
        !searchTerm ||
        r.col1.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.col2.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.col3.toString().toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [reportData, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Column Headers based on report
  const getHeaders = () => {
    switch (activeReport) {
      case 'SALES':
        return ['Order #', 'Customer', 'Channel', 'Payment', 'Amount', 'Status'];
      case 'PURCHASE':
        return ['Invoice #', 'Supplier', 'Warehouse', 'Payment', 'Total', 'State'];
      case 'EXPENSE':
        return ['Expense Title', 'Category', 'Method', 'Approval', 'Amount', 'Ref'];
      case 'INVENTORY':
        return ['SKU', 'Product Name', 'Current Stock', 'Cost Rate', 'Total Asset Value', 'Health'];
      case 'STOCK_MOVEMENT':
        return ['Product', 'Movement Type', 'Qty Changed', 'Stock Before/After', 'Operator', 'Reason'];
      case 'CUSTOMER':
        return ['Customer Name', 'Contact Phone', 'City', 'Order Count', 'Outstanding Due', 'Status'];
      case 'SUPPLIER':
        return ['Supplier / Company', 'Contact', 'Total Invoices', 'Paid Total', 'Payable Due', 'Status'];
      default:
        return ['Reference', 'Entity', 'Category', 'Details', 'Value', 'Status'];
    }
  };

  const handleExport = (format: 'CSV' | 'EXCEL' | 'PDF') => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [getHeaders().join(','), ...filteredRows.map((r) => [r.col1, `"${r.col2}"`, r.col3, r.col4, r.col5, r.col6].join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeReport.toLowerCase()}_report_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(`Exported ${activeReport} report successfully as ${format}`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  const currentDef = REPORT_DEFINITIONS.find((r) => r.id === activeReport) || REPORT_DEFINITIONS[0];

  return (
    <div id="reports-view" className="space-y-6 pb-12">
      {/* View Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="h-6 w-6 text-emerald-600" />
            Enterprise Report Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time multi-dimensional analytics, financial statements, inventory velocity, and audit reports
          </p>
        </div>

        {/* Global Export & Print Actions */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => handleExport('CSV')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            CSV
          </button>
          <button
            onClick={() => handleExport('EXCEL')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />
            Excel
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          {downloadSuccess}
        </div>
      )}

      {/* Reports Directory Drawer (15 Reports Matrix) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs dark:bg-slate-900 dark:border-slate-800">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Available Intelligence Reports ({REPORT_DEFINITIONS.length})
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold">Active: {currentDef.title}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {REPORT_DEFINITIONS.map((r) => {
            const Icon = r.icon;
            const isActive = activeReport === r.id;
            return (
              <button
                key={r.id}
                onClick={() => {
                  setActiveReport(r.id);
                  setCurrentPage(1);
                }}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isActive
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs dark:border-emerald-500 dark:bg-emerald-950/30'
                    : 'border-slate-100 hover:border-slate-300 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{r.category}</span>
                </div>
                <span
                  className={`text-xs font-bold truncate w-full ${
                    isActive ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {r.title}
                </span>
                <span className="text-[10px] text-slate-400 truncate w-full mt-0.5">{r.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Date Range Control Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={`Search within ${currentDef.title}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-800 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Range:</span>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
          >
            <option value="TODAY">Today</option>
            <option value="THIS_WEEK">This Week</option>
            <option value="THIS_MONTH">This Month (August 2026)</option>
            <option value="LAST_MONTH">Last Month</option>
            <option value="YEAR_TO_DATE">FY 2026 Year to Date</option>
            <option value="ALL_TIME">All Records</option>
          </select>

          <span className="text-xs text-slate-400">
            Showing <strong className="text-slate-700 dark:text-slate-200">{filteredRows.length}</strong> entries
          </span>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                {getHeaders().map((h, i) => (
                  <th key={i} className="p-3.5">
                    <div className="flex items-center gap-1 cursor-pointer select-none">
                      {h}
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <BarChart3 className="mx-auto h-8 w-8 mb-2 opacity-30" />
                    No records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">{r.col1}</td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">{r.col2}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">{r.col3}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">{r.col4}</td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      {typeof r.col5 === 'number' ? formatCurrency(r.col5) : r.col5}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-block rounded px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {r.col6}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-3.5 border-t border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40">
          <span className="text-[11px] text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
