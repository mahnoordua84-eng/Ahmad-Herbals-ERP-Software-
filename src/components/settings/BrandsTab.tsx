import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Brand } from '../../types/erp';
import {
  Award,
  Plus,
  Edit2,
  Archive,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Globe,
  Package,
  Search,
} from 'lucide-react';

export const BrandsTab: React.FC = () => {
  const {
    brands,
    addBrand,
    updateBrand,
    archiveBrand,
    restoreBrand,
    safeDeleteBrand,
    products,
  } = useERP();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deleteError, setDeleteError] = useState<{ id: string; name: string; message: string } | null>(null);

  const [formData, setFormData] = useState<Partial<Brand>>({
    name: '',
    code: '',
    originCountry: 'Pakistan',
    description: '',
    website: '',
    status: 'ACTIVE',
  });

  const openAddModal = () => {
    setEditingBrand(null);
    setFormData({
      name: '',
      code: `BRD-${(brands.length + 1).toString().padStart(2, '0')}`,
      originCountry: 'Pakistan',
      description: '',
      website: '',
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const openEditModal = (b: Brand) => {
    setEditingBrand(b);
    setFormData({ ...b });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingBrand) {
      updateBrand(editingBrand.id, formData);
    } else {
      addBrand({
        name: formData.name!,
        code: formData.code || formData.name!.slice(0, 3).toUpperCase(),
        originCountry: formData.originCountry || 'Pakistan',
        description: formData.description || '',
        website: formData.website || '',
        status: formData.status || 'ACTIVE',
      });
    }
    setModalOpen(false);
  };

  const handleDelete = async (b: Brand) => {
    setDeleteError(null);
    const res = await safeDeleteBrand(b.id);
    if (!res.success) {
      setDeleteError({
        id: b.id,
        name: b.name,
        message: res.error || 'Cannot delete brand because products are currently assigned to it.',
      });
    }
  };

  const filteredBrands = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            Brands & Manufacturers
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure manufacturer brands, OEM labels, and private trademarks for multi-product categorization.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm cursor-pointer active:scale-98 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Brand
        </button>
      </div>

      {/* Safe Delete Warning */}
      {deleteError && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs shadow-xs space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-amber-900 dark:text-amber-200">
                Safe Delete Blocked for Brand &quot;{deleteError.name}&quot;
              </h4>
              <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                {deleteError.message}
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Catalog items reference this brand in catalog filters, customer receipts, and historical invoices. Archiving will hide the brand from new product creation while maintaining historical clarity.
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
                await archiveBrand(deleteError.id);
                setDeleteError(null);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Archive className="w-3.5 h-3.5" />
              Archive Brand Instead
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
            placeholder="Search brands by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Brands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBrands.map((b) => {
          const linkedProducts = products.filter(
            (p) => p.brandId === b.id || p.brand?.toLowerCase() === b.name.toLowerCase()
          ).length;
          const isArchived = b.status === 'ARCHIVED';

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
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                    {b.code || 'BRAND'}
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
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{b.name}</h3>
                  {b.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{b.description}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>Origin: <strong className="text-slate-700 dark:text-slate-300">{b.originCountry || 'Global'}</strong></span>
                  <span>Products: <strong className="text-emerald-600 dark:text-emerald-400">{linkedProducts}</strong></span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1.5 pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button
                  onClick={() => openEditModal(b)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Edit Brand"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {isArchived ? (
                  <button
                    onClick={() => restoreBrand(b.id)}
                    className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950 text-emerald-600 cursor-pointer"
                    title="Restore Brand"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => archiveBrand(b.id)}
                    className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950 text-amber-600 cursor-pointer"
                    title="Archive Brand"
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingBrand ? `Edit Brand: ${editingBrand.name}` : 'Add New Brand'}
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
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="e.g. Qarshi, Toyota, Philips, Nestle"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Brand Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono uppercase text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="e.g. QRS"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Country of Origin</label>
                <input
                  type="text"
                  value={formData.originCountry}
                  onChange={(e) => setFormData({ ...formData, originCountry: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="e.g. Pakistan, Japan, Germany"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Website / URL</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
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
                {editingBrand ? 'Save Brand' : 'Create Brand'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
