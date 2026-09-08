import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Category } from '../../types/erp';
import {
  FolderTree,
  Plus,
  Edit2,
  Archive,
  RefreshCw,
  Trash2,
  AlertTriangle,
  ArrowRight,
  Package,
  Search,
} from 'lucide-react';

export const CategoriesTab: React.FC = () => {
  const {
    categories,
    addCategory,
    updateCategory,
    archiveCategory,
    restoreCategory,
    safeDeleteCategory,
    products,
    updateProduct,
  } = useERP();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Safe Delete & Reassign State
  const [deleteConflict, setDeleteConflict] = useState<{
    category: Category;
    affectedProductIds: string[];
    message: string;
  } | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState('');

  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    slug: '',
    description: '',
    parentId: undefined,
    status: 'ACTIVE',
  });

  const openAddModal = (parentId?: string) => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      parentId: parentId,
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const openEditModal = (c: Category) => {
    setEditingCategory(c);
    setFormData({ ...c });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    if (editingCategory) {
      updateCategory(editingCategory.id, { ...formData, slug });
    } else {
      addCategory({
        name: formData.name,
        slug,
        description: formData.description || '',
        parentId: formData.parentId,
        status: formData.status || 'ACTIVE',
      });
    }
    setModalOpen(false);
  };

  const handleDelete = async (c: Category) => {
    setDeleteConflict(null);
    const affected = products.filter(
      (p) => p.categoryId === c.id || p.category?.toLowerCase() === c.name.toLowerCase()
    );

    if (affected.length > 0) {
      const otherCats = categories.filter((other) => other.id !== c.id);
      setDeleteConflict({
        category: c,
        affectedProductIds: affected.map((p) => p.id),
        message: `${affected.length} products currently belong to category "${c.name}".`,
      });
      setReassignTargetId(otherCats[0]?.id || '');
      return;
    }

    await safeDeleteCategory(c.id);
  };

  const handleReassignAndDelete = async () => {
    if (!deleteConflict || !reassignTargetId) return;
    const targetCat = categories.find((c) => c.id === reassignTargetId);
    if (!targetCat) return;

    // Reassign all affected products
    for (const pid of deleteConflict.affectedProductIds) {
      updateProduct(pid, {
        categoryId: targetCat.id,
        category: targetCat.name,
      });
    }

    // Now delete safely
    await safeDeleteCategory(deleteConflict.category.id);
    setDeleteConflict(null);
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const rootCategories = filteredCategories.filter((c) => !c.parentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-emerald-600" />
            Product Categories & Hierarchy
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organize catalog into main departments, retail aisles, and nested subcategories with zero hardcoded locks.
          </p>
        </div>
        <button
          onClick={() => openAddModal()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm cursor-pointer active:scale-98 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Root Category
        </button>
      </div>

      {/* Safe Delete & Product Reassignment Modal */}
      {deleteConflict && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Cannot Directly Delete Category
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {deleteConflict.message} Deleting it directly would leave products uncategorized.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-3 text-xs">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Option A: Reassign Affected Products To:
              </label>
              <select
                value={reassignTargetId}
                onChange={(e) => setReassignTargetId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {categories
                  .filter((c) => c.id !== deleteConflict.category.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
              <button
                onClick={handleReassignAndDelete}
                className="w-full py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                Reassign & Delete &quot;{deleteConflict.category.name}&quot;
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={() => setDeleteConflict(null)}
                className="px-3 py-1.5 text-slate-500 hover:text-slate-700 cursor-pointer font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await archiveCategory(deleteConflict.category.id);
                  setDeleteConflict(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 cursor-pointer flex items-center gap-1.5"
              >
                <Archive className="w-3.5 h-3.5" />
                Archive Category Instead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories by title or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Categories Hierarchy List */}
      <div className="space-y-3">
        {rootCategories.map((root) => {
          const subcategories = filteredCategories.filter((c) => c.parentId === root.id);
          const rootProducts = products.filter(
            (p) => p.categoryId === root.id || p.category?.toLowerCase() === root.name.toLowerCase()
          ).length;
          const isArchived = root.status === 'ARCHIVED';

          return (
            <div
              key={root.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-xs space-y-3 ${
                isArchived ? 'opacity-70 border-dashed' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Root Row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 font-bold text-xs">
                    {root.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{root.name}</h3>
                      <span className="font-mono text-[10px] text-slate-400">/{root.slug}</span>
                      {isArchived && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Archived
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {rootProducts} Direct Products | {subcategories.length} Subcategories
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    onClick={() => openAddModal(root.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Subcategory
                  </button>
                  <button
                    onClick={() => openEditModal(root)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {isArchived ? (
                    <button
                      onClick={() => restoreCategory(root.id)}
                      className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => archiveCategory(root.id)}
                      className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(root)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Nested Subcategories */}
              {subcategories.length > 0 && (
                <div className="pl-6 border-l-2 border-slate-100 dark:border-slate-800 space-y-2 pt-1">
                  {subcategories.map((sub) => {
                    const subProducts = products.filter(
                      (p) => p.categoryId === sub.id || p.category?.toLowerCase() === sub.name.toLowerCase()
                    ).length;

                    return (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{sub.name}</span>
                          <span className="font-mono text-[10px] text-slate-400">/{sub.slug}</span>
                          <span className="text-[10px] text-slate-500">({subProducts} products)</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(sub)}
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(sub)}
                            className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create Category'}
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
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Category Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    setFormData({ ...formData, name, slug: formData.slug || slug });
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="e.g. Engine Parts, Herbal Oils, Men Footwear"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">URL Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Parent Category</label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value || undefined })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">None (Top-Level Root Category)</option>
                  {categories
                    .filter((c) => !c.parentId && (!editingCategory || c.id !== editingCategory.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
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
                {editingCategory ? 'Save Category' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
