import React, { useState, useRef, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Store,
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
} from 'lucide-react';
import { OrderItem, Product, Order } from '../../types/erp';
import { printService } from '../../services/printService';

interface HeldOrder {
  id: string;
  items: OrderItem[];
  customerId: string;
  customerName: string;
  discountAmount: number;
  appliedCoupon: string | null;
  timestamp: string;
}

export const POSView: React.FC = () => {
  const {
    products,
    categories,
    customers,
    coupons,
    warehouses,
    orders,
    addCustomer,
    createOrder,
    formatCurrency,
    brandSettings,
  } = useERP();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-walkin');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouses[0]?.id || 'wh-main');
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Hold Sale state
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => {
    try {
      const saved = localStorage.getItem('ahmad_pos_held_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);

  // Quick Customer Creation Modal
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('0300-');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustCity, setNewCustCity] = useState('Lahore');

  // Recent Sales & History Drawer
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Payment modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashTendered, setCashTendered] = useState(0);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [actionToast, setActionToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setActionToast({ msg, type });
    setTimeout(() => setActionToast(null), 3500);
  };

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Focus barcode input
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Save held orders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ahmad_pos_held_orders', JSON.stringify(heldOrders));
    } catch (err) {
      console.error('Failed to save held orders', err);
    }
  }, [heldOrders]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      showToast(`${product.name} is currently out of stock!`, 'error');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`Cannot exceed physical stock (${product.stock} ${product.unit}).`, 'error');
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.price,
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: 1,
            unit: product.unit,
            price: product.salePrice,
            purchasePrice: product.purchasePrice,
            total: product.salePrice,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (product && newQty > product.stock) {
              showToast(`Maximum stock limit is ${product.stock} ${product.unit}`, 'error');
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

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      (p) => p.barcode === barcodeInput.trim() || p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
    } else {
      showToast(`No product found with barcode or SKU: "${barcodeInput}"`, 'error');
    }
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    const cp = coupons.find(
      (c) => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.status === 'ACTIVE'
    );
    if (!cp) {
      showToast('Invalid or expired coupon code', 'error');
      return;
    }

    let disc = 0;
    const subtotal = cart.reduce((s, i) => s + i.total, 0);
    if (cp.minOrderAmount && subtotal < cp.minOrderAmount) {
      showToast(`Minimum order amount for this coupon is ${formatCurrency(cp.minOrderAmount)}`, 'error');
      return;
    }

    if (cp.type === 'PERCENTAGE') {
      disc = (subtotal * cp.value) / 100;
      if (cp.maxDiscount) disc = Math.min(disc, cp.maxDiscount);
    } else {
      disc = cp.value;
    }

    setDiscountAmount(disc);
    setAppliedCoupon(cp.code);
    showToast(`Coupon ${cp.code} applied successfully: -${formatCurrency(disc)}!`, 'success');
  };

  const subtotal = cart.reduce((s, i) => s + i.total, 0);
  const taxAmount = (subtotal * taxPercent) / 100;
  const totalPayable = Math.max(0, subtotal - discountAmount + taxAmount + shippingFee);
  const changeDue = Math.max(0, cashTendered - totalPayable);

  const handleHoldSale = () => {
    if (cart.length === 0) {
      showToast('Cart is empty. Nothing to put on hold.', 'info');
      return;
    }
    const cust = customers.find((c) => c.id === selectedCustomerId);
    const newHeld: HeldOrder = {
      id: `HOLD-${Date.now().toString().slice(-6)}`,
      items: [...cart],
      customerId: selectedCustomerId,
      customerName: cust?.name || 'Walk-in Customer',
      discountAmount,
      appliedCoupon,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setHeldOrders((prev) => [newHeld, ...prev]);
    setCart([]);
    setDiscountAmount(0);
    setAppliedCoupon(null);
    setCouponCode('');
    showToast('Current sale placed on hold!', 'info');
  };

  const handleResumeSale = (held: HeldOrder) => {
    setCart(held.items);
    setSelectedCustomerId(held.customerId);
    setDiscountAmount(held.discountAmount);
    setAppliedCoupon(held.appliedCoupon);
    setHeldOrders((prev) => prev.filter((h) => h.id !== held.id));
    setIsHeldModalOpen(false);
    showToast('Sale resumed from hold!', 'success');
  };

  const handleDiscardHeld = (id: string) => {
    setHeldOrders((prev) => prev.filter((h) => h.id !== id));
    showToast('Held order removed.', 'info');
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    setDiscountAmount(0);
    setAppliedCoupon(null);
    setCouponCode('');
    showToast('Active cart cleared.', 'info');
  };

  const handleQuickCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    const added = addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      address: newCustAddress.trim(),
      city: newCustCity.trim() || 'Lahore',
      creditLimit: 50000,
    });
    if (added && added.id) {
      setSelectedCustomerId(added.id);
    }
    showToast(`Customer "${newCustName.trim()}" created and selected!`, 'success');
    setIsNewCustomerModalOpen(false);
    setNewCustName('');
    setNewCustPhone('0300-');
    setNewCustAddress('');
  };

  const handleCheckoutSubmit = () => {
    if (cart.length === 0) return;

    const order = createOrder({
      customerId: selectedCustomerId,
      items: cart,
      channel: 'POS',
      paymentMethod,
      paidAmount: paymentMethod === 'CREDIT' ? 0 : totalPayable,
      discount: discountAmount,
      couponCode: appliedCoupon || undefined,
      warehouseId: selectedWarehouseId,
      notes: 'Counter POS terminal order',
    });

    setCompletedOrder(order);
    showToast(`Sale completed! Receipt generated for #${order.orderNumber}`, 'success');
    setIsCheckoutOpen(false);
    setCart([]);
    setDiscountAmount(0);
    setTaxPercent(0);
    setShippingFee(0);
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm);
    return matchesCat && matchesSearch;
  });

  return (
    <div id="pos-view" className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-4 relative">
      {/* Action Toast Notification */}
      {actionToast && (
        <div
          className={`fixed top-16 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-xl animate-in slide-in-from-top-2 ${
            actionToast.type === 'error'
              ? 'bg-rose-600'
              : actionToast.type === 'success'
              ? 'bg-emerald-600'
              : 'bg-slate-800'
          }`}
        >
          <span>{actionToast.msg}</span>
          <button
            onClick={() => setActionToast(null)}
            className="rounded p-0.5 hover:bg-white/20 ml-2"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Left: Product Catalog & Barcode Bar */}
      <div className="flex-1 flex flex-col min-w-0 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        {/* Top Controls: Barcode & Live Search */}
        <div className="flex flex-col sm:flex-row gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          {/* Barcode scanner emulator input */}
          <form onSubmit={handleBarcodeSubmit} className="relative flex-1">
            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan Barcode (or type EAN & press Enter)..."
              className="w-full rounded-xl border border-emerald-300 bg-emerald-50/40 pl-9 pr-3 py-2 text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-hidden dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-slate-100"
            />
          </form>

          {/* Search by name */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Quick search product name..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            All Products ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pt-2">
          {filteredProducts.map((p) => {
            const isOut = p.stock <= 0;
            return (
              <div
                key={p.id}
                onClick={() => !isOut && addToCart(p)}
                className={`group flex flex-col justify-between rounded-xl border p-2.5 transition-all text-left ${
                  isOut
                    ? 'border-slate-200 bg-slate-50/60 opacity-60 cursor-not-allowed dark:border-slate-800 dark:bg-slate-900'
                    : 'border-slate-200 bg-white hover:border-emerald-500 hover:shadow-md cursor-pointer dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div>
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                    <img
                      src={p.image || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&q=80'}
                      alt={p.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1 right-1 rounded bg-slate-950/70 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                      {p.stock} {p.unit}
                    </span>
                  </div>

                  <h3 className="mt-2 text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                    {p.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                    {p.sku}
                  </p>
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(p.salePrice)}
                  </span>
                  <span className="rounded bg-emerald-50 p-1 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors dark:bg-emerald-950 dark:text-emerald-300">
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Active Cart & Checkout Panel */}
      <div className="w-full lg:w-96 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Active Counter Cart</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsHeldModalOpen(true)}
                className="relative rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                title="View Held Orders"
              >
                <span>Held</span>
                {heldOrders.length > 0 && (
                  <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.2 text-[9px] font-bold text-white">
                    {heldOrders.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsHistoryDrawerOpen(true)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                title="POS Sales History"
              >
                <History className="h-3 w-3 inline mr-1" />
                <span>History</span>
              </button>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer ml-1"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Customer Selector & Quick Add */}
          <div className="mt-3 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="cust-walkin">Walk-in Customer (In-Store)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setIsNewCustomerModalOpen(true)}
              className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 cursor-pointer shrink-0"
              title="Add New Customer"
            >
              <UserPlus className="h-3 w-3" />
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              <Receipt className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              Cart is empty. Scan barcode or click items to add.
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-800/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {item.productName}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {formatCurrency(item.price)} × {item.quantity} {item.unit}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.productId, -1)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="ml-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="text-right shrink-0 min-w-14">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Calculation & Checkout Area */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5">
          {/* Coupon input */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Coupon Code"
              className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs uppercase dark:border-slate-700 dark:bg-slate-800 font-mono"
            />
            <button
              onClick={handleApplyCoupon}
              className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-black dark:bg-slate-700 cursor-pointer"
            >
              Apply
            </button>
          </div>

          {/* Quick Tax & Delivery Options */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-500 font-medium block">GST Tax %</label>
              <select
                value={taxPercent}
                onChange={(e) => setTaxPercent(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5% (FBR Reduced)</option>
                <option value={17}>17% (Sales Tax)</option>
                <option value={18}>18% (Standard GST)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-medium block">Delivery Fee</label>
              <input
                type="number"
                min="0"
                value={shippingFee}
                onChange={(e) => setShippingFee(Number(e.target.value))}
                placeholder="Rs. 0"
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1 text-xs pt-1">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items):</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(subtotal)}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount ({appliedCoupon}):</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>GST Tax ({taxPercent}%):</span>
                <span>+{formatCurrency(taxAmount)}</span>
              </div>
            )}
            {shippingFee > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Shipping Fee:</span>
                <span>+{formatCurrency(shippingFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-700">
              <span>Total Payable:</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalPayable)}
              </span>
            </div>
          </div>

          {/* Action Buttons: Hold Sale + Proceed to Payment */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={handleHoldSale}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 py-2.5 text-xs font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300 cursor-pointer transition-all"
              title="Put this active sale on hold to serve next customer"
            >
              <PauseCircle className="h-4 w-4" />
              <span>Hold Sale</span>
            </button>

            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => {
                setCashTendered(totalPayable);
                setIsCheckoutOpen(true);
              }}
              className="flex-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs sm:text-sm font-black text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-98 transition-all"
            >
              <span>Pay Now</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Payment & Tendered Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Payment Collection
                </h2>
                <p className="text-xs text-slate-500">
                  Total Bill: <span className="font-bold text-emerald-600">{formatCurrency(totalPayable)}</span>
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'CASH', label: 'Cash', icon: Banknote },
                    { id: 'EASYPAISA', label: 'Easypaisa / Jazz', icon: Smartphone },
                    { id: 'BANK_TRANSFER', label: 'Bank Transfer', icon: CreditCard },
                    { id: 'CARD', label: 'Credit/Debit Card', icon: CreditCard },
                    { id: 'CREDIT', label: 'Khata (Due Credit)', icon: Receipt },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          paymentMethod === m.id
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="h-4 w-4 mb-1" />
                        <span className="text-[11px] text-center leading-tight">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash calculation quick pills */}
              {paymentMethod === 'CASH' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Cash Tendered
                  </label>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-right"
                  />
                  <div className="flex gap-1.5">
                    {[500, 1000, 2000, 5000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashTendered(amt)}
                        className="flex-1 rounded-lg border border-slate-200 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        +{amt}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCashTendered(totalPayable)}
                      className="flex-1 rounded-lg bg-slate-100 border border-slate-300 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 cursor-pointer"
                    >
                      Exact
                    </button>
                  </div>

                  <div className="rounded-xl bg-slate-100 p-2.5 dark:bg-slate-800 text-xs flex justify-between items-center">
                    <span className="text-slate-500">Return Change to Customer:</span>
                    <span className="font-black text-sm text-emerald-600">
                      {formatCurrency(changeDue)}
                    </span>
                  </div>
                </div>
              )}

              {/* Warehouse selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Deduct Stock From Location
                </label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  Back to Cart
                </button>
                <button
                  type="button"
                  onClick={handleCheckoutSubmit}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
                >
                  Confirm & Complete Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>

            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Sale Completed Successfully!
            </h2>
            <p className="text-xs text-slate-500">
              Order #{completedOrder.orderNumber}
            </p>

            {/* Thermal Print Slip Simulation */}
            <div className="my-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-900 dark:bg-slate-800 dark:text-slate-100 text-left font-mono text-[11px] space-y-2">
              <div className="text-center font-bold pb-2 border-b border-slate-200 dark:border-slate-700">
                <p className="text-xs uppercase">{brandSettings.businessName}</p>
                <p className="text-[10px] text-slate-500">{brandSettings.phone}</p>
                <p className="text-[9px] text-slate-400">{completedOrder.createdAt}</p>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {completedOrder.items.map((it, idx) => (
                  <div key={idx} className="py-1 flex justify-between">
                    <span className="truncate max-w-[140px]">{it.productName} ×{it.quantity}</span>
                    <span>{formatCurrency(it.total)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-300 dark:border-slate-600 pt-2 space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>Net Total:</span>
                  <span>{formatCurrency(completedOrder.total)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Payment Method:</span>
                  <span>{completedOrder.paymentMethod}</span>
                </div>
              </div>

              <p className="text-center text-[9px] text-slate-400 pt-2">
                Thank you for choosing Ahmad Herbals! Pure & Natural.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => printService.printReceipt(completedOrder, brandSettings)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white dark:bg-emerald-600 cursor-pointer shadow-xs"
              >
                <Printer className="h-4 w-4" />
                <span>Print Thermal Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => printService.printInvoice(completedOrder, brandSettings)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-emerald-600" />
                <span>A4 Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedOrder(null)}
                className="w-full sm:w-auto rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Held Orders Modal */}
      {isHeldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <PauseCircle className="h-5 w-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Held Counter Sales ({heldOrders.length})
                </h2>
              </div>
              <button
                onClick={() => setIsHeldModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto space-y-2.5">
              {heldOrders.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No sales currently on hold.
                </div>
              ) : (
                heldOrders.map((h) => {
                  const itemsCount = h.items.reduce((s, i) => s + i.quantity, 0);
                  const orderTotal = h.items.reduce((s, i) => s + i.total, 0) - h.discountAmount;
                  return (
                    <div
                      key={h.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{h.customerName}</span>
                          <span className="font-mono text-[10px] text-slate-400">#{h.id}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {itemsCount} items • {formatCurrency(orderTotal)} • {h.timestamp}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleResumeSale(h)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer shadow-2xs"
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          <span>Resume</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDiscardHeld(h.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 cursor-pointer"
                          title="Discard held sale"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsHeldModalOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick New Customer Modal */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Quick Add POS Customer
                </h2>
              </div>
              <button
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleQuickCustomerSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Tariq Mahmood"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mobile Number (Khata / WhatsApp) *
                </label>
                <input
                  type="text"
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    City
                  </label>
                  <input
                    type="text"
                    value={newCustCity}
                    onChange={(e) => setNewCustCity(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Address / Area
                  </label>
                  <input
                    type="text"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    placeholder="Gulberg, Lahore"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
                >
                  Save & Select Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POS Sales History Drawer */}
      {isHistoryDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="h-full w-full max-w-md bg-white shadow-2xl dark:bg-slate-900 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Recent POS Orders
                  </h2>
                </div>
                <button
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 max-h-[75vh] overflow-y-auto space-y-3">
                {orders
                  .filter((o) => o.channel === 'POS')
                  .slice(0, 15)
                  .map((order) => (
                    <div
                      key={order.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-emerald-600">{order.orderNumber}</span>
                        <span className="text-[11px] text-slate-400">{order.createdAt.split('T')[0]}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <span>{order.customerName}</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {order.items.length} items • Paid via {order.paymentMethod}
                      </div>
                      <div className="flex gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => printService.printReceipt(order, brandSettings)}
                          className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-slate-900 py-1 text-[11px] font-semibold text-white hover:bg-black dark:bg-emerald-600 cursor-pointer"
                        >
                          <Printer className="h-3 w-3" />
                          <span>Reprint Slip</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => printService.printInvoice(order, brandSettings)}
                          className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                        >
                          <FileText className="h-3 w-3 text-emerald-600" />
                          <span>Invoice A4</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="w-full rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
