import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  FileText,
  Search,
  Printer,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  X,
} from 'lucide-react';
import { Invoice } from '../../types/erp';

export const InvoicesView: React.FC = () => {
  const {
    invoices,
    orders,
    formatCurrency,
    brandSettings,
    t,
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="invoices-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t('invoices')} & Billing Records
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            FBR tax compliance, commercial invoices, customer billing, and payment reconciliations
          </p>
        </div>

        <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          {filteredInvoices.length} Invoices Found
        </span>
      </div>

      {/* Search */}
      <div className="flex rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice number, order # or customer name..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/50 text-slate-500">
                <th className="py-3 px-4 font-semibold">Invoice #</th>
                <th className="py-3 px-4 font-semibold">Order Reference</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Issue Date</th>
                <th className="py-3 px-4 font-semibold">Total Bill</th>
                <th className="py-3 px-4 font-semibold">Paid</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                    {inv.orderNumber}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {inv.customerName}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{inv.date}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {formatCurrency(inv.total)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-emerald-600">
                    {formatCurrency(inv.paid)}
                    {inv.due > 0 && (
                      <span className="block text-[10px] text-rose-600 font-normal">
                        Due: {formatCurrency(inv.due)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : inv.status === 'PARTIAL'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer shadow-2xs"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View & Print</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail / Printable Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 p-8">
            <div className="flex items-start justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h1 className="text-xl font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                  {brandSettings.businessName}
                </h1>
                <p className="text-xs text-slate-500">{brandSettings.tagline}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {brandSettings.address} • {brandSettings.city} • Ph: {brandSettings.phone}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  NTN/Tax ID: {brandSettings.ntnNumber} • STRN: {brandSettings.strnNumber}
                </p>
              </div>

              <div className="text-right">
                <span className="text-lg font-mono font-black text-slate-900 dark:text-white">
                  INVOICE
                </span>
                <p className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400 mt-0.5">
                  #{selectedInvoice.invoiceNumber}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Date: {selectedInvoice.date}</p>
                <p className="text-[11px] text-slate-400">Order: #{selectedInvoice.orderNumber}</p>
              </div>
            </div>

            {/* Bill To */}
            <div className="my-5 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Billed To:
              </span>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {selectedInvoice.customerName}
              </p>
            </div>

            {/* Invoice Line Items */}
            <div className="border border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 dark:bg-slate-800">
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Unit Rate</th>
                    <th className="p-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedInvoice.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">
                        {it.productName}
                      </td>
                      <td className="p-2.5 text-center text-slate-600 dark:text-slate-400">
                        {it.quantity} {it.unit}
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                        {formatCurrency(it.price)}
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(it.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="mt-4 flex justify-end">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(selectedInvoice.subtotal)}
                  </span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount:</span>
                    <span>-{formatCurrency(selectedInvoice.discount)}</span>
                  </div>
                )}
                {selectedInvoice.tax > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>GST / Sales Tax:</span>
                    <span>+{formatCurrency(selectedInvoice.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>Grand Total:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(selectedInvoice.total)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 pt-1">
                  <span>Disbursed Paid:</span>
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(selectedInvoice.paid)}
                  </span>
                </div>
                {selectedInvoice.due > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Balance Due:</span>
                    <span>{formatCurrency(selectedInvoice.due)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
              <p className="text-[10px] text-slate-400">
                This is a computer-generated tax invoice for Ahmad Herbals.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black dark:bg-emerald-600 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Invoice</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
