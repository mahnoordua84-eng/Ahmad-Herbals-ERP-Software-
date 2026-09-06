import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  ShoppingBag,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  Receipt,
  X,
  Package,
  Calendar,
  Eye,
  Printer,
  Download,
  CreditCard,
  DollarSign,
  Check,
} from 'lucide-react';
import { Purchase, PurchaseItem } from '../../types/erp';
import { printService } from '../../services/printService';

export const PurchasesView: React.FC = () => {
  const {
    purchases,
    suppliers,
    products,
    warehouses,
    brandSettings,
    addPurchase,
    receivePurchase,
    addPurchasePayment,
    paymentMethods,
    formatCurrency,
    t,
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ORDERED' | 'RECEIVED' | 'UNPAID'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);

  // Pay PO modal
  const [paymentModalPO, setPaymentModalPO] = useState<Purchase | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>(paymentMethods[0]?.id || 'BANK_TRANSFER');
  const [payNotes, setPayNotes] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  // New Purchase Form
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([
    {
      productId: products[0]?.id || '',
      productName: products[0]?.name || '',
      quantity: 50,
      costPrice: products[0]?.purchasePrice || 200,
      total: (products[0]?.purchasePrice || 200) * 50,
    },
  ]);

  const handleAddItem = () => {
    const defaultProd = products[0];
    setItems([
      ...items,
      {
        productId: defaultProd?.id || '',
        productName: defaultProd?.name || '',
        quantity: 20,
        costPrice: defaultProd?.purchasePrice || 100,
        total: (defaultProd?.purchasePrice || 100) * 20,
      },
    ]);
  };

  const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
    const updated = [...items];
    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      updated[index].productId = value;
      updated[index].productName = prod?.name || '';
      updated[index].costPrice = prod?.purchasePrice || 0;
      updated[index].total = updated[index].quantity * (prod?.purchasePrice || 0);
    } else if (field === 'quantity') {
      const qty = Number(value);
      updated[index].quantity = qty;
      const rate = updated[index].costPrice || updated[index].purchasePrice || 0;
      updated[index].total = qty * rate;
    } else if (field === 'costPrice' || field === 'purchasePrice') {
      const price = Number(value);
      updated[index].costPrice = price;
      updated[index].purchasePrice = price;
      updated[index].total = updated[index].quantity * price;
    }
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalBill = items.reduce((sum, item) => sum + item.total, 0);

  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    const sup = suppliers.find((s) => s.id === supplierId);
    const wh = warehouses.find((w) => w.id === warehouseId);
    const due = Math.max(0, totalBill - paidAmount);
    const paymentStatus: Purchase['paymentStatus'] =
      due === 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID';

    addPurchase({
      supplierId,
      supplierName: sup?.company || sup?.name || 'Supplier',
      warehouseId,
      warehouseName: wh?.name || 'Main Warehouse',
      items,
      subtotal: totalBill,
      discount: 0,
      tax: 0,
      shipping: 0,
      total: totalBill,
      paid: paidAmount,
      due,
      paymentStatus,
      status: 'ORDERED',
      date: new Date().toISOString().split('T')[0],
      notes,
    });

    setIsModalOpen(false);
    showNotification('Purchase order created successfully!');
  };

  const handleDisbursePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalPO || payAmount <= 0) return;

    addPurchasePayment(paymentModalPO.id, payAmount, payMethod, payNotes);
    showNotification(`Payment of ${formatCurrency(payAmount)} disbursed for PO #${paymentModalPO.invoiceNumber}`);
    setPaymentModalPO(null);
    setPayAmount(0);
    setPayNotes('');
  };

  const handleExportCSV = () => {
    const rows = filteredPurchases.map((po) => ({
      'PO Number': po.invoiceNumber,
      'Date': po.date,
      'Supplier': po.supplierName,
      'Warehouse': po.warehouseName,
      'Total (PKR)': po.total,
      'Paid (PKR)': po.paid,
      'Due (PKR)': po.due,
      'Payment Status': po.paymentStatus,
      'Receipt Status': po.status,
      'Items Count': po.items?.length || 0,
    }));
    printService.exportToCSV(rows, `Purchase_Orders_${new Date().toISOString().split('T')[0]}`);
    showNotification('Purchase orders exported to CSV!');
  };

  const filteredPurchases = purchases.filter((p) => {
    const matchesSearch =
      p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (statusFilter === 'ORDERED') return p.status === 'ORDERED';
    if (statusFilter === 'RECEIVED') return p.status === 'RECEIVED';
    if (statusFilter === 'UNPAID') return p.due > 0;
    return true;
  });

  return (
    <div id="purchases-view" className="space-y-6 pb-12">
      {/* Toast Notification */}
      {actionSuccess && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg animate-in slide-in-from-bottom-2">
          <Check className="h-4 w-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t('purchases')} & Inbound Procurement
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Raw herbs, organic seeds sourcing orders, auto-receiving, and supplier billing
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
            title="Export Purchase Orders to CSV"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setItems([
                {
                  productId: products[0]?.id || '',
                  productName: products[0]?.name || '',
                  quantity: 50,
                  costPrice: products[0]?.purchasePrice || 200,
                  total: (products[0]?.purchasePrice || 200) * 50,
                },
              ]);
              setPaidAmount(0);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search PO by invoice number or supplier company..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900 text-xs">
          {(['ALL', 'ORDERED', 'RECEIVED', 'UNPAID'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Purchases Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/50 text-slate-500">
                <th className="py-3 px-4 font-semibold">PO Number</th>
                <th className="py-3 px-4 font-semibold">Supplier</th>
                <th className="py-3 px-4 font-semibold">Destination Warehouse</th>
                <th className="py-3 px-4 font-semibold">Items</th>
                <th className="py-3 px-4 font-semibold">Total Cost</th>
                <th className="py-3 px-4 font-semibold">Payment Status</th>
                <th className="py-3 px-4 font-semibold">Receipt Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No purchase orders matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((po) => {
                  const isReceived = po.status === 'RECEIVED';

                  return (
                    <tr key={po.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <p className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {po.invoiceNumber}
                        </p>
                        <span className="text-[10px] text-slate-400">{po.date}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {po.supplierName}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {po.warehouseName}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {po.items.length} items ({po.items.reduce((s, i) => s + i.quantity, 0)} units)
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(po.total)}
                        {po.due > 0 && (
                          <p className="text-[10px] text-rose-600 font-normal">
                            Due: {formatCurrency(po.due)}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            po.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : po.paymentStatus === 'PARTIAL'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {po.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isReceived
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {isReceived ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              <span>RECEIVED</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3" />
                              <span>ORDERED</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print PO */}
                          <button
                            onClick={() => printService.printPurchase(po, brandSettings)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800 cursor-pointer"
                            title="Print Purchase Order"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>

                          {/* View details */}
                          <button
                            onClick={() => setViewingPurchase(po)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 cursor-pointer"
                            title="View PO Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {/* Pay PO Balance */}
                          {po.due > 0 && (
                            <button
                              onClick={() => {
                                setPaymentModalPO(po);
                                setPayAmount(po.due);
                              }}
                              className="rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 cursor-pointer"
                              title="Record Supplier Payment for this PO"
                            >
                              Pay
                            </button>
                          )}

                          {/* Receive Stock */}
                          {!isReceived && (
                            <button
                              onClick={() => {
                                receivePurchase(po.id);
                                showNotification(`PO #${po.invoiceNumber} received into stock!`);
                              }}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 cursor-pointer"
                              title="Verify and Add to Inventory Stock"
                            >
                              Receive Stock
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View PO Details Modal */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Purchase Order #{viewingPurchase.invoiceNumber}
                </h2>
                <p className="text-xs text-slate-500">
                  Supplier: {viewingPurchase.supplierName} • {viewingPurchase.date}
                </p>
              </div>
              <button
                onClick={() => setViewingPurchase(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-4 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {viewingPurchase.items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{item.productName}</p>
                    <p className="text-[11px] text-slate-400">
                      {item.quantity} units @ {formatCurrency(item.costPrice || item.purchasePrice || 0)}
                    </p>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-600 dark:text-slate-400">Total Purchase:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(viewingPurchase.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Disbursed Paid:</span>
                <span className="text-emerald-600 font-semibold">{formatCurrency(viewingPurchase.paid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Outstanding Balance:</span>
                <span className="text-rose-600 font-semibold">{formatCurrency(viewingPurchase.due)}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => printService.printPurchase(viewingPurchase, brandSettings)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
              >
                <Printer className="h-4 w-4 text-emerald-600" />
                <span>Print PO</span>
              </button>

              <button
                onClick={() => setViewingPurchase(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white dark:bg-emerald-600 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay PO Modal */}
      {paymentModalPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Disburse Payment for PO #{paymentModalPO.invoiceNumber}
                </h2>
                <p className="text-xs text-slate-500">
                  Supplier: {paymentModalPO.supplierName} • Total Due: <strong className="text-rose-600">{formatCurrency(paymentModalPO.due)}</strong>
                </p>
              </div>
              <button
                onClick={() => setPaymentModalPO(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleDisbursePayment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Payment Amount (PKR) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={paymentModalPO.due}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Payment Channel / Account
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="BANK_TRANSFER">Meezan Bank Corporate A/C</option>
                  <option value="CASH">Cash Drawer Outflow</option>
                  <option value="CHEQUE">Bank Payee Cheque</option>
                  <option value="EASYPAISA">JazzCash / Easypaisa Merchant</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Notes / Cheque No / Reference
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Bank online transfer #992144"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalPO(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
                >
                  Confirm Disbursal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Create Inbound Purchase Order
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Supplier *
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.company} ({s.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Destination Warehouse *
                  </label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Order Items ({items.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-800/50"
                  >
                    <div className="flex-1">
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-20">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        placeholder="Qty"
                      />
                    </div>

                    <div className="w-24">
                      <input
                        type="number"
                        min="0"
                        value={item.costPrice}
                        onChange={(e) => handleItemChange(idx, 'costPrice', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        placeholder="Cost"
                      />
                    </div>

                    <div className="w-24 text-right font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {formatCurrency(item.total)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="rounded p-1 text-slate-400 hover:text-rose-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Financials */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Disbursed Advance Payment (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalBill}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Procurement Notes / PO Ref
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Batch #2026-A organically certified"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
                <div>
                  <span className="block text-[11px] text-slate-500">Net Payable Bill</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {formatCurrency(totalBill)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[11px] text-slate-500">Balance Pending</span>
                  <span className="text-sm font-bold text-rose-600">
                    {formatCurrency(Math.max(0, totalBill - paidAmount))}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
                >
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

