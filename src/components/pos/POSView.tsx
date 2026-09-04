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
} from 'lucide-react';
import { OrderItem, Product, Order } from '../../types/erp';

export const POSView: React.FC = () => {
  const {
    products,
    categories,
    customers,
    coupons,
    warehouses,
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
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Payment modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashTendered, setCashTendered] = useState(0);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Focus barcode input
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`${product.name} is currently out of stock!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Cannot add more than physical available stock (${product.stock} ${product.unit}).`);
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
              alert(`Maximum stock is ${product.stock} ${product.unit}`);
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
      alert(`No product found with barcode or SKU: "${barcodeInput}"`);
    }
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    const cp = coupons.find(
      (c) => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.status === 'ACTIVE'
    );
    if (!cp) {
      alert('Invalid or expired coupon code');
      return;
    }

    let disc = 0;
    const subtotal = cart.reduce((s, i) => s + i.total, 0);
    if (cp.minOrderAmount && subtotal < cp.minOrderAmount) {
      alert(`Minimum order amount for this coupon is ${formatCurrency(cp.minOrderAmount)}`);
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
  };

  const subtotal = cart.reduce((s, i) => s + i.total, 0);
  const totalPayable = Math.max(0, subtotal - discountAmount);
  const changeDue = Math.max(0, cashTendered - totalPayable);

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
    setIsCheckoutOpen(false);
    setCart([]);
    setDiscountAmount(0);
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
    <div id="pos-view" className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-4">
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
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Customer Selector */}
          <div className="mt-3 flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="cust-walkin">Walk-in Customer (In-Store)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
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
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
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

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} units):</span>
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
            <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>Total Payable:</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalPayable)}
              </span>
            </div>
          </div>

          {/* Pay Button */}
          <button
            disabled={cart.length === 0}
            onClick={() => {
              setCashTendered(totalPayable);
              setIsCheckoutOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-98 transition-all"
          >
            <span>Proceed to Payment</span>
            <ArrowRight className="h-4 w-4" />
          </button>
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
                        className="flex-1 rounded-lg border border-slate-200 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                      >
                        +{amt}
                      </button>
                    ))}
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
                  Confirm & Print Invoice
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

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white dark:bg-emerald-600 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Thermal Receipt</span>
              </button>
              <button
                onClick={() => setCompletedOrder(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
