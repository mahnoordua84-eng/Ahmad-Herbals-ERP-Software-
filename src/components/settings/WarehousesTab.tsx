import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Warehouse } from '../../types/erp';
import {
  Warehouse as WarehouseIcon,
  Plus,
  Edit2,
  Archive,
  RefreshCw,
  Trash2,
  AlertTriangle,
  MapPin,
  Building,
  Package,
  Search,
} from 'lucide-react';

export const WarehousesTab: React.FC = () => {
  const {
    warehouses,
    branches,
    addWarehouse,
    updateWarehouse,
    archiveWarehouse,
    restoreWarehouse,
    safeDeleteWarehouse,
    products,
  } = useERP();

  const [search, setSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  // Safe Delete Alert State
  const [deleteError, setDeleteError] = useState<{ id: string; name: string; message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Warehouse>>({
    name: '',
    code: '',
    location: '',
    branchId: '',
    type: 'STORE',
    capacity: 5000,
    isActive: true,
  });

  const openAddModal = () => {
    setEditingWarehouse(null);
    setFormData({
      name: '',
      code: `WH-${(warehouses.length + 1).toString().padStart(2, '0')}`,
      location: 'Lahore',
      branchId: branches[0]?.id || '',
      type: 'STORE',
      capacity: 5000,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (w: Warehouse) => {
    setEditingWarehouse(w);
    setFormData({ ...w });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    if (editingWarehouse) {
      updateWarehouse(editingWarehouse.id, formData);
    } else {
      addWarehouse({
        name: formData.name!,
        code: formData.code!,
        location: formData.location || 'Lahore',
        branchId: formData.branchId || branches[0]?.id || 'main-branch',
        type: formData.type || 'STORE',
        capacity: formData.capacity || 5000,
        isActive: formData.isActive !== false,
      });
    }
    setModalOpen(false);
  };

  const handleDelete = async (w: Warehouse) => {
    setDeleteError(null);
    const res = await safeDeleteWarehouse(w.id);
    if (!res.success) {
      setDeleteError({
        id: w.id,
        name: w.name,
        message: res.error || 'Cannot delete warehouse because active stock or inventory transactions exist.',
      });
    }
  };

  const filteredWarehouses = warehouses.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.code.toLowerCase().includes(search.toLowerCase()) ||
      w.location.toLowerCase().includes(search.toLowerCase());
    if (filterBranch === 'all') return matchesSearch;
    return matchesSearch && w.branchId === filterBranch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <WarehouseIcon className="w-5 h-5 text-purple-600" />
            Warehouses & Storage Facilities
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure multi-location warehouses, retail store backrooms, fulfillment centers, and linked branches.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm cursor-pointer active:scale-98 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Warehouse Facility
        </button>
      </div>

      {/* Safe Delete Dependency Warning Modal / Banner */}
      {deleteError && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs shadow-xs space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-amber-900 dark:text-amber-200">
                Safe Delete Enforced for Warehouse &quot;{deleteError.name}&quot;
              </h4>
              <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                {deleteError.message}
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Physical inventory records and stock ledger entries exist in this facility. To maintain audit compliance, please archive this warehouse to deactivate stock movements while protecting historical reports.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200 dark:border-amber-800/60">
            <button
              onClick={() => setDeleteError(null)}
              className="px-3 py-1.5 rounded-lg text-amber-800 dark:text-amber-300 font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/60 cursor-pointer"
            >
              Dismiss
            </button>
            <button
              onClick={async () => {
                await archiveWarehouse(deleteError.id);
                setDeleteError(null);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Archive className="w-3.5 h-3.5" />
              Archive Warehouse Instead
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search warehouses by name, code, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Branch:</span>
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 font-medium"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWarehouses.map((w) => {
          const linkedBranch = branches.find((b) => b.id === w.branchId);
          // Calculate stock in this warehouse
          const totalUnitsInWarehouse = products.reduce((acc, p) => {
            const locStock = p.locationStock?.[w.id] || 0;
            return acc + locStock;
          }, 0);
          const isArchived = w.isActive === false;

          return (
            <div
              key={w.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                isArchived
                  ? 'border-dashed border-slate-300 dark:border-slate-800 opacity-70'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    {w.code}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isArchived
                        ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {isArchived ? 'Archived' : 'Active'}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{w.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{w.location}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Linked Branch:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                      {linkedBranch ? linkedBranch.name : 'Central/Unassigned'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Facility Type:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase font-mono text-[11px]">
                      {w.type || 'STORE'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Current In-Stock:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {totalUnitsInWarehouse} Units
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1.5 pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button
                  onClick={() => openEditModal(w)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Edit Warehouse"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {isArchived ? (
                  <button
                    onClick={() => restoreWarehouse(w.id)}
                    className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950 text-emerald-600 cursor-pointer"
                    title="Restore Warehouse"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => archiveWarehouse(w.id)}
                    className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950 text-amber-600 cursor-pointer"
                    title="Archive Warehouse"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(w)}
                  className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 cursor-pointer"
                  title="Safe Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingWarehouse ? `Edit Warehouse: ${editingWarehouse.name}` : 'Add New Warehouse'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Warehouse Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="e.g. Central Herbs Storage"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono uppercase text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="WH-01"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Parent Branch *</label>
                <select
                  value={formData.branchId || ''}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Location / City</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Facility Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="MAIN">Central Fulfillment Hub</option>
                  <option value="STORE">Storefront Stockroom</option>
                  <option value="QUARANTINE">Transit / Quality Control</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Max Capacity (Units)</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.isActive !== false}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Active for Sales & Stock Movements</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
              >
                {editingWarehouse ? 'Save Warehouse' : 'Create Warehouse'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
