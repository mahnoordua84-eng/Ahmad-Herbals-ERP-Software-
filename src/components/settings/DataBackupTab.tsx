import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Database,
  Download,
  Upload,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  ShieldAlert,
} from 'lucide-react';

export const DataBackupTab: React.FC = () => {
  const {
    exportMasterData,
    importMasterData,
    exportDatabaseJSON,
    importDatabaseJSON,
    resetToSeedData,
  } = useERP();

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  const handleExportMaster = () => {
    const jsonStr = exportMasterData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `universal_master_config_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleExportFullDB = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `erp_complete_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleMasterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = await importMasterData(content, importMode);
      setImportStatus(res.message);
      setTimeout(() => setImportStatus(null), 5000);
    };
    reader.readAsText(file);
  };

  const handleFullDBUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDatabaseJSON(content);
      if (success) {
        setImportStatus('Full ERP database successfully restored from snapshot!');
      } else {
        setImportStatus('Invalid JSON backup file structure.');
      }
      setTimeout(() => setImportStatus(null), 5000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-600" />
          Master Configuration Export, Import & Database Snapshots
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Migrate master configuration between test and production instances, or create full system snapshots.
        </p>
      </div>

      {importStatus && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Part 1: Universal Master Configuration Import/Export */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <FileCode className="w-4 h-4 text-emerald-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Universal Master Configuration (Portability JSON)
            </h3>
            <p className="text-[11px] text-slate-400">
              Exports/Imports Profile, Branches, Warehouses, Categories, Brands, Units, Attributes, and Custom Fields.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Export Master */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">Export Master Data JSON</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Generates a clean JSON manifest of all business settings and master lookup catalogs for distribution across stores.
              </p>
            </div>
            <button
              onClick={handleExportMaster}
              className="mt-4 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              Download Master Data JSON
            </button>
          </div>

          {/* Import Master */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white">Import Master Data JSON</h4>
                <div className="flex items-center gap-2 text-[11px]">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-emerald-600"
                    />
                    <span>Merge</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-emerald-600"
                    />
                    <span>Replace</span>
                  </label>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Upload a master config JSON file. {importMode === 'merge' ? 'Appends new entities without overwriting existing.' : 'Overwrites existing configuration catalogs.'}
              </p>
            </div>

            <label className="mt-4 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-100 cursor-pointer shadow-xs">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Select File & Import</span>
              <input type="file" accept=".json" onChange={handleMasterUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Part 2: Complete System Database Snapshots */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Database className="w-4 h-4 text-purple-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Full System Database Snapshots & Factory Reset
            </h3>
            <p className="text-[11px] text-slate-400">
              Complete snapshot including inventory products, transactions, sales, customers, suppliers, and ledger.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Full Export */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">Full Database Backup</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Downloads complete ERP database state JSON including all transactional orders and customers.
              </p>
            </div>
            <button
              onClick={handleExportFullDB}
              className="mt-4 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold hover:bg-slate-800 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Full Database
            </button>
          </div>

          {/* Full Import */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">Restore Full Snapshot</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Select a previously saved database snapshot to replace the entire system state.
              </p>
            </div>
            <label className="mt-4 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-100 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Upload Snapshot</span>
              <input type="file" accept=".json" onChange={handleFullDBUpload} className="hidden" />
            </label>
          </div>

          {/* Factory Seed Reset */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 dark:border-rose-950 dark:bg-rose-950/20 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Factory Seed Reset
              </h4>
              <p className="text-[11px] text-rose-600/80 dark:text-rose-400 mt-1">
                Reset system back to initial Ahmad Herbals clean seed state with default demo products.
              </p>
            </div>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    'Are you sure you want to restore factory seed data? This will reset all current transactions and modifications.'
                  )
                ) {
                  resetToSeedData();
                  alert('Reset successfully executed!');
                }
              }}
              className="mt-4 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 cursor-pointer shadow-2xs"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Reset to Factory Seed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
