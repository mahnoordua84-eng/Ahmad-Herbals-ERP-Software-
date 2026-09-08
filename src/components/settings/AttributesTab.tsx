import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { ProductAttribute, AttributeInputType } from '../../types/businessConfig';
import {
  Sliders,
  Plus,
  Edit2,
  Archive,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Search,
  Eye,
  Receipt,
} from 'lucide-react';

export const AttributesTab: React.FC = () => {
  const {
    attributes,
    addAttribute,
    updateAttribute,
    archiveAttribute,
    restoreAttribute,
    deleteAttribute,
  } = useERP();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<ProductAttribute | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    type: AttributeInputType;
    valuesText: string;
    target: 'business_type' | 'category' | 'product';
    isRequired: boolean;
    showInPOS: boolean;
    showInInvoice: boolean;
    status: 'active' | 'archived';
  }>({
    name: '',
    code: '',
    type: 'text',
    valuesText: '',
    target: 'business_type',
    isRequired: false,
    showInPOS: true,
    showInInvoice: true,
    status: 'active',
  });

  const openAddModal = () => {
    setEditingAttr(null);
    setFormData({
      name: '',
      code: '',
      type: 'text',
      valuesText: '',
      target: 'business_type',
      isRequired: false,
      showInPOS: true,
      showInInvoice: true,
      status: 'active',
    });
    setModalOpen(true);
  };

  const openEditModal = (a: ProductAttribute) => {
    setEditingAttr(a);
    setFormData({
      name: a.name,
      code: a.code,
      type: a.type,
      valuesText: (a.values || []).join(', '),
      target: a.target || 'business_type',
      isRequired: a.isRequired || false,
      showInPOS: a.showInPOS !== false,
      showInInvoice: a.showInInvoice !== false,
      status: a.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    const values = formData.valuesText
      ? formData.valuesText.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    if (editingAttr) {
      await updateAttribute(editingAttr.id, {
        name: formData.name,
        code: formData.code,
        type: formData.type,
        values,
        target: formData.target,
        isRequired: formData.isRequired,
        showInPOS: formData.showInPOS,
        showInInvoice: formData.showInInvoice,
        status: formData.status,
      });
    } else {
      await addAttribute({
        name: formData.name,
        code: formData.code.toLowerCase().replace(/\s+/g, '_'),
        type: formData.type,
        values,
        target: formData.target,
        isRequired: formData.isRequired,
        showInPOS: formData.showInPOS,
        showInInvoice: formData.showInInvoice,
        status: formData.status,
      });
    }
    setModalOpen(false);
  };

  const filteredAttrs = attributes.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            Product Attributes & Technical Specifications
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure business-specific attributes (Vehicle Model, OEM Code, Shoe Size, Flavor, Color, Fabric, Warranty).
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm cursor-pointer active:scale-98 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Attribute Field
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search attributes by title or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Attributes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAttrs.map((a) => {
          const isArchived = a.status === 'archived';
          return (
            <div
              key={a.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                isArchived
                  ? 'border-dashed border-slate-300 dark:border-slate-800 opacity-70'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {a.code}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Type: {a.type}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{a.name}</h3>
                  {a.values && a.values.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {a.values.slice(0, 5).map((v, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-medium"
                        >
                          {v}
                        </span>
                      ))}
                      {a.values.length > 5 && (
                        <span className="text-[10px] text-slate-400">+{a.values.length - 5} more</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 mt-1 italic">Free text / input field</div>
                  )}
                </div>

                {/* Display Flags */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 text-[11px] text-slate-500">
                  <span className={`flex items-center gap-1 ${a.showInPOS !== false ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                    <Eye className="w-3 h-3" />
                    POS View
                  </span>
                  <span className={`flex items-center gap-1 ${a.showInInvoice !== false ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400'}`}>
                    <Receipt className="w-3 h-3" />
                    Invoice Print
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button
                  onClick={() => openEditModal(a)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 cursor-pointer"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {isArchived ? (
                  <button
                    onClick={() => restoreAttribute(a.id)}
                    className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 cursor-pointer"
                    title="Restore"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => archiveAttribute(a.id)}
                    className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 cursor-pointer"
                    title="Archive"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => deleteAttribute(a.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer"
                  title="Delete"
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
                {editingAttr ? `Edit Attribute: ${editingAttr.name}` : 'Add Product Attribute'}
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
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Attribute Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const code = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                    setFormData({ ...formData, name, code: formData.code || code });
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="e.g. Vehicle Model, Color, Shoe Size"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Code Key *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="vehicle_model"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Input Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as AttributeInputType })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="text">Text / Free Input</option>
                    <option value="dropdown">Dropdown Selection</option>
                    <option value="multiselect">Multi-Select Tags</option>
                    <option value="number">Numeric</option>
                    <option value="color">Color Palette</option>
                    <option value="size">Size Dimension</option>
                    <option value="date">Date</option>
                    <option value="boolean">Yes / No</option>
                  </select>
                </div>
              </div>

              {(formData.type === 'dropdown' || formData.type === 'multiselect' || formData.type === 'color' || formData.type === 'size') && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Preset Values / Options (Comma Separated)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.valuesText}
                    onChange={(e) => setFormData({ ...formData, valuesText: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="e.g. Corolla, Civic, Sportage, Yaris OR Small, Medium, Large, XL"
                  />
                </div>
              )}

              <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.showInPOS}
                    onChange={(e) => setFormData({ ...formData, showInPOS: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Show in POS Cashier Grid & Search</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.showInInvoice}
                    onChange={(e) => setFormData({ ...formData, showInInvoice: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Print on Customer Invoices & Receipts</span>
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
                {editingAttr ? 'Save Attribute' : 'Create Attribute'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
