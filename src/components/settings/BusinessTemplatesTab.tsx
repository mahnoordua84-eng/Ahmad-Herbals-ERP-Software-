import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { BusinessTemplate, BusinessTypeId } from '../../types/businessConfig';
import {
  Sparkles,
  CheckCircle2,
  Copy,
  Layers,
  ArrowRight,
  ShieldCheck,
  Search,
  Plus,
  Trash2,
  Eye,
  Sliders,
  Store,
  Tag,
  Boxes,
} from 'lucide-react';

export const BusinessTemplatesTab: React.FC = () => {
  const {
    businessTemplates,
    businessType,
    switchBusinessType,
    cloneBusinessTemplate,
    createCustomTemplate,
    deleteBusinessTemplate,
    categories,
    attributes,
    units,
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<BusinessTemplate | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<{ success: boolean; message: string } | null>(null);

  // Switch options
  const [mergeCategories, setMergeCategories] = useState(true);
  const [mergeAttributes, setMergeAttributes] = useState(true);
  const [mergeUnits, setMergeUnits] = useState(true);

  // Clone Modal
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [cloneTarget, setCloneTarget] = useState<BusinessTemplate | null>(null);
  const [clonedName, setClonedName] = useState('');

  // Create Custom Modal
  const [newTemplateModal, setNewTemplateModal] = useState(false);
  const [newCustomName, setNewCustomName] = useState('');
  const [newCustomDesc, setNewCustomDesc] = useState('');

  const filteredTemplates = businessTemplates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.badge?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeTemplate = businessTemplates.find((t) => t.id === businessType);

  const handleApplyTemplate = async (template: BusinessTemplate) => {
    if (template.id === businessType) return;
    setApplying(true);
    setApplyResult(null);

    const res = await switchBusinessType(template.type, {
      mergeCategories,
      mergeAttributes,
      mergeUnits,
    });

    setApplyResult(res);
    setApplying(false);
    setTimeout(() => setApplyResult(null), 5000);
  };

  const handleCloneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneTarget) return;
    cloneBusinessTemplate(cloneTarget.id, clonedName || `${cloneTarget.name} (Custom Copy)`);
    setCloneModalOpen(false);
    setCloneTarget(null);
    setClonedName('');
  };

  const handleCreateCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomName) return;
    createCustomTemplate({
      name: newCustomName,
      description: newCustomDesc || 'Tailored custom configuration for unique business model.',
      badge: 'Custom',
      type: 'custom',
    });
    setNewTemplateModal(false);
    setNewCustomName('');
    setNewCustomDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider backdrop-blur-xs">
                Zero Data Loss Guaranteed
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-emerald-950 text-[11px] font-bold uppercase tracking-wider">
                Active: {activeTemplate?.name || businessType}
              </span>
            </div>
            <h2 className="text-xl font-black mt-2">Universal Business Templates & Industry Presets</h2>
            <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">
              Switch this ERP between 20+ specialized industries (Auto Parts, Supermarket, Boutique, Pharmacy, Hardware, Restaurant, etc.). Existing products, historical orders, customers, and financial ledger remain 100% preserved.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setNewTemplateModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-emerald-800 font-bold text-xs hover:bg-emerald-50 shadow-sm cursor-pointer active:scale-98 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New Custom Template
            </button>
          </div>
        </div>

        {/* Current stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-white/20 text-xs">
          <div>
            <span className="text-emerald-200 block text-[11px]">Active Business Type</span>
            <span className="font-bold text-white text-sm">{activeTemplate?.name || businessType}</span>
          </div>
          <div>
            <span className="text-emerald-200 block text-[11px]">Installed Categories</span>
            <span className="font-bold text-white text-sm">{categories.length} Categories</span>
          </div>
          <div>
            <span className="text-emerald-200 block text-[11px]">Configured Attributes</span>
            <span className="font-bold text-white text-sm">{attributes.length} Fields</span>
          </div>
          <div>
            <span className="text-emerald-200 block text-[11px]">Units of Measure</span>
            <span className="font-bold text-white text-sm">{units.length} Units</span>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {applyResult && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border ${
            applyResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{applyResult.message}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-mono">Real-time Switch</span>
        </div>
      )}

      {/* Switch Presets Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates (e.g. Auto Parts, Pharmacy, Grocery, Shoes, Hardware)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-[11px] text-slate-400 uppercase tracking-wider">Merge on Apply:</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={mergeCategories}
              onChange={(e) => setMergeCategories(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Categories</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={mergeAttributes}
              onChange={(e) => setMergeAttributes(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Attributes</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={mergeUnits}
              onChange={(e) => setMergeUnits(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Units</span>
          </label>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((tpl) => {
          const isActive = tpl.id === businessType;
          return (
            <div
              key={tpl.id}
              className={`relative bg-white dark:bg-slate-900 rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                isActive
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {tpl.badge || 'Industry Preset'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      title="Inspect Preset Details"
                      onClick={() => setSelectedTemplate(tpl)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="Clone as Custom Copy"
                      onClick={() => {
                        setCloneTarget(tpl);
                        setClonedName(`${tpl.name} (Custom Copy)`);
                        setCloneModalOpen(true);
                      }}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {(tpl.id.startsWith('custom_') || tpl.id.startsWith('clone_')) && (
                      <button
                        title="Delete Custom Template"
                        onClick={() => {
                          if (confirm(`Delete custom template "${tpl.name}"?`)) {
                            deleteBusinessTemplate(tpl.id);
                          }
                        }}
                        className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-emerald-600" />
                  {tpl.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {tpl.description}
                </p>

                {/* Preset specs */}
                <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Categories</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {tpl.recommendedCategories.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Attributes</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {tpl.recommendedAttributes.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Units</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {tpl.recommendedUnits.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                {isActive ? (
                  <div className="w-full py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Currently Active
                  </div>
                ) : (
                  <button
                    disabled={applying}
                    onClick={() => handleApplyTemplate(tpl)}
                    className="w-full py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-emerald-600 dark:hover:bg-emerald-500 dark:hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>Apply This Template</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Inspect Template Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-5 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                  {selectedTemplate.badge || 'Template Details'}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">{selectedTemplate.name}</h3>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedTemplate.description}
            </p>

            {/* Recommended Categories */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                Recommended Product Categories ({selectedTemplate.recommendedCategories.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedTemplate.recommendedCategories.map((c, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Recommended Attributes */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                Recommended Attributes ({selectedTemplate.recommendedAttributes.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {selectedTemplate.recommendedAttributes.map((a, i) => (
                  <div key={i} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{a.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">Code: {a.code} | Type: {a.type}</div>
                    {a.values && a.values.length > 0 && (
                      <div className="text-[10px] text-slate-500 mt-1 truncate">
                        Options: {a.values.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Units */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-purple-600" />
                Units of Measure ({selectedTemplate.recommendedUnits.length})
              </h4>
              <div className="flex flex-wrap gap-2 text-xs">
                {selectedTemplate.recommendedUnits.map((u, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 font-mono text-slate-700 dark:text-slate-300">
                    {u.name} ({u.symbol})
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
              {selectedTemplate.id !== businessType && (
                <button
                  onClick={() => {
                    handleApplyTemplate(selectedTemplate);
                    setSelectedTemplate(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Apply This Template Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clone Modal */}
      {cloneModalOpen && cloneTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCloneSubmit} className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Clone Business Template</h3>
            <p className="text-xs text-slate-500">
              Create a custom, editable copy of &quot;{cloneTarget.name}&quot;. You can freely add or remove categories, attributes, and units.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Custom Template Name *</label>
              <input
                type="text"
                required
                value={clonedName}
                onChange={(e) => setClonedName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCloneModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
              >
                Create Cloned Template
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Custom Template Modal */}
      {newTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateCustomSubmit} className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Custom Industry Template</h3>
            <p className="text-xs text-slate-500">
              Define a blank custom template configuration for proprietary enterprise requirements.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Template Title *</label>
              <input
                type="text"
                required
                value={newCustomName}
                onChange={(e) => setNewCustomName(e.target.value)}
                placeholder="e.g. Specialty Solar Equipment"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
              <textarea
                rows={3}
                value={newCustomDesc}
                onChange={(e) => setNewCustomDesc(e.target.value)}
                placeholder="Describe business focus, product lines, and target audience..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewTemplateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
              >
                Save Custom Template
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
