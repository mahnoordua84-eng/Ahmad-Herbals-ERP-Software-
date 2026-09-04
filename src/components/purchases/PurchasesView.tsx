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
} from 'lucide-react';
import { Purchase, PurchaseItem } from '../../types/erp';

export const PurchasesView: React.FC = () => {
  const {
    purchases,
    suppliers,
    products,
    warehouses,
    addPurchase,
    receivePurchase,
    formatCurrency,
    t,
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);

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
      total: totalBill,
      paid: paidAmount,
      due,
      paymentStatus,
      status: 'ORDERED',
      date: new Date().toISOString().split('T')[0],
      notes,
    });

    setIsModalOpen(false);
  };

  const filteredPurchases = purchases.filter(
    (p) =>
      p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="purchases-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t('purchases')} & Inbound Procurement
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Raw grains, herbs sourcing orders, auto-receiving, and supplier billing
          </p>
        </div>

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

      {/* Search */}
      <div className="flex rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
        <div className="relative flex-1">
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
              {filteredPurchases.map((po) => {
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingPurchase(po)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {!isReceived && (
                          <button
                            onClick={() => receivePurchase(po.id)}
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
              })}
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
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                      {item.quantity} units @ {formatCurrency(item.costPrice)}
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

            <div className="mt-6 flex justify-end">
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
                    Receiving Warehouse *
                  </label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Procurement Items
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

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60"
                    >
                      <div className="col-span-5">
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-center dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          placeholder="Rate"
                          value={item.costPrice}
                          onChange={(e) => handleItemChange(idx, 'costPrice', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-right dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>

                      <div className="col-span-2 text-right font-bold text-xs">
                        {formatCurrency(item.total)}
                      </div>

                      <div className="col-span-1 text-right">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill summary & paid amount */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Paid Amount (Advance / Instant)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalBill}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-bold"
                  />
                </div>

                <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/40 text-right">
                  <span className="block text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase">
                    Total Procurement Bill
                  </span>
                  <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(totalBill)}
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    Remaining Due: {formatCurrency(Math.max(0, totalBill - paidAmount))}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
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
                  Confirm Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
