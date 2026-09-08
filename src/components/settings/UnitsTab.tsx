import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { UnitOfMeasure } from '../../types/businessConfig';
import {
  Boxes,
  Plus,
  Edit2,
  Archive,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Search,
} from 'lucide-react';

export const UnitsTab: React.FC = () => {
  const {
    units,
    addUnit,
    updateUnit,
    archiveUnit,
    restoreUnit,
    deleteUnit,
    products,
  } = useERP();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitOfMeasure | null>(null);
  const [deleteError, setDeleteError] = useState<{ id: string; name: string; message: string } | null>(null);

  const [formData, setFormData] = useState<Partial<UnitOfMeasure>>({
    name: '',
    code: '',
    symbol: '',
    isDefault: false,
    status: 'active',
  });

  const openAddModal = () => {
    setEditingUnit(null);
    setFormData({
      name: '',
      code: '',
      symbol: '',
      isDefault: false,
      status: 'active',
    });
    setModalOpen(true);
  };

  const openEditModal = (u: UnitOfMeasure) => {
    setEditingUnit(u);
    setFormData({ ...u });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.symbol) return;

    if (editingUnit) {
      await updateUnit(editingUnit.id, formData);
    } else {
      await addUnit({
        name: formData.name,
        code: formData.code.toLowerCase(),
        symbol: formData.symbol.toUpperCase(),
        isDefault: formData.isDefault || false,
        status: formData.status || 'active',
      });
    }
    setModalOpen(false);
  };

  const handleDelete = async (u: UnitOfMeasure) => {
    setDeleteError(null);
    const inUse = products.some(
      (p) => p.unit?.toLowerCase() === u.code.toLowerCase() || p.unit?.toLowerCase() === u.symbol.toLowerCase()
    );

    if (inUse) {
      setDeleteError({
        id: u.id,
        name: u.name,
        message: `Unit "${u.name}" (${u.symbol}) is currently assigned to existing inventory products. Archiving will hide it from new products while keeping existing product definitions intact.`,
      });
      return;
    }

    const res = await deleteUnit(u.id);
    if (!res.success) {
      setDeleteError({
        id: u.id,
        name: u.name,
        message: res.error || 'Cannot delete unit.',
      });
    }
  };

  const filteredUnits = units.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.code.toLowerCase().includes(search.toLowerCase()) ||
      u.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-purple-600" />
            Units of Measure (UoM)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure discrete, weight, volumetric, and bulk units (PCS, KG, Liter, Box, Pair, Dozen, Roll).
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm cursor-pointer active:scale-98 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Unit of Measure
        </button>
      </div>

      {/* Safe Delete Warning */}
      {deleteError && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs shadow-xs space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-amber-900 dark:text-amber-200">
                Safe Delete Enforced for Unit &quot;{deleteError.name}&quot;
              </h4>
              <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                {deleteError.message}
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
                await archiveUnit(deleteError.id);
                setDeleteError(null);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Archive className="w-3.5 h-3.5" />
              Archive Unit Instead
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search units (e.g. piece, kg, box, pair, meter)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredUnits.map((u) => {
          const isArchived = u.status === 'archived';
          return (
            <div
              key={u.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                isArchived
                  ? 'border-dashed border-slate-300 dark:border-slate-800 opacity-70'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    {u.symbol}
                  </span>
                  {u.isDefault && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Default
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{u.name}</h3>
                  <div className="text-[11px] text-slate-400 font-mono">Code: {u.code}</div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1 pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button
                  onClick={() => openEditModal(u)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 cursor-pointer"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {isArchived ? (
                  <button
                    onClick={() => restoreUnit(u.id)}
                    className="p-1 rounded-lg hover:bg-emerald-50 text-emerald-600 cursor-pointer"
                    title="Restore"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => archiveUnit(u.id)}
                    className="p-1 rounded-lg hover:bg-amber-50 text-amber-600 cursor-pointer"
                    title="Archive"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(u)}
                  className="p-1 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer"
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
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingUnit ? `Edit Unit: ${editingUnit.name}` : 'Add Unit of Measure'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Unit Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="e.g. Kilogram, Piece, Meter, Pair"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="kg, pcs, pair"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Display Symbol *</label>
                  <input
                    type="text"
                    required
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono uppercase text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="KG, PCS, PR"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.isDefault || false}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Set as Default Unit for New Products</span>
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
                {editingUnit ? 'Save Unit' : 'Create Unit'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
