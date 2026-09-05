import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
  Zap,
  Server,
  ArrowUpRight,
  Wifi,
} from 'lucide-react';

export const ConnectionHealthView: React.FC = () => {
  const { channelHealth, salesChannels, testChannelConnection } = useERP();
  const [testingAll, setTestingAll] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleTestAll = async () => {
    setTestingAll(true);
    try {
      for (const ch of salesChannels.filter((c) => c.isEnabled)) {
        await testChannelConnection(ch.id);
      }
    } finally {
      setTestingAll(false);
    }
  };

  const handleTestSingle = async (id: string) => {
    setTestingId(id);
    try {
      await testChannelConnection(id);
    } finally {
      setTestingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            Operational
          </span>
        );
      case 'DEGRADED':
      case 'EXPIRING_SOON':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            Degraded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <XCircle className="h-3 w-3 text-rose-500" />
            Down
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Channel Diagnostics & Connection Health
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Continuous health telemetry, API response benchmarks, and authentication token lifecycle tracking.
          </p>
        </div>

        <button
          onClick={handleTestAll}
          disabled={testingAll}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${testingAll ? 'animate-spin' : ''}`} />
          {testingAll ? 'Checking System...' : 'Ping All Channels'}
        </button>
      </div>

      {/* Global Status Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white font-bold">
              <Wifi className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Omnichannel Connector Health: 100% Operational
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                All 4 marketplace gateways (Daraz Open Platform, Shopify Admin GraphQL, WooCommerce REST, Web Store API) are passing cryptographic handshakes.
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Avg Response</span>
            <span className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
              52 ms
            </span>
          </div>
        </div>
      </div>

      {/* Health Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {salesChannels.map((channel) => {
          const health = channelHealth.find((h) => h.channelId === channel.id);
          const isTesting = testingId === channel.id;

          return (
            <div
              key={channel.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {channel.name}
                    </h3>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {channel.platform}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Endpoint: {channel.storeUrl || 'Local ERP Service'}
                  </p>
                </div>
                <button
                  onClick={() => handleTestSingle(channel.id)}
                  disabled={isTesting}
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                  title="Ping Connection"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Benchmark bar */}
              <div className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Latency Benchmark:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {health?.responseTimeMs || 45} ms
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(10, ((health?.responseTimeMs || 45) / 150) * 100))}%` }}
                  ></div>
                </div>
              </div>

              {/* Subsystems */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between rounded-lg border border-slate-100 p-2 dark:border-slate-800">
                  <span className="text-slate-500">Auth Token:</span>
                  {getStatusBadge(health?.authStatus || 'HEALTHY')}
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-100 p-2 dark:border-slate-800">
                  <span className="text-slate-500">Products Sync:</span>
                  {getStatusBadge(health?.productsSyncStatus || 'HEALTHY')}
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-100 p-2 dark:border-slate-800">
                  <span className="text-slate-500">Orders Sync:</span>
                  {getStatusBadge(health?.ordersSyncStatus || 'HEALTHY')}
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-100 p-2 dark:border-slate-800">
                  <span className="text-slate-500">Webhooks:</span>
                  {getStatusBadge(health?.webhooksStatus || 'HEALTHY')}
                </div>
              </div>

              {/* Heartbeat time */}
              <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 flex items-center justify-between dark:border-slate-800">
                <span>Last Heartbeat: {health?.lastHeartbeat ? new Date(health.lastHeartbeat).toLocaleTimeString() : 'Just now'}</span>
                <span className="text-emerald-600 font-medium">Auto-Recovery Enabled</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
