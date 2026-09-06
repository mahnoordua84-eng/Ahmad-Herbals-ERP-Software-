import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  Receipt,
  User,
  Phone,
  MapPin,
  X,
  ExternalLink,
  Printer,
  Download,
  Check,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types/erp';
import { printService } from '../../services/printService';

export const SalesOrdersView: React.FC = () => {
  const {
    orders,
    updateOrderStatus,
    updateDeliveryStatus,
    formatCurrency,
    brandSettings,
    t,
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  // Status edit modal state
  const [editingStatusOrder, setEditingStatusOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('CONFIRMED');
  const [courier, setCourier] = useState('Trax Logistics');
  const [trackingNumber, setTrackingNumber] = useState('');

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerPhone.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || o.orderStatus === statusFilter;
    const matchesChannel = channelFilter === 'ALL' || o.channel === channelFilter;
    return matchesSearch && matchesStatus && matchesChannel;
  });

  const handleExportCSV = () => {
    const exportData = filteredOrders.map((o) => ({
      OrderNumber: o.orderNumber,
      Customer: o.customerName,
      Phone: o.customerPhone,
      City: o.city,
      Channel: o.channel,
      ItemsCount: o.items.length,
      Subtotal: o.subtotal,
      Discount: o.discount,
      Tax: o.tax,
      Shipping: o.shipping,
      Total: o.total,
      PaymentStatus: o.paymentStatus,
      PaymentMethod: o.paymentMethod,
      OrderStatus: o.orderStatus,
      Courier: o.courier || '',
      TrackingNumber: o.trackingNumber || '',
      Date: new Date(o.createdAt).toLocaleString(),
    }));
    printService.exportToCSV(exportData, `Sales_Orders_${new Date().toISOString().split('T')[0]}`);
    showNotification('Sales orders exported to CSV!');
  };

  const handleOpenStatusModal = (ord: Order) => {
    setEditingStatusOrder(ord);
    setNewStatus(ord.orderStatus);
    setCourier(ord.courier || 'Trax Logistics');
    setTrackingNumber(ord.trackingNumber || `TRX-${Math.floor(1000000 + Math.random() * 9000000)}`);
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStatusOrder) return;

    updateOrderStatus(editingStatusOrder.id, newStatus);
    if (newStatus === 'DISPATCHED' || newStatus === 'DELIVERED') {
      updateDeliveryStatus(
        editingStatusOrder.id,
        newStatus === 'DELIVERED' ? 'DELIVERED' : 'DISPATCHED',
        courier,
        trackingNumber
      );
    }
    showNotification(`Order #${editingStatusOrder.orderNumber} status updated to ${newStatus}!`);
    setEditingStatusOrder(null);
  };

  return (
    <div id="sales-orders-view" className="space-y-6 pb-12">
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
            {t('orders')} & Multi-Channel Sales
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Omni-channel sales pipeline (POS, Web store, WhatsApp, B2B wholesale)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 cursor-pointer"
            title="Export Sales Orders to CSV"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            {filteredOrders.length} Orders Listed
          </span>
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search order #, customer name or phone..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Channel filter */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="ALL">All Channels</option>
            <option value="POS">POS Counter</option>
            <option value="ONLINE">Online Store</option>
            <option value="WHOLESALE">B2B Wholesale</option>
            <option value="MANUAL">Phone / WhatsApp</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/50 text-slate-500">
                <th className="py-3 px-4 font-semibold">Order Number & Date</th>
                <th className="py-3 px-4 font-semibold">Channel</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Items Count</th>
                <th className="py-3 px-4 font-semibold">Net Total</th>
                <th className="py-3 px-4 font-semibold">Payment</th>
                <th className="py-3 px-4 font-semibold">Order Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.map((ord) => {
                return (
                  <tr key={ord.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <p className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {ord.orderNumber}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          ord.channel === 'POS'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : ord.channel === 'ONLINE'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        }`}
                      >
                        {ord.channel}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {ord.customerName}
                      </p>
                      <p className="text-[10px] text-slate-400">{ord.customerPhone}</p>
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {ord.items.length} items ({ord.items.reduce((s, i) => s + i.quantity, 0)} units)
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(ord.total)}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          ord.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : ord.paymentStatus === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {ord.paymentStatus} ({ord.paymentMethod})
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          ord.orderStatus === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : ord.orderStatus === 'DISPATCHED'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : ord.orderStatus === 'CANCELLED'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {ord.orderStatus}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => printService.printReceipt(ord, brandSettings)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800 cursor-pointer"
                          title="Print Thermal POS Receipt"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => printService.printInvoice(ord, brandSettings)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800 cursor-pointer"
                          title="Print A4 Tax Invoice"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 cursor-pointer"
                          title="View Order Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenStatusModal(ord)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer shadow-2xs"
                        >
                          Status
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Order #{selectedOrder.orderNumber}
                </h2>
                <span className="text-xs text-slate-400">
                  Channel: {selectedOrder.channel} • Created: {new Date(selectedOrder.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              {/* Customer Box */}
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedOrder.customerName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedOrder.customerPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedOrder.customerAddress}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{it.productName}</p>
                      <p className="text-[11px] text-slate-400">
                        {it.quantity} {it.unit} × {formatCurrency(it.price)}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(it.total)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-slate-100 pt-3 dark:border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount:</span>
                    <span>-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                {selectedOrder.shipping && selectedOrder.shipping > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Shipping Courier:</span>
                    <span>+{formatCurrency(selectedOrder.shipping)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-1">
                  <span>Net Order Total:</span>
                  <span className="text-emerald-600">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => printService.printReceipt(selectedOrder, brandSettings)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  <Receipt className="h-4 w-4 text-emerald-600" />
                  <span>Thermal Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => printService.printInvoice(selectedOrder, brandSettings)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  <Printer className="h-4 w-4 text-blue-600" />
                  <span>A4 Tax Invoice</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white dark:bg-emerald-600 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Status Modal */}
      {editingStatusOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Update Order Status #{editingStatusOrder.orderNumber}
              </h2>
              <button
                onClick={() => setEditingStatusOrder(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  New Order Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PROCESSING">PROCESSING (Packing at Warehouse)</option>
                  <option value="DISPATCHED">DISPATCHED (Handed to Courier)</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              {(newStatus === 'DISPATCHED' || newStatus === 'DELIVERED') && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Courier Service
                    </label>
                    <select
                      value={courier}
                      onChange={(e) => setCourier(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option value="Trax Logistics">Trax Logistics</option>
                      <option value="TCS Express">TCS Express</option>
                      <option value="Leopards Courier">Leopards Courier</option>
                      <option value="M&P Express">M&P Express</option>
                      <option value="In-House Delivery Rider">In-House Rider</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Courier Tracking Tracking #
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStatusOrder(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
