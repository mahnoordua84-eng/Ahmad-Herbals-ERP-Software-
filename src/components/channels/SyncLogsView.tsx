import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { SyncLog } from '../../types/erp';
import {
  FileClock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Trash2,
  Download,
  Filter,
  Eye,
  ChevronDown,
  ChevronRight,
  Clock,
  Layers,
} from 'lucide-react';

export const SyncLogsView: React.FC = () => {
  const { syncLogs, clearSyncLogs, salesChannels } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = syncLogs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase())) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesEntity = filterEntity === 'all' || log.entity === filterEntity;
    const matchesChannel = filterChannel === 'all' || log.channelId === filterChannel;
    return matchesSearch && matchesStatus && matchesEntity && matchesChannel;
  });

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sync_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getStatusIcon = (status: SyncLog['status']) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl flex items-center gap-2">
            <FileClock className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Synchronization Logs & Audit Trail
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time telemetry, API payload audit logs, and diagnostic history across all external sales channels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Export Logs JSON
          </button>
          <button
            onClick={clearSyncLogs}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Logs
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search log message, details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-hidden focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="all">All Statuses</option>
            <option value="SUCCESS">Success Only</option>
            <option value="ERROR">Errors Only</option>
            <option value="WARNING">Warnings Only</option>
          </select>
        </div>

        <div>
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="all">All Entity Types</option>
            <option value="INVENTORY">Inventory</option>
            <option value="ORDER">Orders</option>
            <option value="PRODUCT">Products</option>
            <option value="SETTLEMENT">Settlements</option>
            <option value="WEBHOOK">Webhooks</option>
          </select>
        </div>

        <div>
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="all">All Channels</option>
            {salesChannels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Entity / Op</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No sync logs recorded matching your filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const channel = salesChannels.find((c) => c.id === log.channelId);

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-4 py-3 text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </td>

                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>

                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          {channel?.name || log.platform}
                        </td>

                        <td className="px-4 py-3">
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-bold text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {log.entity} : {log.operation}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                          {log.message}
                        </td>

                        <td className="px-4 py-3 text-slate-500">
                          {log.durationMs ? `${log.durationMs} ms` : '—'}
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 font-semibold text-[11px]">
                            {getStatusIcon(log.status)}
                            {log.status}
                          </span>
                        </td>
                      </tr>

                      {/* Expandable JSON Detail */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 dark:bg-slate-950/40">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                  Log Payload & Diagnostic Details ({log.id})
                                </span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  {log.timestamp}
                                </span>
                              </div>
                              <pre className="max-h-56 overflow-y-auto rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-emerald-400 dark:bg-slate-900 border border-slate-800">
                                {log.details
                                  ? JSON.stringify(
                                      typeof log.details === 'string'
                                        ? JSON.parse(log.details)
                                        : log.details,
                                      null,
                                      2
                                    )
                                  : JSON.stringify(log, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
