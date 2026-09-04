import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Warehouse as WarehouseIcon,
  Plus,
  ArrowLeftRight,
  MapPin,
  User,
  Phone,
  Package,
  Boxes,
  Edit2,
  Trash2,
  X,
  Building,
} from 'lucide-react';
import { Warehouse } from '../../types/erp';

export const WarehousesView: React.FC = () => {
  const {
    warehouses,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
    warehouseInventory,
    products,
    transferStock,
    formatCurrency,
  } = useERP();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWh, setEditingWh] = useState<Warehouse | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Form states
  const [whForm, setWhForm] = useState({
    name: '',
    code: '',
    type: 'MAIN' as Warehouse['type'],
    address: '',
    city: 'Lahore',
    manager: '',
    phone: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const [transferForm, setTransferForm] = useState({
    productId: products[0]?.id || '',
    fromWarehouseId: warehouses[0]?.id || '',
    toWarehouseId: warehouses[1]?.id || '',
    quantity: 10,
    reason: 'Inter-branch stock replenishment',
  });

  const handleOpenAdd = () => {
    setEditingWh(null);
    setWhForm({
      name: '',
      code: `WH-${Math.floor(10 + Math.random() * 90)}`,
      type: 'BRANCH',
      address: '',
      city: 'Lahore',
      manager: '',
      phone: '0300-1234567',
      status: 'ACTIVE',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (wh: Warehouse) => {
    setEditingWh(wh);
    setWhForm({
      name: wh.name,
      code: wh.code,
      type: wh.type,
      address: wh.address,
      city: wh.city,
      manager: wh.manager || '',
      phone: wh.phone || '',
      status: wh.status,
    });
    setIsAddModalOpen(true);
  };

  const handleSaveWh = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWh) {
      updateWarehouse(editingWh.id, whForm);
    } else {
      addWarehouse(whForm);
    }
    setIsAddModalOpen(false);
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferForm.fromWarehouseId === transferForm.toWarehouseId) {
      alert('Source and destination warehouse cannot be the same.');
      return;
    }
    transferStock(
      transferForm.productId,
      transferForm.fromWarehouseId,
      transferForm.toWarehouseId,
      Number(transferForm.quantity),
      transferForm.reason
    );
    setIsTransferModalOpen(false);
  };

  return (
    <div id="warehouses-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Multi-Warehouse Network
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enterprise multi-site locations, regional hubs, and inter-branch stock logistics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 cursor-pointer shadow-2xs"
          >
            <ArrowLeftRight className="h-4 w-4 text-emerald-600" />
            <span>Transfer Stock</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Warehouse</span>
          </button>
        </div>
      </div>

      {/* Warehouse Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {warehouses.map((wh) => {
          const invForWh = warehouseInventory.filter((wi) => wi.warehouseId === wh.id);
          const totalUnits = invForWh.reduce((sum, wi) => sum + wi.physicalStock, 0);
          
          let totalValuation = 0;
          invForWh.forEach((wi) => {
            const prod = products.find((p) => p.id === wi.productId);
            if (prod) {
              totalValuation += wi.physicalStock * prod.purchasePrice;
            }
          });

          return (
            <div
              key={wh.id}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <WarehouseIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                        {wh.name}
                      </h2>
                      <span className="font-mono text-[11px] text-slate-400">Code: {wh.code}</span>
                    </div>
                  </div>

                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {wh.type}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{wh.address}, {wh.city}</span>
                  </div>
                  {wh.manager && (
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>Manager: {wh.manager}</span>
                    </div>
                  )}
                  {wh.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{wh.phone}</span>
                    </div>
                  )}
                </div>

                {/* Stock Stats */}
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">Stored Volume</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {totalUnits} Units
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">Asset Valuation</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(totalValuation)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Operational
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(wh)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete warehouse "${wh.name}"?`)) {
                        deleteWarehouse(wh.id);
                      }
                    }}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Warehouse Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingWh ? 'Edit Warehouse Location' : 'Add Warehouse Location'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWh} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Location Name *
                </label>
                <input
                  type="text"
                  required
                  value={whForm.name}
                  onChange={(e) => setWhForm({ ...whForm, name: e.target.value })}
                  placeholder="e.g. Central Herbs Distribution Hub"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Code
                </label>
                <input
                  type="text"
                  value={whForm.code}
                  onChange={(e) => setWhForm({ ...whForm, code: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Type
                </label>
                <select
                  value={whForm.type}
                  onChange={(e) => setWhForm({ ...whForm, type: e.target.value as Warehouse['type'] })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="MAIN">Main Central Warehouse</option>
                  <option value="FACTORY">Processing & Mill Factory</option>
                  <option value="STORE">Retail Outlet / Storefront</option>
                  <option value="DISTRIBUTION_CENTER">Regional Distribution Center</option>
                  <option value="BRANCH">Regional Branch</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Address
                </label>
                <input
                  type="text"
                  value={whForm.address}
                  onChange={(e) => setWhForm({ ...whForm, address: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    City
                  </label>
                  <input
                    type="text"
                    value={whForm.city}
                    onChange={(e) => setWhForm({ ...whForm, city: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Manager Name
                  </label>
                  <input
                    type="text"
                    value={whForm.manager}
                    onChange={(e) => setWhForm({ ...whForm, manager: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
                >
                  Save Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inter-Warehouse Stock Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Inter-Warehouse Stock Transfer
              </h2>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmTransfer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Product *
                </label>
                <select
                  value={transferForm.productId}
                  onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Source Warehouse *
                  </label>
                  <select
                    value={transferForm.fromWarehouseId}
                    onChange={(e) => setTransferForm({ ...transferForm, fromWarehouseId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Destination *
                  </label>
                  <select
                    value={transferForm.toWarehouseId}
                    onChange={(e) => setTransferForm({ ...transferForm, toWarehouseId: e.target.value })}
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Transfer Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm({ ...transferForm, quantity: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Transfer Note & Authorization
                </label>
                <textarea
                  rows={2}
                  required
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  placeholder="e.g. Dispatched via transit vehicle LHR-5541"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
