import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Building2,
  Sparkles,
  Building,
  Warehouse,
  Award,
  FolderTree,
  Boxes,
  Sliders,
  FileSpreadsheet,
  Database,
  SlidersHorizontal,
} from 'lucide-react';

import { BusinessProfileTab } from './BusinessProfileTab';
import { BusinessTemplatesTab } from './BusinessTemplatesTab';
import { BranchesTab } from './BranchesTab';
import { WarehousesTab } from './WarehousesTab';
import { BrandsTab } from './BrandsTab';
import { CategoriesTab } from './CategoriesTab';
import { UnitsTab } from './UnitsTab';
import { AttributesTab } from './AttributesTab';
import { CustomFieldsTab } from './CustomFieldsTab';
import { DataBackupTab } from './DataBackupTab';

export type SettingsTabId =
  | 'profile'
  | 'templates'
  | 'branches'
  | 'warehouses'
  | 'brands'
  | 'categories'
  | 'units'
  | 'attributes'
  | 'custom_fields'
  | 'backup';

export const SettingsView: React.FC = () => {
  const { businessType, businessProfile } = useERP();
  const [activeTab, setActiveTab] = useState<SettingsTabId>('templates');

  const tabs: Array<{ id: SettingsTabId; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'templates', label: 'Business Type & Templates', icon: <Sparkles className="w-4 h-4 text-emerald-500" />, badge: '20+' },
    { id: 'profile', label: 'Business Profile & Identity', icon: <Building2 className="w-4 h-4 text-blue-500" /> },
    { id: 'branches', label: 'Branches & Outlets', icon: <Building className="w-4 h-4 text-indigo-500" /> },
    { id: 'warehouses', label: 'Warehouses & Hubs', icon: <Warehouse className="w-4 h-4 text-purple-500" /> },
    { id: 'brands', label: 'Brands & Manufacturers', icon: <Award className="w-4 h-4 text-amber-500" /> },
    { id: 'categories', label: 'Categories & Hierarchy', icon: <FolderTree className="w-4 h-4 text-emerald-500" /> },
    { id: 'units', label: 'Units of Measure', icon: <Boxes className="w-4 h-4 text-purple-500" /> },
    { id: 'attributes', label: 'Product Attributes', icon: <Sliders className="w-4 h-4 text-cyan-500" /> },
    { id: 'custom_fields', label: 'Dynamic Custom Fields', icon: <FileSpreadsheet className="w-4 h-4 text-teal-500" /> },
    { id: 'backup', label: 'Master Data & Backup', icon: <Database className="w-4 h-4 text-slate-500" /> },
  ];

  return (
    <div id="settings-view" className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Universal Settings & Master Configuration
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
              {businessProfile.businessName || 'Universal ERP'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure industry business models, branch outlets, storage hubs, dynamic attributes, units, categories, and zero-loss backups.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
            <span>Active Sector: <strong className="capitalize">{businessType.replace('_', ' ')}</strong></span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive
                      ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      <div className="mt-4">
        {activeTab === 'templates' && <BusinessTemplatesTab />}
        {activeTab === 'profile' && <BusinessProfileTab />}
        {activeTab === 'branches' && <BranchesTab />}
        {activeTab === 'warehouses' && <WarehousesTab />}
        {activeTab === 'brands' && <BrandsTab />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'units' && <UnitsTab />}
        {activeTab === 'attributes' && <AttributesTab />}
        {activeTab === 'custom_fields' && <CustomFieldsTab />}
        {activeTab === 'backup' && <DataBackupTab />}
      </div>
    </div>
  );
};
