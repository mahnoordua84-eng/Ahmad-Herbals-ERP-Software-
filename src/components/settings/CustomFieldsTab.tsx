import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { CustomField, CustomFieldEntityType } from '../../types/businessConfig';
import {
  FileSpreadsheet,
  Plus,
  Edit2,
  Trash2,
  Search,
  Package,
  Users,
  ShoppingCart,
  Truck,
} from 'lucide-react';

export const CustomFieldsTab: React.FC = () => {
  const {
    customFields,
    addCustomField,
    updateCustomField,
    deleteCustomField,
  } = useERP();

  const [activeEntity, setActiveEntity] = useState<CustomFieldEntityType>('product');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    key: string;
    entity: CustomFieldEntityType;
    type: 'text' | 'number' | 'date' | 'dropdown' | 'boolean';
    optionsText: string;
    isRequired: boolean;
    defaultValue: string;
    status: 'active' | 'archived';
  }>({
    name: '',
    key: '',
    entity: 'product',
    type: 'text',
    optionsText: '',
    isRequired: false,
    defaultValue: '',
    status: 'active',
  });

  const openAddModal = () => {
    setEditingField(null);
    setFormData({
      name: '',
      key: '',
      entity: activeEntity,
      type: 'text',
      optionsText: '',
      isRequired: false,
      defaultValue: '',
      status: 'active',
    });
    setModalOpen(true);
  };

  const openEditModal = (f: CustomField) => {
    setEditingField(f);
    setFormData({
      name: f.name,
      key: f.key,
      entity: f.entity,
      type: f.type,
      optionsText: (f.options || []).join(', '),
      isRequired: f.isRequired || false,
      defaultValue: f.defaultValue || '',
      status: f.status || 'active',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.key) return;

    const options = formData.optionsText
      ? formData.optionsText.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    if (editingField) {
      await updateCustomField(editingField.id, {
        name: formData.name,
        key: formData.key,
        entity: formData.entity,
        type: formData.type,
        options,
        isRequired: formData.isRequired,
        defaultValue: formData.defaultValue,
        status: formData.status,
      });
    } else {
      await addCustomField({
        name: formData.name,
        key: formData.key.toLowerCase().replace(/\s+/g, '_'),
        entity: formData.entity,
        type: formData.type,
        options,
        isRequired: formData.isRequired,
        defaultValue: formData.defaultValue,
        status: formData.status,
      });
    }
    setModalOpen(false);
  };

  const filteredFields = customFields.filter((f) => f.entity === activeEntity);

  const entityIcons: Record<CustomFieldEntityType, React.ReactNode> = {
    product: <Package className="w-4 h-4" />,
    customer: <Users className="w-4 h-4" />,
    order: <ShoppingCart className="w-4 h-4" />,
    supplier: <Truck className="w-4 h-4" />,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Dynamic Custom Fields Engine
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Attach proprietary data fields to Products, Customers, Orders, or Suppliers without database schema migrations.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm cursor-pointer active:scale-98 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Custom Field
        </button>
      </div>

      {/* Entity Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
        {(['product', 'customer', 'order', 'supplier'] as const).map((ent) => (
          <button
            key={ent}
            onClick={() => setActiveEntity(ent)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold capitalize transition-all cursor-pointer ${
              activeEntity === ent
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {entityIcons[ent]}
            <span>{ent} Fields</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeEntity === ent ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {customFields.filter((f) => f.entity === ent).length}
            </span>
          </button>
        ))}
      </div>

      {/* Fields List */}
      {filteredFields.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center">
          <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No custom fields configured for {activeEntity}s yet.
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Click &quot;Add Custom Field&quot; to append business-specific attributes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFields.map((f) => (
            <div
              key={f.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {f.key}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {f.type}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{f.name}</h3>
                  {f.defaultValue && (
                    <div className="text-[11px] text-slate-400 mt-1">
                      Default: <span className="font-mono text-slate-600 dark:text-slate-300">{f.defaultValue}</span>
                    </div>
                  )}
                  {f.options && f.options.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {f.options.map((opt, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-medium"
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {f.isRequired && (
                  <span className="inline-block text-[10px] font-bold text-rose-600 dark:text-rose-400">
                    * Required Field
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-1 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button
                  onClick={() => openEditModal(f)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 cursor-pointer"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteCustomField(f.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingField ? `Edit Field: ${editingField.name}` : `Add ${activeEntity} Custom Field`}
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
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Field Label *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const key = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                    setFormData({ ...formData, name, key: formData.key || key });
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="e.g. Engine Number, Loyalty Tier, Shipping Note"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Key Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase() })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="engine_number"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Data Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="text">Text String</option>
                    <option value="number">Numeric</option>
                    <option value="date">Date</option>
                    <option value="dropdown">Dropdown Options</option>
                    <option value="boolean">Boolean (Yes/No)</option>
                  </select>
                </div>
              </div>

              {formData.type === 'dropdown' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Dropdown Options (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={formData.optionsText}
                    onChange={(e) => setFormData({ ...formData, optionsText: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="e.g. Gold, Silver, Bronze"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Default Value</label>
                <input
                  type="text"
                  value={formData.defaultValue}
                  onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="Optional default value"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.isRequired}
                    onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Mark as mandatory field on forms</span>
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
                {editingField ? 'Save Field' : 'Create Field'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
