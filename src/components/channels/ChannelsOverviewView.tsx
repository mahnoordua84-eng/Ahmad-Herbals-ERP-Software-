import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { SalesChannel, ChannelPlatform } from '../../types/erp';
import {
  Store,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Settings2,
  Play,
  KeyRound,
  ShieldCheck,
  TrendingUp,
  Percent,
  Clock,
  Layers,
  ShoppingBag,
  Zap,
} from 'lucide-react';

export const ChannelsOverviewView: React.FC = () => {
  const {
    salesChannels,
    toggleChannelEnabled,
    updateSalesChannel,
    testChannelConnection,
    triggerChannelSync,
    broadcastInventoryUpdate,
    formatCurrency,
    channelHealth,
  } = useERP();

  const [selectedChannel, setSelectedChannel] = useState<SalesChannel | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isTestingMap, setIsTestingMap] = useState<Record<string, boolean>>({});
  const [isSyncingMap, setIsSyncingMap] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<{ id: string; msg: string; healthy: boolean } | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Edit config modal state
  const [editForm, setEditForm] = useState<{
    name: string;
    apiKey: string;
    apiSecret: string;
    storeUrl: string;
    syncIntervalMinutes: number;
    commissionRate: number;
    paymentFeeRate: number;
    fixedFeePerOrder: number;
    autoSyncInventory: boolean;
    autoSyncOrders: boolean;
  }>({
    name: '',
    apiKey: '',
    apiSecret: '',
    storeUrl: '',
    syncIntervalMinutes: 15,
    commissionRate: 0,
    paymentFeeRate: 0,
    fixedFeePerOrder: 0,
    autoSyncInventory: true,
    autoSyncOrders: true,
  });

  const handleOpenConfig = (channel: SalesChannel) => {
    setSelectedChannel(channel);
    setEditForm({
      name: channel.name,
      apiKey: channel.apiKey || '',
      apiSecret: channel.apiSecret || '',
      storeUrl: channel.storeUrl || '',
      syncIntervalMinutes: channel.syncIntervalMinutes,
      commissionRate: channel.commissionRate,
      paymentFeeRate: channel.paymentFeeRate,
      fixedFeePerOrder: channel.fixedFeePerOrder,
      autoSyncInventory: channel.autoSyncInventory,
      autoSyncOrders: channel.autoSyncOrders,
    });
    setIsConfigModalOpen(true);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel) return;

    updateSalesChannel(selectedChannel.id, {
      name: editForm.name,
      apiKey: editForm.apiKey,
      apiSecret: editForm.apiSecret,
      storeUrl: editForm.storeUrl,
      syncIntervalMinutes: editForm.syncIntervalMinutes,
      commissionRate: editForm.commissionRate,
      paymentFeeRate: editForm.paymentFeeRate,
      fixedFeePerOrder: editForm.fixedFeePerOrder,
      autoSyncInventory: editForm.autoSyncInventory,
      autoSyncOrders: editForm.autoSyncOrders,
    });

    setIsConfigModalOpen(false);
    setSelectedChannel(null);
  };

  const handleTestConnection = async (channelId: string) => {
    setIsTestingMap((prev) => ({ ...prev, [channelId]: true }));
    setTestResult(null);

    try {
      const res = await testChannelConnection(channelId);
      setTestResult({
        id: channelId,
        msg: `${res.details} (${res.latencyMs}ms)`,
        healthy: res.isHealthy,
      });
    } catch {
      setTestResult({
        id: channelId,
        msg: 'Connection test failed',
        healthy: false,
      });
    } finally {
      setIsTestingMap((prev) => ({ ...prev, [channelId]: false }));
    }
  };

  const handleSyncNow = async (channelId: string) => {
    setIsSyncingMap((prev) => ({ ...prev, [channelId]: true }));
    try {
      await triggerChannelSync(channelId, 'ALL');
    } finally {
      setIsSyncingMap((prev) => ({ ...prev, [channelId]: false }));
    }
  };

  const handleBroadcastAll = async () => {
    setIsBroadcasting(true);
    try {
      await broadcastInventoryUpdate();
    } finally {
      setIsBroadcasting(false);
    }
  };

  const getPlatformBadge = (platform: ChannelPlatform) => {
    switch (platform) {
      case 'DARAZ':
        return <span className="rounded-md bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">Daraz PK</span>;
      case 'SHOPIFY':
        return <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">Shopify</span>;
      case 'WOOCOMMERCE':
        return <span className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">WooCommerce</span>;
      case 'WEBSITE':
        return <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">Custom Web</span>;
      default:
        return <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">POS / Retail</span>;
    }
  };

  const getStatusBadge = (status: SalesChannel['status'], isEnabled: boolean) => {
    if (!isEnabled) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          <XCircle className="h-3.5 w-3.5 text-slate-400" />
          Disabled
        </span>
      );
    }
    switch (status) {
      case 'CONNECTED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Connected
          </span>
        );
      case 'SYNCING':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 animate-pulse">
            <RefreshCw className="h-3.5 w-3.5 text-blue-500 animate-spin" />
            Syncing...
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
            Sync Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Disconnected
          </span>
        );
    }
  };

  const totalConnected = salesChannels.filter((c) => c.isEnabled && c.status === 'CONNECTED').length;
  const totalChannels = salesChannels.length;

  return (
    <div className="space-y-6">
      {/* Top Header / Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl flex items-center gap-2">
            <Store className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Multi-Channel Commerce & Marketplaces
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Unified omnichannel integration for Daraz Pakistan, Shopify, WooCommerce, and Ahmad Herbals Web Store.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            id="broadcast-inventory-btn"
            onClick={handleBroadcastAll}
            disabled={isBroadcasting}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white cursor-pointer transition-colors"
          >
            <Zap className={`h-4 w-4 text-amber-400 ${isBroadcasting ? 'animate-bounce' : ''}`} />
            {isBroadcasting ? 'Broadcasting...' : 'Broadcast Stock to All Channels'}
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Connected Channels</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Store className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {totalConnected} <span className="text-xs font-normal text-slate-400">/ {totalChannels} active</span>
          </p>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">All real-time webhooks operational</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Inventory Isolation</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Layers className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Central Ledger</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Stock shared dynamically across all channels</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Channel Order Volume</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <ShoppingBag className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Rs. 248,500</p>
          <p className="mt-1 text-xs text-purple-600 dark:text-purple-400 font-medium">38 online orders this week</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Avg API Latency</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">52 ms</p>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">99.98% sync uptime</p>
        </div>
      </div>

      {/* Global Test Connection Feedback Banner */}
      {testResult && (
        <div
          className={`flex items-center justify-between rounded-xl p-3.5 text-xs font-medium ${
            testResult.healthy
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {testResult.healthy ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            )}
            <span>{testResult.msg}</span>
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Channel Cards Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {salesChannels.map((channel) => {
          const health = channelHealth.find((h) => h.channelId === channel.id);
          const isTesting = isTestingMap[channel.id] || false;
          const isSyncing = isSyncingMap[channel.id] || false;

          return (
            <div
              key={channel.id}
              id={`channel-card-${channel.id}`}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                          {channel.name}
                        </h3>
                        {getPlatformBadge(channel.platform)}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                        {channel.storeUrl ? (
                          <a
                            href={channel.storeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 hover:underline text-emerald-600 dark:text-emerald-400"
                          >
                            {channel.storeUrl.replace(/^https?:\/\//, '')}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          'Local In-Store Channel'
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(channel.status, channel.isEnabled)}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={channel.isEnabled}
                        onChange={() => toggleChannelEnabled(channel.id)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>

                {/* Rates and Config Details */}
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Commission</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {channel.commissionRate}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Payment Gateway</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {channel.paymentFeeRate}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Sync Interval</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Every {channel.syncIntervalMinutes}m
                    </span>
                  </div>
                </div>

                {/* Features Badges */}
                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                  <span
                    className={`rounded px-2 py-0.5 ${
                      channel.autoSyncInventory
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Inventory Sync: {channel.autoSyncInventory ? 'Auto (Instant)' : 'Manual'}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 ${
                      channel.autoSyncOrders
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Order Polling: {channel.autoSyncOrders ? 'Webhook / Active' : 'Manual'}
                  </span>
                  {health && (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      Ping: {health.responseTimeMs}ms
                    </span>
                  )}
                </div>

                {/* Last Sync Info */}
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-2 dark:border-slate-800">
                  <span>Last Sync: {channel.lastSyncTime ? new Date(channel.lastSyncTime).toLocaleTimeString() : 'Never'}</span>
                  {channel.errorCount > 0 && (
                    <span className="text-rose-500 font-medium">{channel.errorCount} sync issues flagged</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  id={`btn-test-${channel.id}`}
                  onClick={() => handleTestConnection(channel.id)}
                  disabled={isTesting || !channel.isEnabled}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 cursor-pointer"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  {isTesting ? 'Testing...' : 'Test API'}
                </button>

                <button
                  id={`btn-sync-${channel.id}`}
                  onClick={() => handleSyncNow(channel.id)}
                  disabled={isSyncing || !channel.isEnabled}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>

                <button
                  id={`btn-cfg-${channel.id}`}
                  onClick={() => handleOpenConfig(channel)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer transition-colors"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Configure
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration Modal */}
      {isConfigModalOpen && selectedChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Configure Channel: {selectedChannel.name}
                </h3>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300">
                  Channel Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-hidden focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300">
                  Endpoint / Store URL
                </label>
                <input
                  type="url"
                  value={editForm.storeUrl}
                  onChange={(e) => setEditForm({ ...editForm, storeUrl: e.target.value })}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-hidden focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300">
                    API Key / Client ID
                  </label>
                  <input
                    type="text"
                    value={editForm.apiKey}
                    onChange={(e) => setEditForm({ ...editForm, apiKey: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 outline-hidden focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300">
                    API Secret / Token
                  </label>
                  <input
                    type="password"
                    value={editForm.apiSecret}
                    onChange={(e) => setEditForm({ ...editForm, apiSecret: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 outline-hidden focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Rates and Fee Rules */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 text-emerald-600" />
                  Marketplace Settlement & Cost Rules
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400">
                      Commission (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={editForm.commissionRate}
                      onChange={(e) =>
                        setEditForm({ ...editForm, commissionRate: parseFloat(e.target.value) || 0 })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400">
                      Payment Fee (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={editForm.paymentFeeRate}
                      onChange={(e) =>
                        setEditForm({ ...editForm, paymentFeeRate: parseFloat(e.target.value) || 0 })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400">
                      Fixed Order Fee (Rs)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={editForm.fixedFeePerOrder}
                      onChange={(e) =>
                        setEditForm({ ...editForm, fixedFeePerOrder: parseFloat(e.target.value) || 0 })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Sync Switches */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.autoSyncInventory}
                    onChange={(e) => setEditForm({ ...editForm, autoSyncInventory: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">
                    Enable Real-time Inventory Broadcast on every sale / stock change
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.autoSyncOrders}
                    onChange={(e) => setEditForm({ ...editForm, autoSyncOrders: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">
                    Auto-ingest new orders via Webhooks / Periodic polling
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
