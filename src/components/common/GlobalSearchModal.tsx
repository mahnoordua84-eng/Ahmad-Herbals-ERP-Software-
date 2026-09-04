import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Search,
  X,
  Package,
  ShoppingCart,
  Users,
  Building2,
  Receipt,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import { ModuleName } from '../../types/erp';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: ModuleName) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { products, orders, customers, suppliers, invoices, employees, formatCurrency } = useERP();
  const [searchTerm, setSearchTerm] = useState('');

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const query = searchTerm.toLowerCase().trim();

  const matchedProducts = query
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.barcode.includes(query)
      ).slice(0, 4)
    : [];

  const matchedOrders = query
    ? orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(query) ||
          o.customerName.toLowerCase().includes(query)
      ).slice(0, 4)
    : [];

  const matchedCustomers = query
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.phone.includes(query) ||
          c.email.toLowerCase().includes(query)
      ).slice(0, 4)
    : [];

  const matchedSuppliers = query
    ? suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.company.toLowerCase().includes(query) ||
          s.phone.includes(query)
      ).slice(0, 4)
    : [];

  const matchedInvoices = query
    ? invoices.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(query) ||
          i.customerName.toLowerCase().includes(query)
      ).slice(0, 4)
    : [];

  const matchedEmployees = query
    ? employees.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.department.toLowerCase().includes(query) ||
          e.designation.toLowerCase().includes(query)
      ).slice(0, 4)
    : [];

  const totalResults =
    matchedProducts.length +
    matchedOrders.length +
    matchedCustomers.length +
    matchedSuppliers.length +
    matchedInvoices.length +
    matchedEmployees.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div
        id="global-search-dialog"
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-all"
      >
        {/* Search Header Bar */}
        <div className="flex items-center border-b border-slate-200 px-4 dark:border-slate-800">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products, orders, customers, suppliers, invoices, staff..."
            className="h-14 w-full bg-transparent px-3 text-sm text-slate-900 outline-hidden placeholder:text-slate-400 dark:text-slate-100"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-2 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
          >
            ESC
          </button>
        </div>

        {/* Search Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query && (
            <div className="py-8 text-center text-xs text-slate-400">
              Type anything to search across the entire ERP enterprise database...
            </div>
          )}

          {query && totalResults === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching records found for "{searchTerm}".
            </div>
          )}

          {/* Products */}
          {matchedProducts.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <Package className="h-3.5 w-3.5" />
                <span>Products ({matchedProducts.length})</span>
              </div>
              <div className="space-y-1">
                {matchedProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onNavigate('products');
                      onClose();
                    }}
                    className="flex items-center justify-between rounded-xl p-2.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</p>
                      <p className="text-[11px] text-slate-500">
                        SKU: {p.sku} • Stock: {p.stock} {p.unit}
                      </p>
                    </div>
                    <span className="font-bold text-emerald-600">{formatCurrency(p.salePrice)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders */}
          {matchedOrders.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Orders ({matchedOrders.length})</span>
              </div>
              <div className="space-y-1">
                {matchedOrders.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => {
                      onNavigate('orders');
                      onClose();
                    }}
                    className="flex items-center justify-between rounded-xl p-2.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {o.orderNumber} • {o.customerName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Status: {o.orderStatus} • Channel: {o.channel}
                      </p>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(o.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {matchedCustomers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <Users className="h-3.5 w-3.5" />
                <span>Customers ({matchedCustomers.length})</span>
              </div>
              <div className="space-y-1">
                {matchedCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onNavigate('customers');
                      onClose();
                    }}
                    className="flex items-center justify-between rounded-xl p-2.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {c.phone} • {c.city} • Tier: {c.type}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suppliers */}
          {matchedSuppliers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <Building2 className="h-3.5 w-3.5" />
                <span>Suppliers ({matchedSuppliers.length})</span>
              </div>
              <div className="space-y-1">
                {matchedSuppliers.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      onNavigate('suppliers');
                      onClose();
                    }}
                    className="flex items-center justify-between rounded-xl p-2.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {s.company} ({s.name})
                      </p>
                      <p className="text-[11px] text-slate-500">{s.phone}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices */}
          {matchedInvoices.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <Receipt className="h-3.5 w-3.5" />
                <span>Invoices ({matchedInvoices.length})</span>
              </div>
              <div className="space-y-1">
                {matchedInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      onNavigate('invoices');
                      onClose();
                    }}
                    className="flex items-center justify-between rounded-xl p-2.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {inv.invoiceNumber} • {inv.customerName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Date: {inv.date} • {inv.paymentStatus}
                      </p>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(inv.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employees */}
          {matchedEmployees.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <UserCheck className="h-3.5 w-3.5" />
                <span>Staff & Employees ({matchedEmployees.length})</span>
              </div>
              <div className="space-y-1">
                {matchedEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => {
                      onNavigate('employees');
                      onClose();
                    }}
                    className="flex items-center justify-between rounded-xl p-2.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{emp.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {emp.designation} • Dept: {emp.department}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
