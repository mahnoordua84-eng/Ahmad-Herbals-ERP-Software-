import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { ChannelProductMapping, ChannelPlatform } from '../../types/erp';
import {
  RefreshCw,
  Layers,
  Search,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRightLeft,
  ExternalLink,
  ShieldAlert,
  Zap,
  Tag,
  Package,
} from 'lucide-react';

export const SyncCenterView: React.FC = () => {
  const {
    salesChannels,
    channelMappings,
    addChannelProductMapping,
    updateChannelProductMapping,
    deleteChannelProductMapping,
    products,
    reservations,
    triggerChannelSync,
    broadcastInventoryUpdate,
    formatCurrency,
    syncLogs,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'mappings' | 'reservations' | 'policy'>('mappings');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // New mapping form state
  const [newMapping, setNewMapping] = useState<{
    channelId: string;
    erpProductId: string;
    channelSku: string;
    channelListingId: string;
    channelPrice: number;
  }>({
    channelId: salesChannels[0]?.id || '',
    erpProductId: products[0]?.id || '',
    channelSku: '',
    channelListingId: '',
    channelPrice: 0,
  });

  const handleCreateMapping = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.id === newMapping.erpProductId);
    const channel = salesChannels.find((c) => c.id === newMapping.channelId);

    if (!product || !channel) return;

    addChannelProductMapping({
      channelId: channel.id,
      platform: channel.platform,
      erpProductId: product.id,
      erpSku: product.sku,
      channelSku: newMapping.channelSku || product.sku,
      channelListingId: newMapping.channelListingId || `ext_${Date.now()}`,
      channelPrice: newMapping.channelPrice > 0 ? newMapping.channelPrice : product.price,
      syncStatus: 'SYNCED',
      lastSyncedStock: product.stock,
      lastSyncedAt: new Date().toISOString(),
    });

    setIsMappingModalOpen(false);
  };

  const handleSyncAllChannels = async () => {
    setIsSyncingAll(true);
    try {
      for (const channel of salesChannels.filter((c) => c.isEnabled)) {
        await triggerChannelSync(channel.id, 'ALL');
      }
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Filter mappings
  const filteredMappings = channelMappings.filter((m) => {
    const matchesChannel = filterChannel === 'all' || m.channelId === filterChannel;
    const matchesSearch =
      m.erpSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.channelSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.channelListingId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl flex items-center gap-2">
            <RefreshCw className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Universal Sync Center & SKU Catalog
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time synchronization engine, product SKU cross-reference mappings, and active inventory reservations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsMappingModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer transition-colors"
          >
            <Plus className="h-4 w-4" />
            Link Channel SKU
          </button>

          <button
            onClick={handleSyncAllChannels}
            disabled={isSyncingAll}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 text-blue-500 ${isSyncingAll ? 'animate-spin' : ''}`} />
            {isSyncingAll ? 'Synchronizing All...' : 'Sync All Channels'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('mappings')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'mappings'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          SKU Cross-Reference Mappings ({channelMappings.length})
        </button>
        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'reservations'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          Active Stock Reservations ({reservations.length})
        </button>
        <button
          onClick={() => setActiveTab('policy')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'policy'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          Sync Policies & Conflict Matrix
        </button>
      </div>

      {/* TAB 1: MAPPINGS */}
      {activeTab === 'mappings' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search ERP SKU, Channel SKU or Listing ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs outline-hidden focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 cursor-pointer"
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

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Channel / Platform</th>
                    <th className="px-4 py-3">ERP Product & SKU</th>
                    <th className="px-4 py-3">Channel SKU</th>
                    <th className="px-4 py-3">Channel Price</th>
                    <th className="px-4 py-3">Synced Stock</th>
                    <th className="px-4 py-3">Sync Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredMappings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No product mappings found matching query.
                      </td>
                    </tr>
                  ) : (
                    filteredMappings.map((m) => {
                      const ch = salesChannels.find((c) => c.id === m.channelId);
                      const prod = products.find((p) => p.id === m.erpProductId);

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {ch?.name || m.platform}
                            </span>
                            <span className="text-[10px] text-slate-400">ID: {m.channelListingId}</span>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900 dark:text-white">
                              {prod?.name || 'Item'}
                            </div>
                            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                              {m.erpSku}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                              {m.channelSku}
                            </span>
                          </td>

                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(m.channelPrice)}
                          </td>

                          <td className="px-4 py-3">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                              {m.lastSyncedStock} units
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              {m.syncStatus}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => deleteChannelProductMapping(m.id)}
                              className="rounded p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Unlink Mapping"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RESERVATIONS */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-200 flex items-start gap-3">
            <Zap className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Real-time Stock Locking Mechanism</h4>
              <p className="mt-1">
                When a marketplace order (Daraz, Shopify, Website) is ingested, physical units are immediately locked
                under reservation to prevent double-selling across POS and other digital storefronts.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Reservation ID</th>
                  <th className="px-4 py-3">Order Number</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Reserved Qty</th>
                  <th className="px-4 py-3">Expiry / Timeout</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reservations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No active stock reservations at this time.
                    </td>
                  </tr>
                ) : (
                  reservations.map((r) => {
                    const prod = products.find((p) => p.id === r.productId);
                    const ch = salesChannels.find((c) => c.id === r.channelId);

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                          {r.id}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          #{r.orderId}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {ch?.name || 'Online Channel'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          {prod?.name || r.productId}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-amber-100 px-2 py-0.5 font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            {r.quantity} units
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {r.expiresAt ? new Date(r.expiresAt).toLocaleString() : 'Permanent Until Dispatch'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CONFLICT RESOLUTION POLICY */}
      {activeTab === 'policy' && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-emerald-600" />
              Single Source of Truth (SSOT)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Ahmad Herbals ERP is configured as the <strong>Master Authority</strong> for all stock balances, batch lots, and pricing rules. Any conflict between marketplace listed figures and ERP inventory records is automatically reconciled in favor of the ERP.
            </p>
            <div className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Inventory Authority:</span>
                <span className="font-bold text-emerald-600">ERP Central (Strict)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Price Override:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">Allowed per channel</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order Deduplication:</span>
                <span className="font-bold text-blue-600">Idempotency Key Verification</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-blue-600" />
              Safety Buffer & Threshold Rules
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              To guarantee zero overselling during rapid flash sales or marketplace promotions, the ERP reserves a safety buffer of <strong>2 units</strong> per SKU before reporting stock to external platforms.
            </p>
            <div className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Safety Stock Buffer:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">2 units withheld</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">OOS Zero-Stock Outpush:</span>
                <span className="font-semibold text-rose-600">Instantaneous</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Webhook Retry Max:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">5 attempts with backoff</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Mapping Modal */}
      {isMappingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Link ERP Product to Channel SKU
              </h3>
              <button
                onClick={() => setIsMappingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMapping} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300">
                  Target Channel
                </label>
                <select
                  value={newMapping.channelId}
                  onChange={(e) => setNewMapping({ ...newMapping, channelId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {salesChannels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.platform})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300">
                  ERP Product
                </label>
                <select
                  value={newMapping.erpProductId}
                  onChange={(e) => {
                    const selProd = products.find((p) => p.id === e.target.value);
                    setNewMapping({
                      ...newMapping,
                      erpProductId: e.target.value,
                      channelSku: selProd?.sku || '',
                      channelPrice: selProd?.price || 0,
                    });
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (SKU: {p.sku}) - {formatCurrency(p.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300">
                  Marketplace / Channel SKU
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DARAZ-KAST-01"
                  value={newMapping.channelSku}
                  onChange={(e) => setNewMapping({ ...newMapping, channelSku: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300">
                  Channel Listing ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 48392019"
                  value={newMapping.channelListingId}
                  onChange={(e) => setNewMapping({ ...newMapping, channelListingId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300">
                  Channel Selling Price (PKR)
                </label>
                <input
                  type="number"
                  min="1"
                  value={newMapping.channelPrice}
                  onChange={(e) =>
                    setNewMapping({ ...newMapping, channelPrice: parseFloat(e.target.value) || 0 })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMappingModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 font-semibold text-white hover:bg-emerald-700"
                >
                  Save Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
