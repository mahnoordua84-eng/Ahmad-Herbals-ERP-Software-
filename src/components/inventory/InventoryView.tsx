import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Boxes,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  AlertTriangle,
  History,
  CheckCircle2,
  Search,
  Filter,
  Plus,
  X,
  Warehouse as WarehouseIcon,
  ShieldAlert,
} from 'lucide-react';
import { StockMovementType } from '../../types/erp';

export const InventoryView: React.FC = () => {
  const {
    products,
    warehouses,
    warehouseInventory,
    stockMovements,
    adjustStock,
    formatCurrency,
    t,
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'STOCK' | 'LOGS'>('STOCK');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Form for stock adjustment
  const [adjustForm, setAdjustForm] = useState({
    productId: products[0]?.id || '',
    warehouseId: warehouses[0]?.id || '',
    type: 'MANUAL_ADJUST' as StockMovementType,
    quantity: 10,
    reason: 'Inventory physical count reconciliation',
  });

  const handleOpenAdjust = (productId?: string) => {
    setAdjustForm({
      productId: productId || products[0]?.id || '',
      warehouseId: warehouses[0]?.id || '',
      type: 'MANUAL_ADJUST',
      quantity: 10,
      reason: 'Physical count adjustment',
    });
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(adjustForm.quantity);
    let delta = qty;

    if (
      adjustForm.type === 'STOCK_OUT' ||
      adjustForm.type === 'DAMAGE' ||
      adjustForm.type === 'LOSS' ||
      adjustForm.type === 'EXPIRED'
    ) {
      delta = -Math.abs(qty);
    } else {
      delta = Math.abs(qty);
    }

    adjustStock(adjustForm.productId, adjustForm.warehouseId, delta, adjustForm.type, adjustForm.reason);
    setIsAdjustModalOpen(false);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div id="inventory-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t('inventory')} & Stock Control
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Formula: <span className="font-semibold text-emerald-600">Available Stock = Physical Stock - Reserved Stock - Damaged Stock</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setActiveTab('STOCK')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'STOCK'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              Stock Levels
            </button>
            <button
              onClick={() => setActiveTab('LOGS')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'LOGS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              Movement Logs ({stockMovements.length})
            </button>
          </div>

          <button
            onClick={() => handleOpenAdjust()}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Stock Adjustment</span>
          </button>
        </div>
      </div>

      {activeTab === 'STOCK' ? (
        <>
          {/* Filters Toolbar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search stock by product name or SKU..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <WarehouseIcon className="h-4 w-4 text-slate-400" />
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="ALL">All Warehouses Aggregate</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/50 text-slate-500">
                    <th className="py-3 px-4 font-semibold">Product Name & SKU</th>
                    <th className="py-3 px-4 font-semibold text-center">Physical Stock</th>
                    <th className="py-3 px-4 font-semibold text-center">Reserved (Orders)</th>
                    <th className="py-3 px-4 font-semibold text-center">Damaged / Expired</th>
                    <th className="py-3 px-4 font-semibold text-center">Available Stock</th>
                    <th className="py-3 px-4 font-semibold">Valuation (Cost)</th>
                    <th className="py-3 px-4 font-semibold text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.map((p) => {
                    const invRecords = warehouseInventory.filter(
                      (wi) => wi.productId === p.id && (selectedWarehouse === 'ALL' || wi.warehouseId === selectedWarehouse)
                    );

                    const physical = invRecords.reduce((acc, curr) => acc + curr.physicalStock, 0) || p.stock;
                    const reserved = invRecords.reduce((acc, curr) => acc + curr.reservedStock, 0);
                    const damaged = invRecords.reduce((acc, curr) => acc + curr.damagedStock, 0);
                    const available = Math.max(0, physical - reserved - damaged);
                    const isLow = available > 0 && available <= p.minStock;
                    const isOut = available <= 0;

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=120&q=80'}
                              alt={p.name}
                              className="h-9 w-9 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
                            />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100">{p.name}</p>
                              <p className="font-mono text-[10px] text-slate-400">
                                SKU: {p.sku} • Min Alert: {p.minStock} {p.unit}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                          {physical} {p.unit}
                        </td>

                        <td className="py-3 px-4 text-center text-amber-600 font-semibold">
                          {reserved > 0 ? `${reserved} ${p.unit}` : '—'}
                        </td>

                        <td className="py-3 px-4 text-center text-rose-600 font-semibold">
                          {damaged > 0 ? `${damaged} ${p.unit}` : '—'}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 font-black text-sm">
                            <span
                              className={`${
                                isOut
                                  ? 'text-rose-600'
                                  : isLow
                                  ? 'text-amber-600'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {available} {p.unit}
                            </span>
                            {isLow && (
                              <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold text-amber-700">
                                LOW
                              </span>
                            )}
                            {isOut && (
                              <span className="rounded bg-rose-100 px-1 py-0.5 text-[9px] font-bold text-rose-700">
                                OUT
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(available * p.purchasePrice)}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenAdjust(p.id)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs"
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Movement Logs Table (Requirement #7 Audit trail) */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/50 text-slate-500">
                  <th className="py-3 px-4 font-semibold">Date & Time</th>
                  <th className="py-3 px-4 font-semibold">Product</th>
                  <th className="py-3 px-4 font-semibold">Movement Type</th>
                  <th className="py-3 px-4 font-semibold">Quantity Delta</th>
                  <th className="py-3 px-4 font-semibold">Stock Before → After</th>
                  <th className="py-3 px-4 font-semibold">Reason / Reference</th>
                  <th className="py-3 px-4 font-semibold text-right">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {stockMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(m.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {m.productName}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          m.type === 'STOCK_IN' || m.type === 'RETURNED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : m.type === 'SALE'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black">
                      <span
                        className={
                          m.type === 'SALE' || m.type === 'STOCK_OUT' || m.type === 'DAMAGE'
                            ? 'text-rose-600'
                            : 'text-emerald-600'
                        }
                      >
                        {m.type === 'SALE' || m.type === 'STOCK_OUT' || m.type === 'DAMAGE' ? '-' : '+'}
                        {m.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {m.previousStock} → {m.newStock}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {m.reason}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-medium">{m.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Record Stock Movement / Adjustment
              </h2>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjust} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Product *
                </label>
                <select
                  value={adjustForm.productId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Available: {p.stock} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Warehouse *
                </label>
                <select
                  value={adjustForm.warehouseId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, warehouseId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Adjustment Type *
                </label>
                <select
                  value={adjustForm.type}
                  onChange={(e) =>
                    setAdjustForm({ ...adjustForm, type: e.target.value as StockMovementType })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="STOCK_IN">Stock In (Addition / Fresh Supply)</option>
                  <option value="STOCK_OUT">Stock Out (Direct Manual Deduction)</option>
                  <option value="MANUAL_ADJUST">Manual Inventory Audit Count</option>
                  <option value="DAMAGE">Damaged Goods Deduction</option>
                  <option value="EXPIRED">Expired Stock Write-off</option>
                  <option value="LOSS">Unaccounted Loss / Shrinkage</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Quantity
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Reason & Audit Note *
                </label>
                <textarea
                  rows={2}
                  required
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  placeholder="e.g. Audit reconciliation by supervisor..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
