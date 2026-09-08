import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { BusinessProfile } from '../../types/businessConfig';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Save,
  CheckCircle2,
  Receipt,
  Globe,
  Hash,
} from 'lucide-react';

export const BusinessProfileTab: React.FC = () => {
  const {
    businessProfile,
    updateBusinessProfile,
    brandSettings,
    updateBrandSettings,
  } = useERP();

  const [form, setForm] = useState<BusinessProfile>({
    ...businessProfile,
    businessName: businessProfile.businessName || brandSettings.businessName || 'Ahmad Herbals & Super Store',
    tagline: businessProfile.tagline || brandSettings.tagline || 'Universal Multi-Business ERP',
    phone: businessProfile.phone || brandSettings.phone || '+92 300 1234567',
    email: businessProfile.email || brandSettings.email || 'info@ahmadherbals.com',
    address: businessProfile.address || brandSettings.address || 'Circular Road, Herbal Market',
    city: businessProfile.city || brandSettings.city || 'Lahore, Pakistan',
    currency: businessProfile.currency || brandSettings.currencyCode || 'PKR',
    currencySymbol: businessProfile.currencySymbol || brandSettings.currencySymbol || 'Rs.',
    ntn: businessProfile.ntn || brandSettings.ntnNumber || '',
    strn: businessProfile.strn || brandSettings.strnNumber || '',
  });

  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessProfile(form);
    updateBrandSettings({
      businessName: form.businessName,
      tagline: form.tagline,
      phone: form.phone,
      email: form.email,
      address: form.address,
      city: form.city,
      currencyCode: form.currency,
      currencySymbol: form.currencySymbol,
      ntnNumber: form.ntn,
      strnNumber: form.strn,
      primaryColor: form.primaryColor || brandSettings.primaryColor,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Universal Business Identity & Global Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure primary business branding, legal credentials, addresses, prefixes, and currency formatting.
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            Profile Updated Live!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Identity */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">General & Trade Identity</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Business / Trade Name *
              </label>
              <input
                type="text"
                required
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="e.g. Ahmad Herbals & Super Store"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Legal Registered Entity Name
              </label>
              <input
                type="text"
                value={form.legalBusinessName || ''}
                onChange={(e) => setForm({ ...form, legalBusinessName: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="e.g. Ahmad Herbals Private Limited"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Tagline / Slogan
              </label>
              <input
                type="text"
                value={form.tagline || ''}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="e.g. Pure Nature & Trusted Retail"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Owner / Managing Director
              </label>
              <input
                type="text"
                value={form.ownerName || ''}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="e.g. M. Ahmad"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Business Logo URL
              </label>
              <input
                type="text"
                value={form.logo || ''}
                onChange={(e) => setForm({ ...form, logo: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="https://... /logo.png"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Primary Brand Color
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={form.primaryColor || '#059669'}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="h-9 w-12 rounded-lg border border-slate-200 p-0.5 cursor-pointer dark:border-slate-700"
                />
                <input
                  type="text"
                  value={form.primaryColor || '#059669'}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs uppercase text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Physical Address */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Phone className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Communication & Physical Address</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Official Phone / UAN *</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">WhatsApp Hotline</label>
              <input
                type="text"
                value={form.whatsapp || ''}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="+92 300 0000000"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Support / Billing Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Website URL</label>
              <input
                type="text"
                value={form.website || ''}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Street / Area Address *</label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">City / Country *</label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Currency & Tax IDs */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <FileText className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Currency, Tax Registration & Document Prefixes</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Currency Symbol</label>
              <input
                type="text"
                required
                value={form.currencySymbol}
                onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="Rs. or $ or AED"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">ISO Currency Code</label>
              <input
                type="text"
                required
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono uppercase text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="PKR"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">National Tax Number (NTN)</label>
              <input
                type="text"
                value={form.ntn || ''}
                onChange={(e) => setForm({ ...form, ntn: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="1234567-8"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Sales Tax (STRN)</label>
              <input
                type="text"
                value={form.strn || ''}
                onChange={(e) => setForm({ ...form, strn: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="03-00-1234-567-89"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Invoice Prefix</label>
              <input
                type="text"
                value={form.invoicePrefix || 'INV-'}
                onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Order Prefix</label>
              <input
                type="text"
                value={form.orderPrefix || 'ORD-'}
                onChange={(e) => setForm({ ...form, orderPrefix: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Customer Code Prefix</label>
              <input
                type="text"
                value={form.customerPrefix || 'CUST-'}
                onChange={(e) => setForm({ ...form, customerPrefix: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Supplier Code Prefix</label>
              <input
                type="text"
                value={form.supplierPrefix || 'SUP-'}
                onChange={(e) => setForm({ ...form, supplierPrefix: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Live Thermal Receipt Header Preview */}
        <div className="bg-slate-100 dark:bg-slate-800/50 p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Live Receipt & POS Header Preview
              </span>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              Auto-Synced
            </span>
          </div>

          <div className="mt-3 max-w-sm mx-auto bg-white p-4 rounded-lg shadow-xs text-center font-mono text-slate-900 text-xs border border-slate-200">
            <div className="font-extrabold text-sm uppercase tracking-wider">{form.businessName || 'BUSINESS NAME'}</div>
            {form.tagline && <div className="text-[10px] text-slate-500 italic mt-0.5">{form.tagline}</div>}
            <div className="text-[11px] mt-1">{form.address}, {form.city}</div>
            <div className="text-[11px]">Tel: {form.phone}</div>
            {form.ntn && <div className="text-[10px] text-slate-600 mt-1">NTN: {form.ntn} | STRN: {form.strn || 'N/A'}</div>}
            <div className="my-2 border-b border-dashed border-slate-400"></div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>{form.invoicePrefix || 'INV-'}2026-001</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm cursor-pointer active:scale-98 transition-all"
          >
            <Save className="w-4 h-4" />
            Save Profile & Metadata
          </button>
        </div>
      </form>
    </div>
  );
};
