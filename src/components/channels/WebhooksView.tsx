import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { WebhookEvent } from '../../types/erp';
import {
  Webhook,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Search,
  Code2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const WebhooksView: React.FC = () => {
  const { webhookEvents, salesChannels, simulateWebhookEvent } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Simulator state
  const [simChannelId, setSimChannelId] = useState<string>(salesChannels[0]?.id || '');
  const [simEventType, setSimEventType] = useState<string>('order.created');

  const filteredEvents = webhookEvents.filter((evt) => {
    const matchesChannel = filterChannel === 'all' || evt.channelId === filterChannel;
    const matchesSearch =
      evt.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.externalEventId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.idempotencyKey.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const mockPayload = {
        event_id: `evt_sim_${Date.now()}`,
        topic: simEventType,
        timestamp: new Date().toISOString(),
        data: {
          order_id: `EXT-${Math.floor(100000 + Math.random() * 900000)}`,
          customer: {
            name: 'Marketplace Buyer',
            phone: '0312-3456789',
            city: 'Lahore',
          },
          items: [
            {
              sku: 'AH-KAST-01',
              title: 'Habbe Kastoori Gold Edition',
              quantity: 2,
              price: 1850,
            },
          ],
          total_amount: 3700,
          currency: 'PKR',
          payment_method: 'COD',
        },
      };

      await simulateWebhookEvent(simChannelId, simEventType, mockPayload);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl flex items-center gap-2">
            <Webhook className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Inbound Webhook Events & Dispatcher
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time webhook listener, signature verification, idempotency control, and live event test simulator.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            Webhook Gateway Active
          </span>
        </div>
      </div>

      {/* Simulator Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Webhook Event Generator & Tester
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Test your automated webhook ingestion pipeline by firing synthetic payloads from any connected marketplace.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Source Marketplace
            </label>
            <select
              value={simChannelId}
              onChange={(e) => setSimChannelId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {salesChannels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.platform})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Event Trigger
            </label>
            <select
              value={simEventType}
              onChange={(e) => setSimEventType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="order.created">order.created (New Order Placed)</option>
              <option value="order.cancelled">order.cancelled (Customer Cancellation)</option>
              <option value="order.fulfilled">order.fulfilled (Dispatch Tracking)</option>
              <option value="inventory.reserved">inventory.reserved (Lock Stock)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {isSimulating ? 'Dispatching Event...' : 'Fire Test Webhook'}
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search event type, ID, idempotency key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs outline-hidden focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
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
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3">Received At</th>
                  <th className="px-4 py-3">Channel / Source</th>
                  <th className="px-4 py-3">Event Topic</th>
                  <th className="px-4 py-3">Event ID</th>
                  <th className="px-4 py-3">Idempotency Key</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No webhook events logged matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((evt) => {
                    const isExpanded = expandedEventId === evt.id;
                    const channel = salesChannels.find((c) => c.id === evt.channelId);

                    return (
                      <React.Fragment key={evt.id}>
                        <tr
                          onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
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
                            {new Date(evt.receivedAt).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                            {channel?.name || evt.platform}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded bg-emerald-50 px-2 py-0.5 font-bold font-mono text-[11px] text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                              {evt.eventType}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                            {evt.externalEventId}
                          </td>
                          <td className="px-4 py-3 font-mono text-[10px] text-slate-400 truncate max-w-xs">
                            {evt.idempotencyKey}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {evt.status}
                            </span>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-slate-50/90 dark:bg-slate-950/40">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                    Webhook Payload ({evt.id})
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-400">
                                    Processed at {evt.processedAt}
                                  </span>
                                </div>
                                <pre className="max-h-56 overflow-y-auto rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-emerald-400 dark:bg-slate-900 border border-slate-800">
                                  {JSON.stringify(evt.payload, null, 2)}
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
    </div>
  );
};
