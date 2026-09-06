import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Users2,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Edit2,
  Trash2,
  X,
  FileText,
  DollarSign,
  Printer,
  Download,
  Check,
} from 'lucide-react';
import { Supplier } from '../../types/erp';
import { printService } from '../../services/printService';

export const SuppliersView: React.FC = () => {
  const {
    suppliers,
    supplierLedger,
    brandSettings,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addSupplierPayment,
    paymentMethods,
    formatCurrency,
    t,
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedLedgerSupplier, setSelectedLedgerSupplier] = useState<Supplier | null>(null);
  const [paymentModalSupplier, setPaymentModalSupplier] = useState<Supplier | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    city: 'Lahore',
    openingBalance: 0,
    paymentTerms: 'NET 30',
  });

  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]?.id || 'BANK_TRANSFER');
  const [paymentNotes, setPaymentNotes] = useState('');

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      company: '',
      phone: '0300-',
      email: '',
      address: '',
      city: 'Lahore',
      openingBalance: 0,
      paymentTerms: 'NET 30',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setFormData({
      name: s.name,
      company: s.company,
      phone: s.phone,
      email: s.email,
      address: s.address,
      city: s.city,
      openingBalance: s.openingBalance || 0,
      paymentTerms: s.paymentTerms,
    });
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      updateSupplier(editingSupplier.id, formData);
      showNotification('Supplier profile updated successfully!');
    } else {
      addSupplier(formData);
      showNotification('New supplier added successfully!');
    }
    setIsAddModalOpen(false);
  };

  const handleDisbursePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalSupplier || paymentAmount <= 0) return;
    addSupplierPayment(paymentModalSupplier.id, Number(paymentAmount), paymentMethod, paymentNotes);
    showNotification(`Disbursed payment of ${formatCurrency(paymentAmount)} to ${paymentModalSupplier.company}`);
    setPaymentModalSupplier(null);
    setPaymentAmount(0);
    setPaymentNotes('');
  };

  const handleExportSuppliersCSV = () => {
    const rows = filteredSuppliers.map((s) => ({
      'Company': s.company,
      'Contact Person': s.name,
      'Phone': s.phone,
      'Email': s.email || '',
      'City': s.city,
      'Address': s.address,
      'Payment Terms': s.paymentTerms,
      'Total Procurement (PKR)': s.totalPurchases,
      'Paid Amount (PKR)': s.paidAmount,
      'Outstanding Due (PKR)': s.outstandingBalance,
    }));
    printService.exportToCSV(rows, `Ahmad_Herbals_Suppliers_${new Date().toISOString().split('T')[0]}`);
    showNotification('Suppliers directory exported to CSV!');
  };

  const handleExportLedgerCSV = (s: Supplier) => {
    const entries = supplierLedger.filter((l) => l.supplierId === s.id);
    const rows = entries.map((e) => ({
      'Date': e.date,
      'Reference': e.referenceNo,
      'Description': e.description,
      'Debit (Paid)': e.debit,
      'Credit (Billed)': e.credit,
      'Balance': e.balance,
    }));
    printService.exportToCSV(rows, `Supplier_Ledger_${s.company.replace(/\s+/g, '_')}`);
    showNotification('Vendor statement exported to CSV!');
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm)
  );

  return (
    <div id="suppliers-view" className="space-y-6 pb-12">
      {/* Toast Notification */}
      {actionSuccess && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg animate-in slide-in-from-bottom-2">
          <Check className="h-4 w-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t('suppliers')} & Farm Vendors
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Grower cooperatives, grain mills, herbal extract providers, and payables ledger
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportSuppliersCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
            title="Export Suppliers to CSV"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search suppliers by name, company, or contact number..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredSuppliers.map((s) => (
          <div
            key={s.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                      {s.company}
                    </h2>
                    <p className="text-xs text-slate-500">{s.name}</p>
                  </div>
                </div>

                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {s.paymentTerms}
                </span>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{s.phone}</span>
                </div>
                {s.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">{s.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate">{s.address}, {s.city}</span>
                </div>
              </div>

              {/* Financial Balance Summary */}
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Total Procurement</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {formatCurrency(s.totalPurchases)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium">Payable Due</span>
                  <span
                    className={`text-xs font-black ${
                      s.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {formatCurrency(s.outstandingBalance)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
              <button
                onClick={() => setSelectedLedgerSupplier(s)}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Statement Ledger</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setPaymentModalSupplier(s);
                    setPaymentAmount(s.outstandingBalance > 0 ? s.outstandingBalance : 5000);
                  }}
                  className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 cursor-pointer"
                >
                  Disburse
                </button>
                <button
                  onClick={() => handleOpenEdit(s)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete supplier "${s.company}"?`)) {
                      deleteSupplier(s.id);
                    }
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Supplier Ledger Statement Modal */}
      {selectedLedgerSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Vendor Ledger: {selectedLedgerSupplier.company}
                </h2>
                <p className="text-xs text-slate-500">
                  Current Net Outstanding Balance: <span className="font-bold text-rose-600">{formatCurrency(selectedLedgerSupplier.outstandingBalance)}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedLedgerSupplier(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-4 max-h-72 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800">
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Reference</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 text-right">Debit (Paid)</th>
                    <th className="p-2.5 text-right">Credit (Bill)</th>
                    <th className="p-2.5 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {supplierLedger
                    .filter((l) => l.supplierId === selectedLedgerSupplier.id)
                    .map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2.5 text-slate-500 font-mono text-[11px]">{entry.date}</td>
                        <td className="p-2.5 font-mono font-medium text-slate-700 dark:text-slate-300">{entry.referenceNo}</td>
                        <td className="p-2.5 text-slate-700 dark:text-slate-300">{entry.description}</td>
                        <td className="p-2.5 text-right font-semibold text-emerald-600">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                        </td>
                        <td className="p-2.5 text-right font-semibold text-rose-600">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrency(entry.balance)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    printService.printSupplierLedger(
                      selectedLedgerSupplier,
                      supplierLedger.filter((l) => l.supplierId === selectedLedgerSupplier.id),
                      brandSettings
                    )
                  }
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  <Printer className="h-4 w-4 text-emerald-600" />
                  <span>Print Statement</span>
                </button>

                <button
                  onClick={() => handleExportLedgerCSV(selectedLedgerSupplier)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  <Download className="h-4 w-4 text-slate-500" />
                  <span>Export CSV</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedLedgerSupplier(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white dark:bg-emerald-600 cursor-pointer"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disburse Payment Modal */}
      {paymentModalSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Disburse Payment to {paymentModalSupplier.company}
              </h2>
              <button
                onClick={() => setPaymentModalSupplier(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleDisbursePayment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Payment Amount (PKR) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Payment Channel / Account
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="BANK_TRANSFER">Meezan Bank Corporate A/C</option>
                  <option value="CASH">Cash Drawer Outflow</option>
                  <option value="CHEQUE">Bank Payee Cheque</option>
                  <option value="EASYPAISA">JazzCash / Easypaisa Merchant</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Notes / Cheque No / Reference
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Online transfer ref #558912"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalSupplier(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
                >
                  Record Disbursal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingSupplier ? 'Edit Supplier' : 'Register New Vendor / Farm'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Company / Farm Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g. Punjab Organic Grain Mills"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Contact Person *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Malik Arshad"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Payment Terms
                </label>
                <select
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="NET 15">NET 15 Days</option>
                  <option value="NET 30">NET 30 Days</option>
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="ADVANCE">100% Advance Payment</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
