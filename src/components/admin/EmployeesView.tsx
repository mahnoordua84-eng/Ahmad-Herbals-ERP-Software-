import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  ShieldCheck,
  Users,
  Plus,
  Search,
  Lock,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  X,
  Building,
  Key,
  DollarSign,
} from 'lucide-react';
import { Employee, RolePermissions, UserRole } from '../../types/erp';

export const EmployeesView: React.FC = () => {
  const {
    employees,
    rolePermissions,
    currentUserRole,
    setCurrentUserRole,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    updateRolePermissions,
    warehouses,
    formatCurrency,
    t,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'EMPLOYEES' | 'ROLES'>('EMPLOYEES');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'CASHIER' as UserRole,
    warehouseId: warehouses[0]?.id || 'wh-main',
    salary: 35000,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const handleOpenAdd = () => {
    setEditingEmp(null);
    setFormData({
      name: '',
      email: '',
      phone: '0300-',
      role: 'CASHIER',
      warehouseId: warehouses[0]?.id || 'wh-main',
      salary: 35000,
      status: 'ACTIVE',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmp(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      role: emp.role,
      warehouseId: emp.warehouseId || warehouses[0]?.id || 'wh-main',
      salary: emp.salary || 35000,
      status: emp.status,
    });
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmp) {
      updateEmployee(editingEmp.id, formData);
    } else {
      addEmployee(formData);
    }
    setIsAddModalOpen(false);
  };

  const handleTogglePermission = (role: UserRole, key: keyof RolePermissions) => {
    const current = rolePermissions[role];
    if (!current) return;
    updateRolePermissions(role, {
      ...current,
      [key]: !current[key],
    });
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.phone.includes(searchTerm)
  );

  return (
    <div id="employees-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t('employees')} & Role-Based Access Control (RBAC)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage store staff, permissions, warehouse assignments, and security levels
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setActiveTab('EMPLOYEES')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'EMPLOYEES'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              Employees Directory
            </button>
            <button
              onClick={() => setActiveTab('ROLES')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'ROLES'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              Permissions Matrix
            </button>
          </div>

          {activeTab === 'EMPLOYEES' && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'EMPLOYEES' ? (
        <>
          {/* Search */}
          <div className="flex rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff by name, email or phone..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Employees Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/50 text-slate-500">
                    <th className="py-3 px-4 font-semibold">Employee</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">Assigned Location</th>
                    <th className="py-3 px-4 font-semibold">Monthly Salary</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{emp.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {emp.email} • {emp.phone}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            emp.role === 'ADMIN'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : emp.role === 'MANAGER'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : emp.role === 'CASHIER'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {warehouses.find((w) => w.id === emp.warehouseId)?.name || 'Central Head Office'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {emp.salary ? formatCurrency(emp.salary) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            emp.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete employee "${emp.name}"?`)) {
                                deleteEmployee(emp.id);
                              }
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Roles & Permissions Matrix */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 p-6">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Enterprise Granular Permission Matrix
              </h2>
              <p className="text-xs text-slate-400">
                Click checkboxes to toggle feature authorization per user role
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Test as Role:</span>
              <select
                value={currentUserRole}
                onChange={(e) => setCurrentUserRole(e.target.value as UserRole)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="MANAGER">MANAGER</option>
                <option value="CASHIER">CASHIER</option>
                <option value="INVENTORY_MANAGER">INVENTORY_MANAGER</option>
                <option value="ACCOUNTANT">ACCOUNTANT</option>
                <option value="DELIVERY_RIDER">DELIVERY_RIDER</option>
              </select>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800">
                  <th className="p-3 font-bold text-slate-700 dark:text-slate-300">
                    System Capability / Module
                  </th>
                  {(['ADMIN', 'MANAGER', 'CASHIER', 'INVENTORY_MANAGER', 'ACCOUNTANT', 'DELIVERY_RIDER'] as UserRole[]).map(
                    (role) => (
                      <th key={role} className="p-3 font-bold text-center text-slate-700 dark:text-slate-300">
                        {role}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  { key: 'canManageProducts', label: 'Create & Edit Products / Prices' },
                  { key: 'canManageCategories', label: 'Manage Categories & Herb Brands' },
                  { key: 'canAccessPOS', label: 'Access Counter POS Terminal' },
                  { key: 'canManageOrders', label: 'Update Orders & Sales Channels' },
                  { key: 'canManageInventory', label: 'Inventory Adjustments & Stock Takes' },
                  { key: 'canTransferStock', label: 'Inter-Warehouse Stock Transfers' },
                  { key: 'canManagePurchases', label: 'Create Purchase Orders & Sourcing' },
                  { key: 'canManageSuppliers', label: 'Supplier Ledger & Disbursals' },
                  { key: 'canManageCustomers', label: 'Customer CRM & Khata Credit' },
                  { key: 'canViewAccounting', label: 'View P&L, COGS & Financials' },
                  { key: 'canManageExpenses', label: 'Record & Audit Business Expenses' },
                  { key: 'canManageEmployees', label: 'Staff Management & RBAC' },
                  { key: 'canManageSettings', label: 'Brand & System Global Settings' },
                ].map((row) => (
                  <tr key={row.key} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-medium text-slate-900 dark:text-slate-100">
                      {row.label}
                    </td>
                    {(['ADMIN', 'MANAGER', 'CASHIER', 'INVENTORY_MANAGER', 'ACCOUNTANT', 'DELIVERY_RIDER'] as UserRole[]).map(
                      (role) => {
                        const isGranted = (rolePermissions[role] as any)?.[row.key] || false;
                        const isSuperAdmin = role === 'ADMIN';

                        return (
                          <td key={role} className="p-3 text-center">
                            <button
                              type="button"
                              disabled={isSuperAdmin}
                              onClick={() =>
                                handleTogglePermission(role, row.key as keyof RolePermissions)
                              }
                              className={`rounded p-1 transition-all ${
                                isGranted
                                  ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50'
                                  : 'text-slate-300 bg-slate-50 dark:bg-slate-800'
                              } ${isSuperAdmin ? 'opacity-80 cursor-default' : 'cursor-pointer hover:scale-110'}`}
                            >
                              {isGranted ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                        );
                      }
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingEmp ? 'Edit Employee' : 'Onboard New Staff Member'}
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
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Tariq Mehmood"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Assigned Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="ADMIN">ADMIN (Full Access)</option>
                    <option value="MANAGER">MANAGER (Operations)</option>
                    <option value="CASHIER">CASHIER (POS Only)</option>
                    <option value="INVENTORY_MANAGER">INVENTORY_MANAGER</option>
                    <option value="ACCOUNTANT">ACCOUNTANT</option>
                    <option value="DELIVERY_RIDER">DELIVERY_RIDER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Assigned Location
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
                  Monthly Base Salary (PKR)
                </label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
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
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
