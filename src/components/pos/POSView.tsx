import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Printer,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  X,
  User,
  Tag,
  PauseCircle,
  PlayCircle,
  UserPlus,
  History,
  Wifi,
  WifiOff,
  RefreshCw,
  LayoutGrid,
  List,
  ShoppingBag,
  Check,
  Truck,
  Building2,
  QrCode,
  ArrowRight,
  Clock,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { OrderItem, Product, Order, Invoice } from '../../types/erp';
import { printService } from '../../services/printService';
import { posOfflineDB } from '../../services/posOfflineDB';

interface HeldOrder {
  id: string;
  items: OrderItem[];
  customerId: string;
  customerName: string;
  discountAmount: number;
  taxPercent: number;
  shippingFee: number;
  timestamp: string;
  notes?: string;
}

export const POSView: React.FC = () => {
  const {
    products,
    categories,
    brands,
    customers,
    warehouses,
    orders,
    addCustomer,
    posCheckout,
    syncOfflineSales,
    pendingOfflineCount,
    isOnline,
    formatCurrency,
    brandSettings,
    currentRole,
  } = useERP();

  // Mobile navigation tab: 'products' | 'invoice'
  const [activeMobileTab, setActiveMobileTab] = useState<'products' | 'invoice'>('products');

  // Left Column (Products) State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [quickStockFilter, setQuickStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK'>('ALL');

  // Right Column (Invoice / Bill) State
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-walkin');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouses[0]?.id || 'wh-main');
  const [orderNotes, setOrderNotes] = useState('');

  // Bill Totals State
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'PKR' | 'PERCENT'>('PKR');
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(0);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [cashTendered, setCashTendered] = useState<number>(0);

  // QR / Barcode Scan Modal
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodeQuery, setBarcodeQuery] = useState('');

  // Other Existing Functionality
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('0300-');
  const [newCustCity, setNewCustCity] = useState('Lahore');
  const [newCustAddress, setNewCustAddress] = useState('');

  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [actionToast, setActionToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeScanInputRef = useRef<HTMLInputElement>(null);

  // Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  const draftInvoiceNumber = useMemo(() => {
    const dStr = currentTime.toISOString().slice(2, 10).replace(/-/g, '');
    const seq = (orders.length + 1).toString().padStart(4, '0');
    return `INV-${dStr}-${seq}`;
  }, [currentTime, orders.length]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setActionToast({ msg, type });
    setTimeout(() => setActionToast(null), 3200);
  };

  // Load and save held orders via posOfflineDB
  useEffect(() => {
    posOfflineDB.getHeldOrders().then((saved) => {
      if (saved && saved.length > 0) setHeldOrders(saved as any);
      else {
        try {
          const l = localStorage.getItem('ahmad_pos_held_orders');
          if (l) setHeldOrders(JSON.parse(l));
        } catch {
          // ignore
        }
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    posOfflineDB.saveAllHeldOrders(heldOrders as any).catch(() => {});
    try {
      localStorage.setItem('ahmad_pos_held_orders', JSON.stringify(heldOrders));
    } catch {
      // ignore
    }
  }, [heldOrders]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setIsBarcodeModalOpen(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleHoldSale();
      } else if (e.key === 'F8') {
        e.preventDefault();
        setIsHeldModalOpen((prev) => !prev);
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) {
          handleExecuteCheckout();
        } else {
          showToast('Invoice is empty. Select products first.', 'info');
        }
      } else if (e.key === 'Escape') {
        setIsBarcodeModalOpen(false);
        setIsHeldModalOpen(false);
        setIsNewCustomerModalOpen(false);
        setIsHistoryDrawerOpen(false);
        setIsReceiptModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, heldOrders, selectedCustomerId, discountAmount]);

  // Filter Active Products on Left
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.status === 'ARCHIVED' || p.status === 'INACTIVE') return false;

      if (selectedCategory !== 'ALL' && p.categoryId !== selectedCategory) return false;
      if (selectedBrand !== 'ALL' && p.brandId !== selectedBrand) return false;

      if (quickStockFilter === 'IN_STOCK' && p.stock <= 0) return false;
      if (quickStockFilter === 'LOW_STOCK' && (p.stock <= 0 || p.stock > 10)) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(query);
        const matchSku = p.sku.toLowerCase().includes(query);
        const matchBarcode = p.barcode ? p.barcode.toLowerCase().includes(query) : false;
        return matchName || matchSku || matchBarcode;
      }

      return true;
    });
  }, [products, selectedCategory, selectedBrand, quickStockFilter, searchTerm]);

  // Active Customer
  const activeCustomer = useMemo(() => {
    return (
      customers.find((c) => c.id === selectedCustomerId) || {
        id: 'cust-walkin',
        name: 'Walk-in Customer',
        phone: 'In-store',
        city: 'Lahore',
      }
    );
  }, [customers, selectedCustomerId]);

  // Bill Totals Calculation
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.total || 0), 0);
  }, [cart]);

  const calculatedDiscount = useMemo(() => {
    if (discountType === 'PERCENT') {
      return Math.round((subtotal * Math.max(0, discountAmount)) / 100);
    }
    return Math.min(subtotal, Math.max(0, discountAmount));
  }, [subtotal, discountType, discountAmount]);

  const taxAmount = useMemo(() => {
    const taxable = Math.max(0, subtotal - calculatedDiscount);
    return Math.round((taxable * taxPercent) / 100);
  }, [subtotal, calculatedDiscount, taxPercent]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - calculatedDiscount + taxAmount + (shippingFee || 0));
  }, [subtotal, calculatedDiscount, taxAmount, shippingFee]);

  // Keep Cash Tendered synced if not set or exact
  useEffect(() => {
    if (cashTendered === 0 || cashTendered < grandTotal) {
      setCashTendered(grandTotal);
    }
  }, [grandTotal]);

  const dueAmount = useMemo(() => {
    if (paymentMethod === 'CREDIT') return grandTotal;
    return Math.max(0, grandTotal - (cashTendered || 0));
  }, [paymentMethod, grandTotal, cashTendered]);

  const changeAmount = useMemo(() => {
    if (paymentMethod !== 'CASH') return 0;
    return Math.max(0, (cashTendered || 0) - grandTotal);
  }, [paymentMethod, cashTendered, grandTotal]);

  // =========================================================================
  // ACTIONS: INSTANT CLICK-TO-ADD PRODUCT TO INVOICE (NO CONFIRMATION / NO RELOAD)
  // =========================================================================
  const addToInvoice = (product: Product) => {
    if (product.stock <= 0) {
      showToast(`${product.name} is currently out of stock!`, 'error');
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex((it) => it.productId === product.id);
      if (existingIdx >= 0) {
        const item = prev[existingIdx];
        if (item.quantity >= product.stock) {
          showToast(`Maximum physical stock limit reached (${product.stock} ${product.unit}).`, 'error');
          return prev;
        }
        const updated = [...prev];
        const newQty = item.quantity + 1;
        const lineTotal = newQty * item.price - (item.discount || 0);
        updated[existingIdx] = {
          ...item,
          quantity: newQty,
          total: Math.max(0, lineTotal),
        };
        return updated;
      } else {
        const newItem: OrderItem = {
          productId: product.id,
          productName: product.name,
          productNameSnapshot: product.name,
          sku: product.sku,
          skuSnapshot: product.sku,
          quantity: 1,
          unit: product.unit || 'Pcs',
          unitPrice: product.salePrice,
          price: product.salePrice,
          purchasePrice: product.purchasePrice || product.salePrice * 0.65,
          discount: 0,
          tax: 0,
          total: product.salePrice,
        };
        return [newItem, ...prev];
      }
    });

    showToast(`Added: 1x ${product.name}`, 'info');
  };

  const updateItemQty = (productId: string, delta: number) => {
    const prod = products.find((p) => p.id === productId);
    setCart((prev) =>
      prev
        .map((it) => {
          if (it.productId === productId) {
            const nextQty = it.quantity + delta;
            if (prod && nextQty > prod.stock) {
              showToast(`Exceeds available stock of ${prod.stock} ${prod.unit}`, 'error');
              return it;
            }
            if (nextQty <= 0) return null;
            return {
              ...it,
              quantity: nextQty,
              total: Math.max(0, nextQty * it.price - (it.discount || 0)),
            };
          }
          return it;
        })
        .filter(Boolean) as OrderItem[]
    );
  };

  const setItemExactQty = (productId: string, qty: number) => {
    const prod = products.find((p) => p.id === productId);
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    if (prod && qty > prod.stock) {
      showToast(`Stock limit: ${prod.stock} ${prod.unit}`, 'error');
      qty = prod.stock;
    }
    setCart((prev) =>
      prev.map((it) =>
        it.productId === productId
          ? {
              ...it,
              quantity: qty,
              total: Math.max(0, qty * it.price - (it.discount || 0)),
            }
          : it
      )
    );
  };

  const updateItemDiscount = (productId: string, disc: number) => {
    setCart((prev) =>
      prev.map((it) => {
        if (it.productId === productId) {
          const validDisc = Math.max(0, Math.min(it.quantity * it.price, disc));
          return {
            ...it,
            discount: validDisc,
            total: Math.max(0, it.quantity * it.price - validDisc),
          };
        }
        return it;
      })
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((it) => it.productId !== productId));
  };

  const clearInvoice = () => {
    if (cart.length === 0) return;
    if (window.confirm('Clear all items from current bill?')) {
      setCart([]);
      setDiscountAmount(0);
      setTaxPercent(0);
      setShippingFee(0);
      setOrderNotes('');
      showToast('Bill cleared.', 'info');
    }
  };

  // Barcode / QR Lookup
  const handleBarcodeLookup = (code: string) => {
    const clean = code.trim().toLowerCase();
    if (!clean) return;
    const match = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === clean) ||
        (p.sku && p.sku.toLowerCase() === clean) ||
        p.id.toLowerCase() === clean
    );
    if (match) {
      addToInvoice(match);
      setBarcodeQuery('');
      setIsBarcodeModalOpen(false);
    } else {
      showToast(`No product matching barcode / QR: "${code}"`, 'error');
    }
  };

  // Park / Hold Sale
  const handleHoldSale = () => {
    if (cart.length === 0) {
      showToast('Invoice is empty. Nothing to park on hold.', 'info');
      return;
    }

    const held: HeldOrder = {
      id: `HOLD-${Date.now().toString().slice(-6)}`,
      items: [...cart],
      customerId: selectedCustomerId,
      customerName: activeCustomer.name,
      discountAmount: calculatedDiscount,
      taxPercent,
      shippingFee,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notes: orderNotes,
    };

    setHeldOrders((prev) => [held, ...prev]);
    setCart([]);
    setDiscountAmount(0);
    setTaxPercent(0);
    setShippingFee(0);
    setOrderNotes('');
    showToast('Sale parked on hold. Ready for next customer.', 'success');
  };

  const handleResumeSale = (held: HeldOrder) => {
    setCart(held.items);
    setSelectedCustomerId(held.customerId);
    setDiscountAmount(held.discountAmount);
    setDiscountType('PKR');
    setTaxPercent(held.taxPercent || 0);
    setShippingFee(held.shippingFee || 0);
    if (held.notes) setOrderNotes(held.notes);
    setHeldOrders((prev) => prev.filter((h) => h.id !== held.id));
    setIsHeldModalOpen(false);
    showToast(`Resumed sale for ${held.customerName}`, 'success');
  };

  // Quick Customer Registration
  const handleQuickCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      address: newCustAddress.trim(),
      city: newCustCity.trim() || 'Lahore',
      creditLimit: 50000,
    });

    showToast(`Customer "${newCustName.trim()}" registered & selected!`, 'success');
    setIsNewCustomerModalOpen(false);
    setNewCustName('');
    setNewCustPhone('0300-');
    setNewCustAddress('');
  };

  // Execute Real Complete Sale
  const handleExecuteCheckout = async () => {
    if (cart.length === 0) {
      showToast('Cannot complete an empty sale. Select products first.', 'error');
      return;
    }

    setIsSubmitting(true);
    const paid = paymentMethod === 'CREDIT' ? 0 : (cashTendered || grandTotal);

    try {
      const result = await posCheckout({
        customerId: selectedCustomerId,
        customerName: activeCustomer.name,
        customerPhone: activeCustomer.phone || 'In-store',
        items: cart,
        subtotal,
        discount: calculatedDiscount,
        tax: taxAmount,
        shipping: shippingFee,
        total: grandTotal,
        paymentMethod,
        paidAmount: paid,
        warehouseId: selectedWarehouseId,
        notes: orderNotes || `POS Retail Billing (${paymentMethod})`,
      });

      if (result.success && result.order) {
        setCompletedOrder(result.order);
        setCompletedInvoice(result.invoice);
        setIsReceiptModalOpen(true);

        // Reset right column bill
        setCart([]);
        setDiscountAmount(0);
        setTaxPercent(0);
        setShippingFee(0);
        setOrderNotes('');
        setCashTendered(0);

        if (result.isOffline) {
          showToast(`Offline Sale #${result.order.orderNumber} saved locally. Stock updated!`, 'info');
        } else {
          showToast(`Sale completed! Invoice #${result.invoice?.invoiceNumber || result.order.orderNumber} created.`, 'success');
        }
      }
    } catch (err: any) {
      console.error('POS Checkout Failed:', err);
      showToast(err.message || 'Failed to complete transaction', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncOfflineSales();
      if (res.syncedCount > 0) {
        showToast(`Synchronized ${res.syncedCount} offline transactions!`, 'success');
      } else {
        showToast('All offline transactions are up to date.', 'info');
      }
    } catch {
      showToast('Offline sync encountered an issue. Will retry.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div id="pos-billing-workspace" className="h-[calc(100vh-5rem)] flex flex-col overflow-hidden select-none bg-slate-100 dark:bg-slate-950 p-2 sm:p-3">
      {/* Toast notifications */}
      {actionToast && (
        <div
          className={`fixed top-14 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-2xl animate-in slide-in-from-top-2 ${
            actionToast.type === 'error'
              ? 'bg-rose-600'
              : actionToast.type === 'success'
              ? 'bg-emerald-600'
              : 'bg-slate-900 border border-slate-700'
          }`}
        >
          <span>{actionToast.msg}</span>
          <button onClick={() => setActionToast(null)} className="rounded p-0.5 hover:bg-white/20 ml-2">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Mobile Responsive Header Tab Switcher */}
      <div className="lg:hidden flex items-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 mb-2 shadow-2xs">
        <button
          onClick={() => setActiveMobileTab('products')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeMobileTab === 'products'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>PRODUCTS ({filteredProducts.length})</span>
        </button>
        <button
          onClick={() => setActiveMobileTab('invoice')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeMobileTab === 'invoice'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>INVOICE / BILL ({cart.length}) • {formatCurrency(grandTotal)}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* EXACT TWO-COLUMN LAYOUT: LEFT = PRODUCTS (58%), RIGHT = INVOICE (42%) */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 overflow-hidden">
        {/* ----------------------------------------------------------------------- */}
        {/* LEFT COLUMN — PRODUCTS (approx 55–60% width) */}
        {/* ----------------------------------------------------------------------- */}
        <div
          className={`w-full lg:w-[58%] xl:w-[60%] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden ${
            activeMobileTab === 'products' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* TOP OF LEFT COLUMN: [ Search Products... ]  [ QR / BARCODE SCAN ] */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/90 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search Products by name, SKU, or barcode..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* QR / BARCODE SCAN BUTTON */}
              <button
                type="button"
                onClick={() => setIsBarcodeModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer whitespace-nowrap transition-colors"
                title="Scan QR / Barcode (Hotkey: F2)"
              >
                <Barcode className="h-4 w-4" />
                <span>QR / BARCODE SCAN</span>
              </button>
            </div>

            {/* IMMEDIATELY BELOW: "ALL PRODUCTS" Header + Category filters + Grid/List toggle */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black tracking-wider text-slate-900 dark:text-slate-100 uppercase flex items-center gap-1.5">
                  <span>ALL PRODUCTS</span>
                  <span className="text-[11px] font-normal text-slate-500 font-mono">
                    ({filteredProducts.length})
                  </span>
                </h2>

                {/* Stock Quick Filters */}
                <div className="hidden sm:flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-800 text-[10px]">
                  <button
                    onClick={() => setQuickStockFilter('ALL')}
                    className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                      quickStockFilter === 'ALL'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setQuickStockFilter('IN_STOCK')}
                    className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                      quickStockFilter === 'IN_STOCK'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    In Stock
                  </button>
                  <button
                    onClick={() => setQuickStockFilter('LOW_STOCK')}
                    className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                      quickStockFilter === 'LOW_STOCK'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Low Stock
                  </button>
                </div>
              </div>

              {/* Grid / List Toggle */}
              <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="List View"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* PRODUCT CARDS LIST / GRID AREA (Independently scrollable) */}
          <div className="flex-1 overflow-y-auto p-3">
            {filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <ShoppingBag className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-2 opacity-60" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No matching products found</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Try clearing search filters or selecting All Categories.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('ALL');
                    setQuickStockFilter('ALL');
                  }}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock <= 10;
                  const inCartItem = cart.find((it) => it.productId === product.id);

                  return (
                    <div
                      key={product.id}
                      onClick={() => addToInvoice(product)}
                      className={`group relative flex flex-col justify-between rounded-xl border p-2.5 transition-all cursor-pointer select-none ${
                        isOutOfStock
                          ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-75'
                          : inCartItem
                          ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs hover:border-emerald-600 hover:shadow-md active:scale-[0.98]'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 hover:border-emerald-400 hover:shadow-md active:scale-[0.98]'
                      }`}
                    >
                      {/* Product Image */}
                      <div className="relative aspect-4/3 w-full rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                            🌿 Ahmad Herbals
                          </div>
                        )}

                        {/* Stock status indicator */}
                        <span
                          className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight shadow-xs ${
                            isOutOfStock
                              ? 'bg-rose-600 text-white'
                              : isLowStock
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {isOutOfStock ? 'OUT OF STOCK' : `${product.stock} ${product.unit || 'Pcs'}`}
                        </span>

                        {/* In-cart badge */}
                        {inCartItem && (
                          <span className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-emerald-700 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md">
                            <Check className="h-3 w-3" />
                            {inCartItem.quantity}
                          </span>
                        )}
                      </div>

                      {/* Name & SKU */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight group-hover:text-emerald-600 transition-colors">
                            {product.name}
                          </h4>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                            <span>SKU: {product.sku}</span>
                          </div>
                        </div>

                        {/* Price & Stock info */}
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                          <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                            {formatCurrency(product.salePrice)}
                          </span>

                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isOutOfStock
                                ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/50'
                                : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50'
                            }`}
                          >
                            Stock: {product.stock}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List View */
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const inCartItem = cart.find((it) => it.productId === product.id);

                  return (
                    <div
                      key={product.id}
                      onClick={() => addToInvoice(product)}
                      className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs">🌿</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {product.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            SKU: {product.sku} • Stock: {product.stock} {product.unit || 'Pcs'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                          {formatCurrency(product.salePrice)}
                        </span>
                        {inCartItem && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                            {inCartItem.quantity} in cart
                          </span>
                        )}
                        <span className="p-1 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                          <Plus className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT COLUMN — INVOICE / BILL (approx 40–45% width) */}
        {/* ----------------------------------------------------------------------- */}
        <div
          className={`w-full lg:w-[42%] xl:w-[40%] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${
            activeMobileTab === 'invoice' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* TOP OF RIGHT COLUMN: INVOICE / BILL Header */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-wide uppercase">
                    INVOICE / BILL
                  </h2>
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {draftInvoiceNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Header actions: Online badge, Hold, History, Clear */}
              <div className="flex items-center gap-1">
                {isOnline ? (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <Wifi className="h-2.5 w-2.5" /> Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    <WifiOff className="h-2.5 w-2.5" /> Offline
                  </span>
                )}

                {pendingOfflineCount > 0 && (
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing || !isOnline}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
                    title="Sync queued offline sales"
                  >
                    <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{pendingOfflineCount}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleHoldSale}
                  disabled={cart.length === 0}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                  title="Park Sale on Hold (F4)"
                >
                  <PauseCircle className="h-4 w-4 text-amber-500" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsHeldModalOpen(true)}
                  className="relative p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="Recall Held Sales (F8)"
                >
                  <PlayCircle className="h-4 w-4 text-emerald-600" />
                  {heldOrders.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {heldOrders.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsHistoryDrawerOpen(true)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="Sales History"
                >
                  <History className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={clearInvoice}
                  disabled={cart.length === 0}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30 cursor-pointer"
                  title="Clear Invoice"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Customer & Branch/Cashier Row */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
              <div className="flex-1 relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="cust-walkin">Walk-in Customer (In-Store)</option>
                  {customers
                    .filter((c) => c.id !== 'cust-walkin')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone || c.city || 'Customer'})
                      </option>
                    ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer whitespace-nowrap"
                title="Add New Customer"
              >
                <UserPlus className="h-3.5 w-3.5 text-emerald-600" />
                <span>+ New</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 px-0.5">
              <span>Branch: Main Branch (Lahore)</span>
              <span>Cashier: Admin ({currentRole})</span>
            </div>
          </div>

          {/* SELECTED PRODUCTS LIST (Independently scrollable) */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Receipt className="h-10 w-10 mb-2 opacity-30 text-slate-400" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Invoice is Empty</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[240px]">
                  Click any product on the LEFT or scan QR/Barcode to add to this invoice.
                </p>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500 font-mono bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg">
                  <span>F2 Scan</span>
                  <span>•</span>
                  <span>F4 Hold</span>
                  <span>•</span>
                  <span>F9 Complete</span>
                </div>
              </div>
            ) : (
              cart.map((item) => {
                const prod = products.find((p) => p.id === item.productId);
                return (
                  <div key={item.productId} className="py-2.5 px-1.5 flex items-center gap-2 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 rounded-xl transition-colors">
                    {/* Product Image */}
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-800">
                      {prod?.image ? (
                        <img src={prod.image} alt={item.productName} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs">🌿</span>
                      )}
                    </div>

                    {/* Product Name & SKU */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                        {item.productName}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {item.sku} • {formatCurrency(item.price)}/{item.unit || 'pc'}
                      </p>
                    </div>

                    {/* Quantity Controls: [-] 1 [+] */}
                    <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => updateItemQty(item.productId, -1)}
                        className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                        title="Decrease Quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => setItemExactQty(item.productId, parseInt(e.target.value) || 1)}
                        className="w-8 text-center text-xs font-black text-slate-900 dark:text-slate-100 bg-transparent focus:outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => updateItemQty(item.productId, 1)}
                        className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                        title="Increase Quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="w-18 text-right">
                      <p className="text-xs font-black text-slate-900 dark:text-slate-100">
                        {formatCurrency(item.total)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Remove Item"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* BILL TOTAL & PAYMENT SECTION AT BOTTOM OF RIGHT COLUMN */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 space-y-2.5">
            {/* Bill Totals breakdown */}
            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
              {/* Subtotal */}
              <div className="flex justify-between items-center">
                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(subtotal)}</span>
              </div>

              {/* Discount control */}
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                <div className="flex items-center gap-1.5">
                  <span>Discount</span>
                  <div className="flex items-center rounded border border-emerald-300 dark:border-emerald-800 text-[10px] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setDiscountType('PKR')}
                      className={`px-1.5 py-0.2 ${discountType === 'PKR' ? 'bg-emerald-600 text-white font-bold' : 'bg-white text-emerald-700'}`}
                    >
                      Rs.
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('PERCENT')}
                      className={`px-1.5 py-0.2 ${discountType === 'PERCENT' ? 'bg-emerald-600 text-white font-bold' : 'bg-white text-emerald-700'}`}
                    >
                      %
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-16 text-right px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-800 text-xs font-bold text-emerald-600"
                  />
                  <span>-{formatCurrency(calculatedDiscount)}</span>
                </div>
              </div>

              {/* Tax control */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span>Tax (GST)</span>
                  <select
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                    className="text-[10px] px-1 py-0.2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="17">17%</option>
                    <option value="18">18%</option>
                  </select>
                </div>
                <span>+{formatCurrency(taxAmount)}</span>
              </div>

              {/* Delivery / Shipping */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span>Delivery / Shipping</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    value={shippingFee || ''}
                    onChange={(e) => setShippingFee(Number(e.target.value))}
                    placeholder="0"
                    className="w-16 text-right px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  />
                  <span>+{formatCurrency(shippingFee || 0)}</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-1.5 flex items-center justify-between text-slate-900 dark:text-white">
                <span className="text-sm font-black uppercase tracking-wider">Grand Total</span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {/* PAYMENT METHOD SELECTION */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Payment Method
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                {[
                  { id: 'CASH', label: 'Cash' },
                  { id: 'CARD', label: 'Card' },
                  { id: 'BANK', label: 'Bank' },
                  { id: 'EASYPAISA', label: 'Easypaisa' },
                  { id: 'JAZZCASH', label: 'JazzCash' },
                  { id: 'CREDIT', label: 'Credit' },
                  { id: 'OTHER', label: 'Other' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer ${
                      paymentMethod === m.id
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Paid Amount, Due Amount & Change */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Paid Amount</label>
                  <input
                    type="number"
                    min="0"
                    value={cashTendered || ''}
                    onChange={(e) => setCashTendered(Number(e.target.value))}
                    className="w-full text-xs font-black px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Due Amount</label>
                  <div className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 font-black text-rose-600">
                    {formatCurrency(dueAmount)}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Change</label>
                  <div className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 font-black text-emerald-600">
                    {formatCurrency(changeAmount)}
                  </div>
                </div>
              </div>
            </div>

            {/* COMPLETE SALE BUTTON AT BOTTOM OF RIGHT COLUMN */}
            <button
              type="button"
              disabled={isSubmitting || cart.length === 0}
              onClick={handleExecuteCheckout}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Processing Sale...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  <span>COMPLETE SALE • {formatCurrency(grandTotal)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: QR / BARCODE SCANNER */}
      {/* ========================================================================= */}
      {isBarcodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Barcode className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">QR / Barcode Scanner</h3>
              </div>
              <button onClick={() => setIsBarcodeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Point your physical barcode reader or enter a Barcode/SKU to immediately add the product to the invoice.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleBarcodeLookup(barcodeQuery);
              }}
              className="space-y-3"
            >
              <div className="relative">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-600" />
                <input
                  ref={barcodeScanInputRef}
                  autoFocus
                  type="text"
                  value={barcodeQuery}
                  onChange={(e) => setBarcodeQuery(e.target.value)}
                  placeholder="Scan or type barcode (e.g. 896...)"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 text-sm font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden"
                />
              </div>

              {/* Sample Quick Barcodes from catalog */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Quick Barcode Test:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {products.slice(0, 4).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleBarcodeLookup(p.barcode || p.sku)}
                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 hover:bg-emerald-50 cursor-pointer"
                    >
                      {p.name.slice(0, 14)} ({p.barcode || p.sku})
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBarcodeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel (Esc)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-xs"
                >
                  Lookup & Add to Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: THERMAL RECEIPT PREVIEW (UPON COMPLETE SALE) */}
      {/* ========================================================================= */}
      {isReceiptModalOpen && completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                <h3 className="text-base font-bold">Sale Completed Successfully!</h3>
              </div>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="rounded-lg p-1 text-emerald-100 hover:bg-white/20 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 80mm Thermal Receipt Preview */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 font-mono text-xs max-h-[380px] overflow-y-auto border-b border-slate-200 dark:border-slate-800">
              <div className="text-center border-b border-dashed border-slate-300 dark:border-slate-700 pb-3 mb-3">
                <h4 className="font-bold text-sm tracking-wider uppercase text-slate-900 dark:text-slate-100">
                  {brandSettings.businessName}
                </h4>
                <p className="text-[11px] text-slate-500">{brandSettings.address}</p>
                <p className="text-[11px] text-slate-500">Tel: {brandSettings.phone}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Order #{completedOrder.orderNumber} • {new Date(completedOrder.createdAt).toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-500 font-sans">
                  Customer: {completedOrder.customerName}
                </p>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 divide-y divide-dashed divide-slate-200 dark:divide-slate-800">
                {completedOrder.items.map((it, idx) => (
                  <div key={idx} className="pt-1.5 flex justify-between text-[11px]">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{it.productName}</p>
                      <p className="text-[10px] text-slate-400">
                        {it.quantity} x {formatCurrency(it.price)}
                      </p>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(it.total)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-3 pt-2 border-t border-dashed border-slate-300 dark:border-slate-700 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(completedOrder.subtotal)}</span>
                </div>
                {completedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount:</span>
                    <span>-{formatCurrency(completedOrder.discount)}</span>
                  </div>
                )}
                {completedOrder.tax > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>GST / Tax:</span>
                    <span>+{formatCurrency(completedOrder.tax)}</span>
                  </div>
                )}
                {completedOrder.shipping > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Shipping / Delivery:</span>
                    <span>+{formatCurrency(completedOrder.shipping)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 dark:text-slate-100 pt-1 border-t border-dashed border-slate-300 dark:border-slate-700">
                  <span>GRAND TOTAL:</span>
                  <span>{formatCurrency(completedOrder.total)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Paid via {completedOrder.paymentMethod}:</span>
                  <span>{formatCurrency(completedOrder.paidAmount)}</span>
                </div>
                {completedOrder.dueAmount > 0 && (
                  <div className="flex justify-between text-[11px] text-rose-600 font-bold">
                    <span>Balance Due:</span>
                    <span>{formatCurrency(completedOrder.dueAmount)}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-3 text-[10px] text-slate-400">
                <p>Thank you for choosing Ahmad Herbals!</p>
                <p>Goods once sold can be exchanged within 7 days.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => printService.printReceipt(completedOrder, brandSettings)}
                className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer className="h-4 w-4" />
                <span>Print Thermal Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="h-4 w-4" />
                <span>New Sale</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECALL HELD SALES */}
      {/* ========================================================================= */}
      {isHeldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <PauseCircle className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Parked / Held Sales ({heldOrders.length})
                </h3>
              </div>
              <button
                onClick={() => setIsHeldModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 max-h-[400px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {heldOrders.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <PauseCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No Held Sales</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Press F4 or click "Hold" while building an invoice to park it temporarily.
                  </p>
                </div>
              ) : (
                heldOrders.map((held) => {
                  const heldTotal = held.items.reduce((s, i) => s + i.total, 0) - held.discountAmount;
                  return (
                    <div key={held.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {held.customerName}
                          </span>
                          <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                            {held.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {held.items.length} items • Total: {formatCurrency(Math.max(0, heldTotal))}
                        </p>
                        {held.notes && <p className="text-[10px] text-amber-600 italic mt-0.5">{held.notes}</p>}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleResumeSale(held)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          <span>Resume</span>
                        </button>
                        <button
                          onClick={() => setHeldOrders((prev) => prev.filter((h) => h.id !== held.id))}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          title="Discard Held Order"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-right">
              <button
                type="button"
                onClick={() => setIsHeldModalOpen(false)}
                className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FAST CUSTOMER REGISTRATION */}
      {/* ========================================================================= */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Fast Customer Registration</h3>
              </div>
              <button
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuickCustomerSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Hakim Muhammad Bilal"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={newCustCity}
                    onChange={(e) => setNewCustCity(e.target.value)}
                    placeholder="Lahore"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Address / Clinic
                  </label>
                  <input
                    type="text"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    placeholder="Mall Road, Lahore"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save & Select Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: RECENT POS TRANSACTIONS */}
      {/* ========================================================================= */}
      {isHistoryDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in-50">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent POS Terminal Sales</h3>
              </div>
              <button onClick={() => setIsHistoryDrawerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 dark:divide-slate-800">
              {orders
                .filter((o) => o.channel === 'POS')
                .slice(0, 20)
                .map((ord) => (
                  <div key={ord.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        #{ord.orderNumber}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {ord.customerName} • {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-bold">
                        {ord.paymentMethod} • {formatCurrency(ord.total)}
                      </p>
                    </div>

                    <button
                      onClick={() => printService.printReceipt(ord, brandSettings)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Reprint POS Receipt"
                    >
                      <Printer className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                      <span>Print</span>
                    </button>
                  </div>
                ))}
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-right">
              <button
                type="button"
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
