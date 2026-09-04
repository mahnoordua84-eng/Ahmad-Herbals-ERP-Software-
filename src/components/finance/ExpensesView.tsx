import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Calendar,
  Tag,
  CreditCard,
  Building,
  Edit2,
  Trash2,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { Expense, ExpenseCategory } from '../../types/erp';

export const ExpensesView: React.FC = () => {
  const {
    expenses,
    addExpense,
    deleteExpense,
    warehouses,
    paymentMethods,
    formatCurrency,
    t,
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'PACKAGING' as ExpenseCategory,
    amount: 1500,
    paymentMethod: paymentMethods[0]?.id || 'CASH',
    date: new Date().toISOString().split('T')[0],
    warehouseId: warehouses[0]?.id || 'wh-main',
    reference: '',
    notes: '',
  });

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      category: 'PACKAGING',
      amount: 1500,
      paymentMethod: 'CASH',
      date: new Date().toISOString().split('T')[0],
      warehouseId: warehouses[0]?.id || 'wh-main',
      reference: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const wh = warehouses.find((w) => w.id === formData.warehouseId);
    addExpense({
      ...formData,
      amount: Number(formData.amount),
      warehouseName: wh?.name,
    });
    setIsModalOpen(false);
  };

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch =
      exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.reference && exp.reference.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'ALL' || exp.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalFilteredExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div id="expenses-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t('expenses')} & Operational Outflows
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Packaging bags, couriers, mill electricity, payroll, marketing and facility overheads
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Expense KPI summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Filtered Outflow
          </span>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(totalFilteredExpense)}
          </p>
          <span className="text-[11px] text-slate-500">{filteredExpenses.length} records tallied</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Packaging & Grain Bags
          </span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(
              expenses
                .filter((e) => e.category === 'PACKAGING')
                .reduce((s, e) => s + e.amount, 0)
            )}
          </p>
          <span className="text-[11px] text-slate-500">Bags, bottles & zipper pouches</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Logistics & Delivery Freight
          </span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(
              expenses
                .filter((e) => e.category === 'DELIVERY')
                .reduce((s, e) => s + e.amount, 0)
            )}
          </p>
          <span className="text-[11px] text-slate-500">Trax, Leopards, van fuel</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search expenses by title or reference..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="ALL">All Categories</option>
            <option value="PACKAGING">Packaging & Labels</option>
            <option value="DELIVERY">Delivery & Transit</option>
            <option value="UTILITIES">Electricity & Gas</option>
            <option value="SALARY">Staff Salaries</option>
            <option value="MARKETING">Digital Marketing & Ads</option>
            <option value="RENT">Warehouse & Store Rent</option>
            <option value="MAINTENANCE">Equipment Maintenance</option>
            <option value="TAX">Govt & Local Taxes</option>
            <option value="MISC">General Miscellaneous</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/50 text-slate-500">
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Expense Title</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Paid Via</th>
                <th className="py-3 px-4 font-semibold">Location</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{exp.date}</td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{exp.title}</p>
                    {exp.reference && (
                      <span className="font-mono text-[10px] text-slate-400">
                        Ref: {exp.reference}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{exp.paymentMethod}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {exp.warehouseName || 'General'}
                  </td>
                  <td className="py-3 px-4 font-black text-rose-600 dark:text-rose-400">
                    {formatCurrency(exp.amount)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete expense "${exp.title}"?`)) {
                          deleteExpense(exp.id);
                        }
                      }}
                      className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Record Business Expense
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 500 Kraft zip-lock grain pouches"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as ExpenseCategory })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="PACKAGING">Packaging</option>
                    <option value="DELIVERY">Delivery</option>
                    <option value="UTILITIES">Electricity & Bills</option>
                    <option value="SALARY">Salary</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="RENT">Rent</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="TAX">Taxes</option>
                    <option value="MISC">Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Amount (PKR) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="CASH">Cash in Hand</option>
                    <option value="BANK_TRANSFER">Bank Account</option>
                    <option value="EASYPAISA">JazzCash / Easypaisa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Location / Branch
                  </label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Bill / Voucher Reference No
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="e.g. LESCO bill or Receipt #8841"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
