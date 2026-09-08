import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Branch } from '../../types/businessConfig';
import {
  Building,
  Plus,
  Edit2,
  Archive,
  RefreshCw,
  Trash2,
  AlertTriangle,
  MapPin,
  Phone,
  Mail,
  User,
  CheckCircle2,
  Search,
} from 'lucide-react';

export const BranchesTab: React.FC = () => {
  const {
    branches,
    addBranch,
    updateBranch,
    archiveBranch,
    restoreBranch,
    deleteBranch,
    warehouses,
  } = useERP();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('all');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Safe Delete alert state
  const [deleteError, setDeleteError] = useState<{ branchId: string; branchName: string; message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Branch>>({
    name: '',
    code: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    manager: '',
    openingDate: new Date().toISOString().split('T')[0],
    status: 'active',
  });

  const openAddModal = () => {
    setEditingBranch(null);
    setFormData({
      name: '',
      code: `BR-${(branches.length + 1).toString().padStart(2, '0')}`,
      city: 'Lahore',
      address: '',
      phone: '',
      email: '',
      manager: '',
      openingDate: new Date().toISOString().split('T')[0],
      status: 'active',
    });
    setEditModalOpen(true);
  };

  const openEditModal = (b: Branch) => {
    setEditingBranch(b);
    setFormData({ ...b });
    setEditModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    if (editingBranch) {
      await updateBranch(editingBranch.id, formData);
    } else {
      await addBranch(formData as Omit<Branch, 'id'>);
    }
    setEditModalOpen(false);
  };

  const handleDelete = async (b: Branch) => {
    setDeleteError(null);
    const res = await deleteBranch(b.id);
    if (!res.success) {
      setDeleteError({
        branchId: b.id,
        branchName: b.name,
        message: res.error || 'Cannot delete branch because active dependencies or linked warehouses exist.',
      });
    }
  };

  const filteredBranches = branches.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase());
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && b.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            Branches & Retail Outlets
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage physical branch locations, retail stores, managers, and assigned warehouses.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm cursor-pointer active:scale-98 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Branch Outlet
        </button>
      </div>

      {/* Safe Delete Dependency Warning Modal / Banner */}
      {deleteError && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs shadow-xs space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-amber-900 dark:text-amber-200">
                Safe Delete Enforced for &quot;{deleteError.branchName}&quot;
              </h4>
              <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                {deleteError.message}
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                To protect audit compliance and historical ledger integrity, active branches with historical references cannot be hard-deleted. We recommend archiving this branch to hide it from new sales while preserving all records.
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
                await archiveBranch(deleteError.branchId);
                setDeleteError(null);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Archive className="w-3.5 h-3.5" />
              Archive Branch Instead
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
            placeholder="Search branches by name, code, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'active', 'archived'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl font-bold capitalize transition-colors cursor-pointer ${
                filterStatus === s
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Branches List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBranches.map((b) => {
          const linkedWarehousesCount = warehouses.filter((w) => w.branchId === b.id).length;
          const isArchived = b.status === 'archived';

          return (
            <div
              key={b.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                isArchived
                  ? 'border-dashed border-slate-300 dark:border-slate-800 opacity-70'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {b.code}
                    </span>
                    {b.isDefault && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Default HQ
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isArchived
                        ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{b.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{b.address || b.city}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                  {b.phone && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{b.phone}</span>
                    </div>
                  )}
                  {b.manager && (
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{b.manager}</span>
                    </div>
                  )}
                  <div className="col-span-2 text-[11px] text-slate-400 mt-0.5">
                    Linked Warehouses: <strong className="text-slate-700 dark:text-slate-300">{linkedWarehousesCount}</strong>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1.5 pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button
                  onClick={() => openEditModal(b)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Edit Branch"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {isArchived ? (
                  <button
                    onClick={() => restoreBranch(b.id)}
                    className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950 text-emerald-600 cursor-pointer"
                    title="Restore Branch"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => archiveBranch(b.id)}
                    className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950 text-amber-600 cursor-pointer"
                    title="Archive Branch"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(b)}
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

      {/* Edit / Add Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingBranch ? `Edit Branch: ${editingBranch.name}` : 'Add New Branch Outlet'}
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Branch Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="e.g. DHA Phase 5 Store"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Branch Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono uppercase text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="BR-01"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Branch Manager</label>
                <input
                  type="text"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="e.g. Tariq Mehmood"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Full Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Contact Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.isDefault || false}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Primary Default HQ</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
              >
                {editingBranch ? 'Save Branch' : 'Create Branch'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
