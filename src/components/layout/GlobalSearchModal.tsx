import React, { useState, useEffect, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Search,
  Package,
  Users,
  ShoppingCart,
  Receipt,
  Users2,
  Boxes,
  ArrowRight,
  X,
  Command,
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
  const { products, customers, orders, suppliers, formatCurrency } = useERP();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // Toggle or open
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

  const searchResults = useMemo(() => {
    if (!query.trim()) return { products: [], customers: [], orders: [], suppliers: [] };
    const q = query.toLowerCase();

    return {
      products: products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            (p.barcode && p.barcode.includes(q))
        )
        .slice(0, 4),
      customers: customers
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            (c.email && c.email.toLowerCase().includes(q))
        )
        .slice(0, 3),
      orders: orders
        .filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(q) ||
            o.customerName.toLowerCase().includes(q)
        )
        .slice(0, 3),
      suppliers: suppliers
        .filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.phone.includes(q) ||
            s.city.toLowerCase().includes(q)
        )
        .slice(0, 3),
    };
  }, [query, products, customers, orders, suppliers]);

  if (!isOpen) return null;

  return (
    <div
      id="global-search-modal"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-slate-950/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-slate-200 px-4 dark:border-slate-800">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, orders, customers, suppliers across Ahmad Herbals..."
            className="h-14 w-full bg-transparent px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
          />
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query.trim() ? (
            <div className="py-8 text-center">
              <Command className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Quick Navigation & Deep Search
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Type an item name, SKU, customer phone, receipt number or supplier name.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                {[
                  { label: 'POS Terminal', mod: 'pos' },
                  { label: 'Products Catalog', mod: 'products' },
                  { label: 'Sales Orders', mod: 'orders' },
                  { label: 'Inventory Stock', mod: 'inventory' },
                  { label: 'Khata Ledgers', mod: 'customers' },
                  { label: 'Profit & Loss', mod: 'accounting' },
                ].map((s) => (
                  <button
                    key={s.mod}
                    onClick={() => {
                      onNavigate(s.mod as ModuleName);
                      onClose();
                    }}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Products */}
              {searchResults.products.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-emerald-600" />
                    Products & Herbs
                  </span>
                  <div className="mt-2 space-y-1">
                    {searchResults.products.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onNavigate('products');
                          onClose();
                        }}
                        className="flex items-center justify-between rounded-xl p-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                            {p.sku.slice(0, 3)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {p.name}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              SKU: {p.sku} • Stock: {p.stock} {p.unit}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(p.sellingPrice)}
                          </p>
                          <span className="text-[10px] text-slate-400">{p.categoryName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customers */}
              {searchResults.customers.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-blue-600" />
                    Customers & Khata Ledgers
                  </span>
                  <div className="mt-2 space-y-1">
                    {searchResults.customers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onNavigate('customers');
                          onClose();
                        }}
                        className="flex items-center justify-between rounded-xl p-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {c.name}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {c.phone} • {c.city || 'Pakistan'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-xs font-bold ${
                              c.creditBalance > 0
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-600'
                            }`}
                          >
                            Due: {formatCurrency(c.creditBalance)}
                          </p>
                          <span className="text-[10px] text-slate-400">{c.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Orders */}
              {searchResults.orders.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingCart className="h-3.5 w-3.5 text-amber-600" />
                    Orders & Invoices
                  </span>
                  <div className="mt-2 space-y-1">
                    {searchResults.orders.map((o) => (
                      <div
                        key={o.id}
                        onClick={() => {
                          onNavigate('orders');
                          onClose();
                        }}
                        className="flex items-center justify-between rounded-xl p-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {o.orderNumber}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {o.customerName} • {o.orderDate}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {formatCurrency(o.totalAmount)}
                          </p>
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold dark:bg-slate-800">
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suppliers */}
              {searchResults.suppliers.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users2 className="h-3.5 w-3.5 text-purple-600" />
                    Wholesale Suppliers
                  </span>
                  <div className="mt-2 space-y-1">
                    {searchResults.suppliers.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          onNavigate('suppliers');
                          onClose();
                        }}
                        className="flex items-center justify-between rounded-xl p-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {s.name}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {s.contactPerson} • {s.city}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-rose-600">
                            Due: {formatCurrency(s.outstandingBalance)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-2 text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-800/50">
          <span>Press ESC to close</span>
          <span>Ahmad Herbals Global Search</span>
        </div>
      </div>
    </div>
  );
};
