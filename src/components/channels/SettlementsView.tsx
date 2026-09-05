import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { MarketplaceSettlement, ChannelPlatform } from '../../types/erp';
import {
  Landmark,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Plus,
  ArrowDownLeft,
  DollarSign,
  Receipt,
  FileCheck,
  Building,
} from 'lucide-react';

export const SettlementsView: React.FC = () => {
  const { settlements, reconcileSettlement, addSettlement, salesChannels, formatCurrency } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedSettlement, setSelectedSettlement] = useState<MarketplaceSettlement | null>(null);
  const [bankRefInput, setBankRefInput] = useState('');
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New settlement form state
  const [newForm, setNewForm] = useState<{
    channelId: string;
    statementNumber: string;
    periodStart: string;
    periodEnd: string;
    grossSales: number;
    commissionTotal: number;
    paymentFees: number;
    shippingFees: number;
    otherDeductions: number;
  }>({
    channelId: salesChannels[0]?.id || '',
    statementNumber: `STMT-${Date.now().toString().slice(-6)}`,
    periodStart: new Date().toISOString().split('T')[0],
    periodEnd: new Date().toISOString().split('T')[0],
    grossSales: 50000,
    commissionTotal: 3500,
    paymentFees: 1250,
    shippingFees: 1500,
    otherDeductions: 0,
  });

  const handleOpenReconcile = (s: MarketplaceSettlement) => {
    setSelectedSettlement(s);
    setBankRefInput(s.bankReference || `HBL-TRX-${Math.floor(100000 + Math.random() * 900000)}`);
    setIsReconcileModalOpen(true);
  };

  const handleConfirmReconciliation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSettlement) return;
    reconcileSettlement(selectedSettlement.id, bankRefInput);
    setIsReconcileModalOpen(false);
    setSelectedSettlement(null);
  };

  const handleCreateSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    const ch = salesChannels.find((c) => c.id === newForm.channelId);
    if (!ch) return;

    const netPayout =
      newForm.grossSales -
      newForm.commissionTotal -
      newForm.paymentFees -
      newForm.shippingFees -
      newForm.otherDeductions;

    addSettlement({
      channelId: ch.id,
      platform: ch.platform,
      statementNumber: newForm.statementNumber,
      periodStart: newForm.periodStart,
      periodEnd: newForm.periodEnd,
      grossSales: newForm.grossSales,
      commissionTotal: newForm.commissionTotal,
      paymentFees: newForm.paymentFees,
      shippingFees: newForm.shippingFees,
      otherDeductions: newForm.otherDeductions,
      netPayout,
      currency: 'PKR',
      status: 'PENDING',
    });

    setIsNewModalOpen(false);
  };

  const filteredSettlements = settlements.filter((s) => {
    const matchesChannel = filterChannel === 'all' || s.channelId === filterChannel;
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchesSearch =
      s.statementNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.bankReference && s.bankReference.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesChannel && matchesStatus && matchesSearch;
  });

  // Calculate totals
  const totalNetReconciled = settlements
    .filter((s) => s.status === 'RECONCILED')
    .reduce((sum, s) => sum + s.netPayout, 0);

  const totalPendingPayouts = settlements
    .filter((s) => s.status === 'PENDING')
    .reduce((sum, s) => sum + s.netPayout, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl flex items-center gap-2">
            <Landmark className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Marketplace Settlements & Payouts
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Automated statement reconciliation for Daraz, Shopify, and WooCommerce payouts with fee deduction breakdowns.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer transition-colors"
        >
          <Plus className="h-4 w-4" />
          Log Settlement Statement
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Reconciled Bank Deposits
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(totalNetReconciled)}
          </p>
          <p className="mt-1 text-xs text-emerald-600 font-medium">Credited to Habib Bank Limited</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Pending Marketplace Payouts
          </span>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {formatCurrency(totalPendingPayouts)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Awaiting clearance cycle</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Deduction Audit Rate
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            9.4% Avg
          </p>
          <p className="mt-1 text-xs text-slate-500">Commission + Payment Gateway + Shipping</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search statement #, bank reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs outline-hidden focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
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

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="RECONCILED">Reconciled</option>
          </select>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Statement #</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Settlement Cycle</th>
                <th className="px-4 py-3">Gross Sales</th>
                <th className="px-4 py-3">Marketplace Fees</th>
                <th className="px-4 py-3">Net Payout</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No marketplace settlement statements found.
                  </td>
                </tr>
              ) : (
                filteredSettlements.map((s) => {
                  const channel = salesChannels.find((c) => c.id === s.channelId);
                  const totalDeductions =
                    s.commissionTotal + s.paymentFees + s.shippingFees + s.otherDeductions;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {s.statementNumber}
                        </span>
                        {s.bankReference && (
                          <span className="text-[10px] text-emerald-600 font-mono">
                            Ref: {s.bankReference}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {channel?.name || s.platform}
                      </td>

                      <td className="px-4 py-3 text-slate-500">
                        {s.periodStart} → {s.periodEnd}
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {formatCurrency(s.grossSales)}
                      </td>

                      <td className="px-4 py-3 text-rose-600 font-medium">
                        - {formatCurrency(totalDeductions)}
                        <span className="block text-[10px] text-slate-400">
                          Comm: {formatCurrency(s.commissionTotal)} | Pay: {formatCurrency(s.paymentFees)}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(s.netPayout)}
                      </td>

                      <td className="px-4 py-3">
                        {s.status === 'RECONCILED' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Reconciled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            <Clock className="h-3 w-3" />
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {s.status !== 'RECONCILED' ? (
                          <button
                            onClick={() => handleOpenReconcile(s)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
                          >
                            <FileCheck className="h-3.5 w-3.5" />
                            Reconcile
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            Paid {s.payoutDate}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reconcile Modal */}
      {isReconcileModalOpen && selectedSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Reconcile Settlement: {selectedSettlement.statementNumber}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Confirm bank deposit of <strong>{formatCurrency(selectedSettlement.netPayout)}</strong> into corporate bank ledger.
            </p>

            <form onSubmit={handleConfirmReconciliation} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300">
                  Bank Reference / Deposit Voucher #
                </label>
                <input
                  type="text"
                  required
                  value={bankRefInput}
                  onChange={(e) => setBankRefInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReconcileModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 font-semibold text-white hover:bg-emerald-700"
                >
                  Confirm & Reconcile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Settlement Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Log Marketplace Settlement Statement
            </h3>

            <form onSubmit={handleCreateSettlement} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300">
                  Channel
                </label>
                <select
                  value={newForm.channelId}
                  onChange={(e) => setNewForm({ ...newForm, channelId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {salesChannels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300">
                  Statement Number
                </label>
                <input
                  type="text"
                  required
                  value={newForm.statementNumber}
                  onChange={(e) => setNewForm({ ...newForm, statementNumber: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500">Gross Sales (PKR)</label>
                  <input
                    type="number"
                    value={newForm.grossSales}
                    onChange={(e) => setNewForm({ ...newForm, grossSales: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500">Commission (PKR)</label>
                  <input
                    type="number"
                    value={newForm.commissionTotal}
                    onChange={(e) => setNewForm({ ...newForm, commissionTotal: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500">Payment Gateway Fees</label>
                  <input
                    type="number"
                    value={newForm.paymentFees}
                    onChange={(e) => setNewForm({ ...newForm, paymentFees: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500">Shipping Fees</label>
                  <input
                    type="number"
                    value={newForm.shippingFees}
                    onChange={(e) => setNewForm({ ...newForm, shippingFees: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 font-semibold text-white hover:bg-emerald-700"
                >
                  Save Statement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
