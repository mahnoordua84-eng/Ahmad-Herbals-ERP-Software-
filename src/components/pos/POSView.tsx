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
  ArrowRight,
  PauseCircle,
  PlayCircle,
  UserPlus,
  History,
  RotateCcw,
  FileText,
  Wifi,
  WifiOff,
  RefreshCw,
  LayoutGrid,
  List,
  AlertTriangle,
  ShoppingBag,
  Percent,
  Check,
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
  appliedCoupon: string | null;
  taxPercent: number;
  timestamp: string;
  notes?: string;
}

export const POSView: React.FC = () => {
  const {
    products,
    categories,
    brands,
    customers,
    coupons,
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

  // Layout & Filter State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'FREQUENT' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cart & Transaction State
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-walkin');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouses[0]?.id || 'wh-main');
  const [orderNotes, setOrderNotes] = useState('');

  // Discount & Tax State
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState<'PKR' | 'PERCENT'>('PKR');
  const [customDiscountValue, setCustomDiscountValue] = useState(0);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [taxPercent, setTaxPercent] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Hold Sale State
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);

  // Customer Modal State
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('0300-');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustCity, setNewCustCity] = useState('Lahore');

  // Checkout & Payment State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Sales History Drawer
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Action Toast Notification
  const [actionToast, setActionToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setActionToast({ msg, type });
    setTimeout(() => setActionToast(null), 3500);
  };

  // Load held orders from IndexedDB or localStorage on mount
  useEffect(() => {
    posOfflineDB.getHeldOrders().then((saved) => {
      if (saved && saved.length > 0) {
        setHeldOrders(saved);
      } else {
        try {
          const local = localStorage.getItem('ahmad_pos_held_orders');
          if (local) setHeldOrders(JSON.parse(local));
        } catch {
          // Ignore parse errors
        }
      }
    }).catch(() => {});
  }, []);

  // Save held orders to IndexedDB & localStorage
  useEffect(() => {
    posOfflineDB.saveAllHeldOrders(heldOrders as any).catch(() => {});
    try {
      localStorage.setItem('ahmad_pos_held_orders', JSON.stringify(heldOrders));
    } catch {
      // Ignore
    }
  }, [heldOrders]);

  // Global Keyboard Shortcuts (F2 = Barcode, F4 = Hold, F8 = Recall, F9 = Checkout, Esc = Close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleHoldSale();
      } else if (e.key === 'F8') {
        e.preventDefault();
        setIsHeldModalOpen((prev) => !prev);
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsCheckoutOpen(true);
        } else {
          showToast('Cart is empty. Add products before checkout.', 'info');
        }
      } else if (e.key === 'Escape') {
        setIsCheckoutOpen(false);
        setIsHeldModalOpen(false);
        setIsNewCustomerModalOpen(false);
        setIsDiscountModalOpen(false);
        setIsHistoryDrawerOpen(false);
        setIsReceiptModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, heldOrders, selectedCustomerId, discountAmount, appliedCoupon]);

  // Calculate Subtotal & Line items
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.total || 0), 0);
  }, [cart]);

  const calculatedDiscount = useMemo(() => {
    if (discountType === 'PERCENT') {
      return Math.round((subtotal * customDiscountValue) / 100);
    }
    return Math.min(subtotal, customDiscountValue + discountAmount);
  }, [subtotal, discountType, customDiscountValue, discountAmount]);

  const taxAmount = useMemo(() => {
    const taxable = Math.max(0, subtotal - calculatedDiscount);
    return Math.round((taxable * taxPercent) / 100);
  }, [subtotal, calculatedDiscount, taxPercent]);

  const totalPayable = useMemo(() => {
    return Math.max(0, subtotal - calculatedDiscount + taxAmount);
  }, [subtotal, calculatedDiscount, taxAmount]);

  const changeDue = useMemo(() => {
    return Math.max(0, (cashTendered || 0) - totalPayable);
  }, [cashTendered, totalPayable]);

  // Set default cash tendered when checkout modal opens or total changes
  useEffect(() => {
    if (cashTendered === 0 || cashTendered < totalPayable) {
      setCashTendered(totalPayable);
    }
  }, [totalPayable, isCheckoutOpen]);

  // Fast "Click-to-Add" Product to Cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      showToast(`${product.name} is out of stock!`, 'error');
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.productId === product.id);
      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        if (existing.quantity >= product.stock) {
          showToast(`Maximum available stock reached (${product.stock} ${product.unit}).`, 'error');
          return prev;
        }
        const updated = [...prev];
        const newQty = existing.quantity + 1;
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          total: newQty * existing.price,
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
          purchasePrice: product.purchasePrice || (product.salePrice * 0.65),
          discount: 0,
          tax: 0,
          total: product.salePrice,
        };
        return [newItem, ...prev];
      }
    });

    showToast(`Added 1x ${product.name}`, 'info');
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (product && newQty > product.stock) {
              showToast(`Available physical stock limit is ${product.stock} ${product.unit}`, 'error');
              return item;
            }
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              total: newQty * item.price,
            };
          }
          return item;
        })
        .filter(Boolean) as OrderItem[]
    );
  };

  const setItemQuantity = (productId: string, qty: number) => {
    const product = products.find((p) => p.id === productId);
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    if (product && qty > product.stock) {
      showToast(`Exceeds physical stock of ${product.stock} ${product.unit}`, 'error');
      qty = product.stock;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: qty,
              total: qty * item.price,
            }
          : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeInput.trim();
    if (!query) return;

    const matched = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === query.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase() === query.toLowerCase())
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
      barcodeInputRef.current?.focus();
    } else {
      showToast(`No item found matching Barcode / SKU: "${query}"`, 'error');
    }
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    const cp = coupons.find(
      (c) => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.status === 'ACTIVE'
    );
    if (!cp) {
      showToast('Invalid or expired promotional code', 'error');
      return;
    }

    let disc = 0;
    if (cp.minOrderAmount && subtotal < cp.minOrderAmount) {
      showToast(`Minimum order required for this coupon is ${formatCurrency(cp.minOrderAmount)}`, 'error');
      return;
    }

    if (cp.type === 'PERCENTAGE') {
      disc = Math.round((subtotal * cp.value) / 100);
      if (cp.maxDiscount) disc = Math.min(disc, cp.maxDiscount);
    } else {
      disc = cp.value;
    }

    setDiscountAmount(disc);
    setAppliedCoupon(cp.code);
    showToast(`Coupon applied: -${formatCurrency(disc)} off!`, 'success');
  };

  const handleHoldSale = () => {
    if (cart.length === 0) {
      showToast('Current cart is empty. Nothing to place on hold.', 'info');
      return;
    }

    const cust = customers.find((c) => c.id === selectedCustomerId);
    const newHeld: HeldOrder = {
      id: `HOLD-${Date.now().toString().slice(-6)}`,
      items: [...cart],
      customerId: selectedCustomerId,
      customerName: cust?.name || 'Walk-in Customer',
      discountAmount: calculatedDiscount,
      appliedCoupon,
      taxPercent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notes: orderNotes,
    };

    setHeldOrders((prev) => [newHeld, ...prev]);
    setCart([]);
    setDiscountAmount(0);
    setCustomDiscountValue(0);
    setAppliedCoupon(null);
    setCouponCode('');
    setOrderNotes('');
    showToast('Sale parked on hold! Ready for next customer.', 'success');
  };

  const handleResumeSale = (held: HeldOrder) => {
    setCart(held.items);
    setSelectedCustomerId(held.customerId);
    setDiscountAmount(held.discountAmount);
    setAppliedCoupon(held.appliedCoupon);
    setTaxPercent(held.taxPercent || 0);
    if (held.notes) setOrderNotes(held.notes);
    setHeldOrders((prev) => prev.filter((h) => h.id !== held.id));
    setIsHeldModalOpen(false);
    showToast(`Resumed held sale for ${held.customerName}`, 'success');
  };

  const handleDiscardHeld = (id: string) => {
    setHeldOrders((prev) => prev.filter((h) => h.id !== id));
    showToast('Held order removed.', 'info');
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Are you sure you want to clear the entire active cart?')) {
      setCart([]);
      setDiscountAmount(0);
      setCustomDiscountValue(0);
      setAppliedCoupon(null);
      setCouponCode('');
      setOrderNotes('');
      showToast('Active cart cleared.', 'info');
    }
  };

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

    showToast(`Customer "${newCustName.trim()}" registered!`, 'success');
    setIsNewCustomerModalOpen(false);
    setNewCustName('');
    setNewCustPhone('0300-');
    setNewCustAddress('');
  };

  // Perform Final POS Transaction (Requirements 14, 15, 16, 22, 23)
  const handleExecuteCheckout = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    const cust = customers.find((c) => c.id === selectedCustomerId);
    const paid = paymentMethod === 'CREDIT' ? 0 : (cashTendered || totalPayable);

    try {
      const result = await posCheckout({
        customerId: selectedCustomerId,
        customerName: cust?.name || 'Walk-in Customer',
        customerPhone: cust?.phone || 'In-store',
        items: cart,
        subtotal,
        discount: calculatedDiscount,
        tax: taxAmount,
        shipping: 0,
        total: totalPayable,
        paymentMethod,
        paidAmount: paid,
        warehouseId: selectedWarehouseId,
        notes: orderNotes || `POS Retail Sale (${paymentMethod})`,
        couponCode: appliedCoupon || undefined,
      });

      if (result.success && result.order) {
        setCompletedOrder(result.order);
        setCompletedInvoice(result.invoice);
        setIsCheckoutOpen(false);
        setIsReceiptModalOpen(true);

        // Reset cart for next customer
        setCart([]);
        setDiscountAmount(0);
        setCustomDiscountValue(0);
        setAppliedCoupon(null);
        setCouponCode('');
        setOrderNotes('');
        setCashTendered(0);

        if (result.isOffline) {
          showToast(`Offline Sale #${result.order.orderNumber} saved locally. Queued for auto-sync!`, 'info');
        } else {
          showToast(`Sale completed! Invoice #${result.invoice?.invoiceNumber || result.order.orderNumber} generated.`, 'success');
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
        showToast(`Successfully synchronized ${res.syncedCount} offline transactions!`, 'success');
      } else {
        showToast('All offline transactions are up to date.', 'info');
      }
    } catch (err) {
      showToast('Offline sync encountered an issue. Will retry.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter Catalog
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.status === 'ARCHIVED' || p.status === 'INACTIVE') return false;

      // Category filter
      if (selectedCategory !== 'ALL' && p.categoryId !== selectedCategory) {
        return false;
      }

      // Brand filter
      if (selectedBrand !== 'ALL' && p.brandId !== selectedBrand) {
        return false;
      }

      // Quick filter
      if (quickFilter === 'LOW_STOCK' && (p.stock > 10 || p.stock <= 0)) {
        return false;
      }
      if (quickFilter === 'OUT_OF_STOCK' && p.stock > 0) {
        return false;
      }
      if (quickFilter === 'FREQUENT') {
        // Show high turnover items
        if ((p.stock || 0) < 5) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(term);
        const matchesSku = p.sku.toLowerCase().includes(term);
        const matchesBarcode = p.barcode ? p.barcode.toLowerCase().includes(term) : false;
        return matchesName || matchesSku || matchesBarcode;
      }

      return true;
    });
  }, [products, selectedCategory, selectedBrand, quickFilter, searchTerm]);

  // Selected Customer details
  const activeCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || {
      id: 'cust-walkin',
      name: 'Walk-in Customer',
      phone: '0300-0000000',
      address: 'In-store',
      outstandingBalance: 0,
    };
  }, [customers, selectedCustomerId]);

  // Today's recent POS orders
  const recentPosOrders = useMemo(() => {
    return orders
      .filter((o) => o.channel === 'POS')
      .slice(0, 15);
  }, [orders]);

  return (
    <div id="pos-terminal" className="h-[calc(100vh-5.5rem)] flex flex-col lg:flex-row gap-3 overflow-hidden select-none bg-slate-100 dark:bg-slate-950 p-2 sm:p-3">
      {/* Action Toast Notification */}
      {actionToast && (
        <div
          className={`fixed top-14 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-2xl animate-in slide-in-from-top-2 ${
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

      {/* ========================================================================= */}
      {/* LEFT PANEL: PRODUCT CATALOG & BARCODE ENGINE (~62% WIDTH) */}
      {/* ========================================================================= */}
      <div className="flex-1 lg:max-w-[62%] xl:max-w-[65%] flex flex-col min-w-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Top Control Bar: Fast Search, Barcode Input, View Toggle */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by name, SKU, or tag... (Esc to clear)"
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

            {/* Barcode Scanner Input */}
            <form onSubmit={handleBarcodeSubmit} className="relative w-48 sm:w-56">
              <Barcode className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan barcode (F2)..."
                className="w-full pl-8 pr-7 py-2 rounded-lg border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {barcodeInput && (
                <button
                  type="button"
                  onClick={() => setBarcodeInput('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </form>

            {/* Grid / List View Toggle */}
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  viewMode === 'list'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Dense List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Filter Chips & Category Scroll */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setQuickFilter('ALL')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  quickFilter === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                }`}
              >
                All Products ({products.length})
              </button>
              <button
                onClick={() => setQuickFilter('FREQUENT')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  quickFilter === 'FREQUENT'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                }`}
              >
                Frequently Sold
              </button>
              <button
                onClick={() => setQuickFilter('LOW_STOCK')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  quickFilter === 'LOW_STOCK'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                }`}
              >
                Low Stock (&lt;10)
              </button>
              <button
                onClick={() => setQuickFilter('OUT_OF_STOCK')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  quickFilter === 'OUT_OF_STOCK'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                }`}
              >
                Out of Stock
              </button>
            </div>

            {/* Brand Dropdown if brands exist */}
            {brands.length > 0 && (
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="text-[11px] py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All Brands</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 border-t border-slate-200/60 dark:border-slate-800/80">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => {
              const catCount = products.filter((p) => p.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-75">({catCount})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Catalog Body: Responsive Grid or Dense List */}
        <div className="flex-1 overflow-y-auto p-3">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <ShoppingBag className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No products found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Try adjusting your search keywords, clearing categories, or resetting the stock filter.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('ALL');
                  setQuickFilter('ALL');
                }}
                className="mt-4 px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
              >
                Reset Catalog Filters
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
                    onClick={() => addToCart(product)}
                    className={`group relative flex flex-col justify-between rounded-xl border p-2.5 transition-all cursor-pointer select-none ${
                      isOutOfStock
                        ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-70 cursor-not-allowed'
                        : inCartItem
                        ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs hover:border-emerald-600 hover:shadow-md active:scale-[0.98]'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 hover:border-emerald-400 hover:shadow-md active:scale-[0.98]'
                    }`}
                  >
                    {/* Top image & in-cart badge */}
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

                      {/* Stock Pill on image */}
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

                      {/* In-cart count badge */}
                      {inCartItem && (
                        <span className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-emerald-700 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md">
                          <Check className="h-3 w-3" />
                          {inCartItem.quantity}
                        </span>
                      )}
                    </div>

                    {/* Product Metadata */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight group-hover:text-emerald-600 transition-colors">
                          {product.name}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          <span>SKU: {product.sku}</span>
                          {product.barcode && <span className="font-mono">#{product.barcode.slice(-4)}</span>}
                        </div>
                      </div>

                      {/* Price & Instant Add trigger */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                        <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                          {formatCurrency(product.salePrice)}
                        </span>

                        <span
                          className={`flex items-center justify-center h-7 w-7 rounded-lg transition-colors ${
                            isOutOfStock
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                              : 'bg-emerald-600 text-white group-hover:bg-emerald-700 shadow-xs'
                          }`}
                        >
                          <Plus className="h-4 w-4" />
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
                    onClick={() => addToCart(product)}
                    className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs">🌿</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{product.name}</p>
                        <p className="text-[11px] text-slate-500">
                          SKU: {product.sku} • Stock: {product.stock} {product.unit}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(product.salePrice)}
                      </span>
                      {inCartItem && (
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                          {inCartItem.quantity} in cart
                        </span>
                      )}
                      <button
                        disabled={isOutOfStock}
                        className="p-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT PANEL: PERMANENT CURRENT SALE / CART (~38% WIDTH) */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[420px] xl:w-[460px] flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex-shrink-0">
        {/* Terminal Header & Status Bar */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              POS
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Counter Terminal 01</span>
                {/* Online / Offline Status Pill */}
                {isOnline ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <Wifi className="h-3 w-3" /> Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    <WifiOff className="h-3 w-3" /> Offline Mode
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500">Cashier: Admin ({currentRole})</p>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-1">
            {pendingOfflineCount > 0 && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing || !isOnline}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
                title="Sync queued offline transactions"
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{pendingOfflineCount} queued</span>
              </button>
            )}

            <button
              onClick={() => setIsHeldModalOpen(true)}
              className="relative p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Recall Held Orders (F8)"
            >
              <PauseCircle className="h-4 w-4" />
              {heldOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {heldOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsHistoryDrawerOpen(true)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Recent POS Transactions"
            >
              <History className="h-4 w-4" />
            </button>

            <button
              onClick={handleClearCart}
              disabled={cart.length === 0}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-30 cursor-pointer"
              title="Clear Active Cart"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Customer Selector & Quick Add */}
        <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
          <div className="flex-1 relative">
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
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
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 text-xs font-semibold whitespace-nowrap cursor-pointer"
            title="Create New Customer"
          >
            <UserPlus className="h-3.5 w-3.5 text-emerald-600" />
            <span>New</span>
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingBag className="h-10 w-10 mb-2 opacity-40 text-slate-400" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Cart is Empty</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[240px]">
                Click any product on the left catalog or scan barcode to add to current sale.
              </p>
              <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                <span>Shortcuts:</span>
                <span className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  F2 Barcode
                </span>
                <span className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  F9 Pay
                </span>
              </div>
            </div>
          ) : (
            cart.map((item) => {
              const prod = products.find((p) => p.id === item.productId);
              return (
                <div key={item.productId} className="py-2 px-1 flex items-center gap-2 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 rounded-lg transition-colors">
                  {/* Thumbnail */}
                  <div className="h-9 w-9 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center">
                    {prod?.image ? (
                      <img src={prod.image} alt={item.productName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs">🌿</span>
                    )}
                  </div>

                  {/* Title & Unit Price */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                      {item.productName}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {item.sku} • {formatCurrency(item.price)}/{item.unit || 'pc'}
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5">
                    <button
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => setItemQuantity(item.productId, parseInt(e.target.value) || 1)}
                      className="w-8 text-center text-xs font-bold text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="w-16 text-right">
                    <p className="text-xs font-black text-slate-900 dark:text-slate-100">
                      {formatCurrency(item.total)}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Sticky Calculations & Fast Checkout Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex flex-col gap-2.5">
          {/* Quick Action Chips: Hold, Discount, Tax */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={handleHoldSale}
              disabled={cart.length === 0}
              className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-medium text-[11px] disabled:opacity-40 cursor-pointer"
            >
              <PauseCircle className="h-3.5 w-3.5 text-amber-500" />
              <span>Hold (F4)</span>
            </button>

            <button
              onClick={() => setIsDiscountModalOpen(true)}
              className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                calculatedDiscount > 0
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <Tag className="h-3.5 w-3.5" />
              <span>{calculatedDiscount > 0 ? `-${formatCurrency(calculatedDiscount)}` : 'Discount'}</span>
            </button>

            <select
              value={taxPercent}
              onChange={(e) => setTaxPercent(Number(e.target.value))}
              className="py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="0">GST: 0%</option>
              <option value="5">GST: 5%</option>
              <option value="17">GST: 17%</option>
              <option value="18">GST: 18%</option>
            </select>
          </div>

          {/* Breakdown Summary */}
          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1">
            <div className="flex justify-between">
              <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(subtotal)}</span>
            </div>

            {calculatedDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                <span>Discount applied</span>
                <span>-{formatCurrency(calculatedDiscount)}</span>
              </div>
            )}

            {taxPercent > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>GST / Tax ({taxPercent}%)</span>
                <span>+{formatCurrency(taxAmount)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Total Payable
                </span>
                <p className="text-[10px] text-slate-500">Includes all applicable duties & taxes</p>
              </div>
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                {formatCurrency(totalPayable)}
              </span>
            </div>
          </div>

          {/* Quick Cash Tender Buttons */}
          <div className="grid grid-cols-5 gap-1 pt-1">
            {[totalPayable, 500, 1000, 2000, 5000].map((amt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCashTendered(amt)}
                className={`py-1 text-[11px] font-bold rounded border transition-colors cursor-pointer ${
                  cashTendered === amt
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {idx === 0 ? 'Exact' : `${amt}`}
              </button>
            ))}
          </div>

          {/* Checkout Action Button */}
          <button
            onClick={() => {
              if (cart.length === 0) {
                showToast('Cart is empty. Add products to proceed.', 'info');
                return;
              }
              setIsCheckoutOpen(true);
            }}
            disabled={cart.length === 0}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Receipt className="h-5 w-5" />
            <span>Pay & Print Receipt (F9) • {formatCurrency(totalPayable)}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: FAST CHECKOUT & PAYMENT TENDER (Requirement 14, 15, 16) */}
      {/* ========================================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">POS Retail Checkout</h3>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Order Summary banner */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                    Customer: <span className="font-bold">{activeCustomer.name}</span>
                  </p>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400">
                    {cart.reduce((s, i) => s + i.quantity, 0)} items in sale
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Amount Due</p>
                  <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(totalPayable)}
                  </p>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'CASH', label: 'Cash Tender', icon: Banknote },
                    { id: 'CARD', label: 'Credit/Debit Card', icon: CreditCard },
                    { id: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Smartphone },
                    { id: 'EASYPAISA', label: 'EasyPaisa', icon: Smartphone },
                    { id: 'JAZZCASH', label: 'JazzCash', icon: Smartphone },
                    { id: 'CREDIT', label: 'On Account (Credit)', icon: User },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          paymentMethod === m.id
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="h-4 w-4 mb-1" />
                        <span className="text-[11px] text-center leading-tight">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Received and Change due */}
              {paymentMethod === 'CASH' && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Cash Tendered / Received (PKR)
                    </label>
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      Change: {formatCurrency(changeDue)}
                    </span>
                  </div>

                  <input
                    type="number"
                    min="0"
                    value={cashTendered || ''}
                    onChange={(e) => setCashTendered(Number(e.target.value))}
                    placeholder="Enter cash received..."
                    className="w-full text-base font-black text-slate-900 dark:text-slate-100 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />

                  {/* Cash quick presets */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {[totalPayable, 500, 1000, 2000, 5000, 10000].map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCashTendered(preset)}
                        className="flex-1 py-1 rounded-md text-[11px] font-bold border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        {i === 0 ? 'Exact' : `${preset}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Order / Receipt Notes (Optional)
                </label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Special instructions or patient prescription ref..."
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                Cancel (Esc)
              </button>

              <button
                type="button"
                disabled={isSubmitting || (paymentMethod === 'CASH' && cashTendered < totalPayable)}
                onClick={handleExecuteCheckout}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-2 disabled:opacity-40 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Processing Sale...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Complete Sale & Print Receipt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RECEIPT GENERATED / COMPLETED SALE (Requirements 17, 18, 19, 20) */}
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

            {/* Thermal Receipt Preview Box */}
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

              {/* Receipt Totals */}
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
                <div className="flex justify-between text-sm font-black text-slate-900 dark:text-slate-100 pt-1 border-t border-dashed border-slate-300 dark:border-slate-700">
                  <span>TOTAL:</span>
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
                <span>Print Receipt (Thermal)</span>
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
      {/* MODAL 3: RECALL HELD ORDERS (Requirement 24, 25, 26) */}
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
                    Press F4 or click "Hold" while building an order to park it temporarily.
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
                          onClick={() => handleDiscardHeld(held.id)}
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
      {/* MODAL 4: QUICK ADD CUSTOMER */}
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
      {/* MODAL 5: CUSTOM DISCOUNT MODAL */}
      {/* ========================================================================= */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Apply Sale Discount</h3>
              </div>
              <button onClick={() => setIsDiscountModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Discount Type Toggle */}
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-1 bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setDiscountType('PKR')}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  discountType === 'PKR' ? 'bg-white dark:bg-slate-900 shadow-xs text-emerald-600' : 'text-slate-600'
                }`}
              >
                Fixed PKR (Rs.)
              </button>
              <button
                type="button"
                onClick={() => setDiscountType('PERCENT')}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  discountType === 'PERCENT' ? 'bg-white dark:bg-slate-900 shadow-xs text-emerald-600' : 'text-slate-600'
                }`}
              >
                Percentage (%)
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Discount Value ({discountType === 'PERCENT' ? '%' : 'PKR'})
              </label>
              <input
                type="number"
                min="0"
                value={customDiscountValue || ''}
                onChange={(e) => setCustomDiscountValue(Number(e.target.value))}
                placeholder={discountType === 'PERCENT' ? 'e.g. 10' : 'e.g. 200'}
                className="w-full text-base font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            {/* Coupon Code option */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Promotional Coupon Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SUMMER10"
                  className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCustomDiscountValue(0);
                  setDiscountAmount(0);
                  setAppliedCoupon(null);
                  setIsDiscountModalOpen(false);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-rose-600 hover:bg-rose-50"
              >
                Clear Discount
              </button>
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
              >
                Done
              </button>
            </div>
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
              {recentPosOrders.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Receipt className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No POS transactions logged yet today.</p>
                </div>
              ) : (
                recentPosOrders.map((ord) => (
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
                ))
              )}
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
