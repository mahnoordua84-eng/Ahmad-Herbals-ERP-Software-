import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Settings,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Truck,
  Palette,
  Database,
  Download,
  Upload,
  RefreshCcw,
  CheckCircle2,
  Save,
  ShieldAlert,
} from 'lucide-react';
import { BrandSettings } from '../../types/erp';

export const SettingsView: React.FC = () => {
  const {
    brandSettings,
    updateBrandSettings,
    exportDatabaseJSON,
    importDatabaseJSON,
    resetToSeedData,
    t,
  } = useERP();

  const [form, setForm] = useState<BrandSettings>({ ...brandSettings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBrandSettings(form);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExport = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ahmad_herbals_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDatabaseJSON(content);
      if (success) {
        setImportStatus('Database successfully restored from file!');
      } else {
        setImportStatus('Invalid JSON backup file structure.');
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div id="settings-view" className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t('settings')} & Enterprise Profile
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure global business metadata, tax IDs, shipping thresholds, theme branding, and backup
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            <span>Settings Saved Live!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Business Identity & Contact */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <Building2 className="h-5 w-5 text-emerald-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Business Profile & Legal Entity
              </h2>
              <p className="text-[11px] text-slate-400">
                Printed on thermal receipts, invoices, export bills, and storefront
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Company / Trade Name *
              </label>
              <input
                type="text"
                required
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Brand Tagline
              </label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Official Phone / UAN *
              </label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Support Email Address *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Registered Street Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                City / Country
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                National Tax Number (NTN)
              </label>
              <input
                type="text"
                value={form.ntnNumber}
                onChange={(e) => setForm({ ...form, ntnNumber: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Sales Tax Registration (STRN)
              </label>
              <input
                type="text"
                value={form.strnNumber}
                onChange={(e) => setForm({ ...form, strnNumber: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Currency, Shipping & Tax */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <Truck className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Currency, Delivery & Taxes
              </h2>
              <p className="text-[11px] text-slate-400">
                Standard delivery logistics rates, sales tax rates, and free shipping triggers
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Currency Symbol
              </label>
              <input
                type="text"
                value={form.currencySymbol}
                onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Currency Code (ISO)
              </label>
              <input
                type="text"
                value={form.currencyCode}
                onChange={(e) => setForm({ ...form, currencyCode: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Standard Courier Delivery Fee (PKR)
              </label>
              <input
                type="number"
                value={form.standardDeliveryFee}
                onChange={(e) =>
                  setForm({ ...form, standardDeliveryFee: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Free Delivery Threshold (PKR)
              </label>
              <input
                type="number"
                value={form.freeDeliveryThreshold}
                onChange={(e) =>
                  setForm({ ...form, freeDeliveryThreshold: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Sales Tax / GST Rate (%)
              </label>
              <input
                type="number"
                value={form.taxRate}
                onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Brand Primary Accent Hex Color
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="h-9 w-12 rounded-lg border border-slate-200 p-0.5 cursor-pointer dark:border-slate-700"
                />
                <input
                  type="text"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-mono text-xs uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 cursor-pointer active:scale-98 transition-all"
          >
            <Save className="h-4 w-4" />
            <span>Save Settings Changes</span>
          </button>
        </div>
      </form>

      {/* Section 3: Backup & Database Recovery */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <Database className="h-5 w-5 text-purple-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Database Persistence & Snapshot Recovery
            </h2>
            <p className="text-[11px] text-slate-400">
              Download complete ERP state JSON, restore from existing snapshot or factory reset
            </p>
          </div>
        </div>

        {importStatus && (
          <div className="mt-4 rounded-xl bg-slate-100 p-3 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            {importStatus}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Export */}
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Export JSON Backup
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Downloads full catalog, inventory counts, orders, customers, and financial records.
              </p>
            </div>
            <button
              onClick={handleExport}
              className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              <span>Download Backup</span>
            </button>
          </div>

          {/* Import */}
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Restore From Backup
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Select a previously exported JSON backup file to overwrite current database.
              </p>
            </div>
            <label className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer">
              <Upload className="h-3.5 w-3.5 text-blue-600" />
              <span>Upload JSON</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Factory Reset */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 dark:border-rose-950 dark:bg-rose-950/20 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-rose-800 dark:text-rose-300">
                Factory Seed Reset
              </h3>
              <p className="text-[11px] text-rose-600/80 dark:text-rose-400 mt-1">
                Reset system back to initial Ahmad Herbals organic grains & herbs seed records.
              </p>
            </div>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    'Are you sure you want to restore factory seed data? This will reset all current modifications.'
                  )
                ) {
                  resetToSeedData();
                  alert('Reset successfully executed!');
                }
              }}
              className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-2 text-xs font-semibold text-white hover:bg-rose-700 cursor-pointer shadow-2xs"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              <span>Reset to Factory Seed</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
