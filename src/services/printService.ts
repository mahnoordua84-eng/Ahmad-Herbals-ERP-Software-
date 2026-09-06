import { Order, Invoice, Purchase, Customer, Supplier, BrandSettings, Product } from '../types/erp';

interface ReportColumn {
  header: string;
  key: string;
  align?: 'left' | 'right' | 'center';
  format?: (val: any) => string;
}

/**
 * Centralized Ahmad Herbals Print Service
 * Generates isolated print windows with strict CSS ensuring dashboard/sidebar are never printed.
 */
class PrintService {
  private openPrintWindow(htmlContent: string, title: string) {
    const printWindow = window.open('', '_blank', 'width=850,height=900');
    if (!printWindow) {
      alert('Popup was blocked. Please allow popups to print documents.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title} - Ahmad Herbals ERP</title>
          <style>
            @media print {
              @page {
                margin: 10mm;
                size: auto;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print {
                display: none !important;
              }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #1e293b;
              margin: 0;
              padding: 20px;
              background: #fff;
              line-height: 1.4;
            }
            .print-btn-bar {
              background: #f1f5f9;
              padding: 12px 20px;
              border-bottom: 1px solid #e2e8f0;
              margin: -20px -20px 20px -20px;
              display: flex;
              gap: 10px;
              align-items: center;
              justify-content: flex-end;
            }
            .btn {
              padding: 8px 16px;
              border-radius: 6px;
              font-weight: 600;
              font-size: 13px;
              cursor: pointer;
              border: 1px solid transparent;
            }
            .btn-primary {
              background: #059669;
              color: white;
            }
            .btn-secondary {
              background: #fff;
              border-color: #cbd5e1;
              color: #475569;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0;
            }
            th {
              background-color: #f8fafc;
              color: #475569;
              font-weight: 600;
              text-align: left;
              padding: 8px 12px;
              border-bottom: 2px solid #e2e8f0;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            td {
              padding: 8px 12px;
              border-bottom: 1px solid #f1f5f9;
              font-size: 13px;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: 700; }
            .badge {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .badge-paid { background: #dcfce7; color: #15803d; }
            .badge-pending { background: #fef9c3; color: #854d0e; }
          </style>
        </head>
        <body>
          <div class="print-btn-bar no-print">
            <button class="btn btn-secondary" onclick="window.close()">Close</button>
            <button class="btn btn-primary" onclick="window.print()">Print Document</button>
          </div>
          ${htmlContent}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  /**
   * 1. Print Thermal POS Receipt (80mm standard width)
   */
  public printReceipt(order: Order, brand: BrandSettings) {
    const receiptHtml = `
      <div style="max-width: 300px; margin: 0 auto; font-family: 'Courier New', Courier, monospace; font-size: 12px;">
        <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
          <h2 style="margin: 0; font-size: 16px; text-transform: uppercase;">${brand.businessName}</h2>
          <p style="margin: 2px 0; font-size: 11px;">${brand.address}, ${brand.city}</p>
          <p style="margin: 2px 0; font-size: 11px;">Phone: ${brand.phone}</p>
          ${(brand.taxNumber || brand.ntnNumber) ? `<p style="margin: 2px 0; font-size: 11px;">NTN / GST: ${brand.taxNumber || brand.ntnNumber}</p>` : ''}
          <p style="margin: 4px 0 0 0; font-size: 10px;">${new Date().toLocaleString()}</p>
        </div>

        <div style="font-size: 11px; margin-bottom: 8px;">
          <div><strong>Order #:</strong> ${order.orderNumber}</div>
          <div><strong>Customer:</strong> ${order.customerName || 'Walk-in Customer'}</div>
          <div><strong>Channel:</strong> ${order.channel || 'POS'}</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin: 8px 0;">
          <thead>
            <tr style="border-bottom: 1px dashed #000;">
              <th style="background: none; padding: 4px 0; text-align: left;">Item</th>
              <th style="background: none; padding: 4px 0; text-align: center;">Qty</th>
              <th style="background: none; padding: 4px 0; text-align: right;">Price</th>
              <th style="background: none; padding: 4px 0; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items
              .map(
                (item) => `
              <tr>
                <td style="padding: 4px 0;">${item.productName}</td>
                <td style="padding: 4px 0; text-align: center;">${item.quantity}</td>
                <td style="padding: 4px 0; text-align: right;">${item.price}</td>
                <td style="padding: 4px 0; text-align: right;">${item.total}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div style="border-top: 1px dashed #000; padding-top: 6px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span>Rs. ${order.subtotal?.toLocaleString() || 0}</span>
          </div>
          ${order.discount ? `
            <div style="display: flex; justify-content: space-between; color: #dc2626;">
              <span>Discount:</span>
              <span>-Rs. ${order.discount?.toLocaleString()}</span>
            </div>
          ` : ''}
          ${order.tax ? `
            <div style="display: flex; justify-content: space-between;">
              <span>Tax (GST):</span>
              <span>Rs. ${order.tax?.toLocaleString()}</span>
            </div>
          ` : ''}
          ${order.shipping ? `
            <div style="display: flex; justify-content: space-between;">
              <span>Shipping:</span>
              <span>Rs. ${order.shipping?.toLocaleString()}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 4px; border-top: 1px solid #000; padding-top: 4px;">
            <span>TOTAL:</span>
            <span>Rs. ${order.total?.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 4px;">
            <span>Paid (${order.paymentMethod}):</span>
            <span>Rs. ${(order.paidAmount || order.total)?.toLocaleString()}</span>
          </div>
          ${order.dueAmount ? `
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #dc2626; font-weight: bold;">
              <span>Balance Due:</span>
              <span>Rs. ${order.dueAmount?.toLocaleString()}</span>
            </div>
          ` : ''}
        </div>

        <div style="text-align: center; border-top: 1px dashed #000; margin-top: 12px; padding-top: 8px; font-size: 10px;">
          <p style="margin: 2px 0; font-weight: bold;">THANK YOU FOR YOUR VISIT!</p>
          <p style="margin: 2px 0;">100% Pure Herbal & Organic Formulations</p>
          <p style="margin: 4px 0 0 0;">www.ahmadherbals.com | +92 300 1234567</p>
        </div>
      </div>
    `;

    this.openPrintWindow(receiptHtml, `Receipt-${order.orderNumber}`);
  }

  /**
   * 2. Print Full A4 Invoice
   */
  public printInvoice(orderOrInvoice: any, brand: BrandSettings) {
    const isInvoiceObj = !!orderOrInvoice.invoiceNumber;
    const invNumber = isInvoiceObj ? orderOrInvoice.invoiceNumber : `INV-${orderOrInvoice.orderNumber}`;
    const orderNumber = orderOrInvoice.orderNumber || orderOrInvoice.id;
    const dateStr = orderOrInvoice.issueDate || orderOrInvoice.createdAt || new Date().toISOString();
    const items = orderOrInvoice.items || [];

    const invoiceHtml = `
      <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #059669; padding-bottom: 16px;">
          <div>
            <h1 style="margin: 0; color: #059669; font-size: 26px; text-transform: uppercase;">${brand.businessName}</h1>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Enterprise Herbal Remedies & Natural Wellness</p>
            <p style="margin: 2px 0; color: #64748b; font-size: 12px;">${brand.address}, ${brand.city}, Pakistan</p>
            <p style="margin: 2px 0; color: #64748b; font-size: 12px;">Phone: ${brand.phone} | Email: info@ahmadherbals.com</p>
            ${(brand.taxNumber || brand.ntnNumber) ? `<p style="margin: 2px 0; color: #64748b; font-size: 12px;">NTN / GST Reg: <strong>${brand.taxNumber || brand.ntnNumber}</strong></p>` : ''}
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 24px; color: #1e293b;">INVOICE</h2>
            <p style="margin: 4px 0 0 0; font-weight: bold; font-size: 14px; color: #059669;"># ${invNumber}</p>
            <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Order Ref: ${orderNumber}</p>
            <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Date: ${new Date(dateStr).toLocaleDateString()}</p>
            <div style="margin-top: 6px;">
              <span class="badge ${orderOrInvoice.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-pending'}">
                ${orderOrInvoice.paymentStatus || 'PAID'}
              </span>
            </div>
          </div>
        </div>

        <!-- Bill To / Ship To -->
        <div style="display: flex; justify-content: space-between; margin: 20px 0; background: #f8fafc; padding: 14px 18px; border-radius: 8px;">
          <div>
            <h4 style="margin: 0 0 6px 0; color: #475569; font-size: 12px; text-transform: uppercase;">Billed To:</h4>
            <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1e293b;">${orderOrInvoice.customerName || 'Walk-in Customer'}</p>
            <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Phone: ${orderOrInvoice.customerPhone || 'N/A'}</p>
            <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Address: ${orderOrInvoice.customerAddress || orderOrInvoice.shippingAddress || 'Store Pickup'}</p>
          </div>
          <div style="text-align: right;">
            <h4 style="margin: 0 0 6px 0; color: #475569; font-size: 12px; text-transform: uppercase;">Payment Details:</h4>
            <p style="margin: 0; font-size: 13px; color: #1e293b;"><strong>Method:</strong> ${orderOrInvoice.paymentMethod || 'Cash'}</p>
            <p style="margin: 2px 0; font-size: 13px; color: #1e293b;"><strong>Delivery Status:</strong> ${orderOrInvoice.deliveryStatus || 'DELIVERED'}</p>
          </div>
        </div>

        <!-- Line Items -->
        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Description</th>
              <th style="width: 100px;">SKU</th>
              <th style="width: 80px;" class="text-center">Qty</th>
              <th style="width: 110px;" class="text-right">Unit Price</th>
              <th style="width: 110px;" class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (it: any, idx: number) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${it.productName}</strong></td>
                <td style="font-family: monospace; font-size: 11px;">${it.sku || '-'}</td>
                <td class="text-center">${it.quantity} ${it.unit || ''}</td>
                <td class="text-right">Rs. ${Number(it.price || 0).toLocaleString()}</td>
                <td class="text-right font-bold">Rs. ${Number(it.total || it.quantity * it.price).toLocaleString()}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <!-- Totals & Summary -->
        <div style="display: flex; justify-content: space-between; margin-top: 16px;">
          <div style="max-width: 400px; font-size: 11px; color: #64748b;">
            <h4 style="margin: 0 0 4px 0; color: #1e293b; font-size: 12px;">Terms & Conditions:</h4>
            <p style="margin: 2px 0;">1. Natural herbal products must be stored in a cool, dry place away from direct sunlight.</p>
            <p style="margin: 2px 0;">2. Goods once sold can be exchanged within 7 days with original sales receipt.</p>
            <p style="margin: 2px 0;">3. For any complaints or inquiries, please contact +92 300 1234567.</p>
          </div>

          <div style="width: 280px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span style="color: #64748b;">Subtotal:</span>
              <span class="font-bold">Rs. ${Number(orderOrInvoice.subtotal || 0).toLocaleString()}</span>
            </div>
            ${orderOrInvoice.discount ? `
              <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #dc2626;">
                <span>Discount:</span>
                <span>-Rs. ${Number(orderOrInvoice.discount).toLocaleString()}</span>
              </div>
            ` : ''}
            ${orderOrInvoice.tax ? `
              <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                <span style="color: #64748b;">Tax (GST):</span>
                <span>Rs. ${Number(orderOrInvoice.tax).toLocaleString()}</span>
              </div>
            ` : ''}
            ${orderOrInvoice.shipping ? `
              <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                <span style="color: #64748b;">Shipping Fee:</span>
                <span>Rs. ${Number(orderOrInvoice.shipping).toLocaleString()}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid #059669; font-size: 16px; font-weight: bold; color: #059669; margin-top: 6px;">
              <span>Net Total:</span>
              <span>Rs. ${Number(orderOrInvoice.total || 0).toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px;">
              <span>Paid Amount:</span>
              <span class="font-bold">Rs. ${Number(orderOrInvoice.paidAmount || orderOrInvoice.total || 0).toLocaleString()}</span>
            </div>
            ${orderOrInvoice.dueAmount ? `
              <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; color: #dc2626; font-weight: bold;">
                <span>Balance Due:</span>
                <span>Rs. ${Number(orderOrInvoice.dueAmount).toLocaleString()}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Footer Signatures -->
        <div style="display: flex; justify-content: space-between; margin-top: 60px; padding-top: 10px;">
          <div style="border-top: 1px solid #94a3b8; width: 180px; text-align: center; font-size: 11px; color: #64748b;">
            Customer Signature
          </div>
          <div style="border-top: 1px solid #94a3b8; width: 180px; text-align: center; font-size: 11px; color: #64748b;">
            Authorized Signature & Stamp
          </div>
        </div>
      </div>
    `;

    this.openPrintWindow(invoiceHtml, `Invoice-${invNumber}`);
  }

  /**
   * 3. Print Purchase Order
   */
  public printPurchase(purchase: Purchase, brand: BrandSettings) {
    const purchaseHtml = `
      <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0284c7; padding-bottom: 16px;">
          <div>
            <h1 style="margin: 0; color: #0284c7; font-size: 24px; text-transform: uppercase;">${brand.businessName}</h1>
            <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Purchasing & Supply Chain Division</p>
            <p style="margin: 2px 0; font-size: 12px; color: #64748b;">${brand.address}, ${brand.city}</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 22px;">PURCHASE ORDER</h2>
            <p style="margin: 4px 0 0 0; font-weight: bold; color: #0284c7;"># ${purchase.invoiceNumber}</p>
            <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Date: ${new Date(purchase.createdAt || purchase.date || Date.now()).toLocaleDateString()}</p>
            <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Status: <strong>${purchase.status}</strong></p>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin: 20px 0; background: #f8fafc; padding: 14px; border-radius: 8px;">
          <div>
            <h4 style="margin: 0 0 4px 0; font-size: 11px; color: #64748b; text-transform: uppercase;">Supplier:</h4>
            <p style="margin: 0; font-weight: bold; font-size: 14px;">${purchase.supplierName}</p>
          </div>
          <div style="text-align: right;">
            <h4 style="margin: 0 0 4px 0; font-size: 11px; color: #64748b; text-transform: uppercase;">Warehouse Destination:</h4>
            <p style="margin: 0; font-weight: bold; font-size: 14px;">${purchase.warehouseName || 'Central Warehouse'}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product / Raw Material</th>
              <th>Quantity</th>
              <th class="text-right">Unit Cost</th>
              <th class="text-right">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            ${(purchase.items || [])
              .map(
                (it, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${it.productName}</strong></td>
                <td>${it.quantity}</td>
                <td class="text-right">Rs. ${Number(it.unitCost || it.purchasePrice || 0).toLocaleString()}</td>
                <td class="text-right font-bold">Rs. ${Number(it.total || it.quantity * (it.unitCost || it.purchasePrice || 0)).toLocaleString()}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div style="text-align: right; margin-top: 16px; font-size: 14px;">
          <p style="margin: 4px 0;">Subtotal: <strong>Rs. ${Number(purchase.subtotal || 0).toLocaleString()}</strong></p>
          ${purchase.tax ? `<p style="margin: 4px 0;">Tax: Rs. ${Number(purchase.tax).toLocaleString()}</p>` : ''}
          <p style="margin: 8px 0; font-size: 18px; color: #0284c7; font-weight: bold;">
            Grand Total: Rs. ${Number(purchase.total || 0).toLocaleString()}
          </p>
          <p style="margin: 4px 0; font-size: 12px; color: #64748b;">
            Paid Amount: Rs. ${Number(purchase.paidAmount ?? purchase.paid ?? 0).toLocaleString()} | Balance: Rs. ${Number(purchase.dueAmount ?? purchase.due ?? 0).toLocaleString()}
          </p>
        </div>
      </div>
    `;

    this.openPrintWindow(purchaseHtml, `PO-${purchase.invoiceNumber}`);
  }

  public printPurchaseOrder(purchase: Purchase, brand: BrandSettings) {
    return this.printPurchase(purchase, brand);
  }

  /**
   * 4. Print Customer Account Ledger
   */
  public printCustomerLedger(customer: Customer, ledgerEntries: any[], brand: BrandSettings) {
    const ledgerHtml = `
      <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #059669; padding-bottom: 16px;">
          <div>
            <h1 style="margin: 0; color: #059669; font-size: 24px;">${brand.businessName}</h1>
            <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Customer Account Statement</p>
          </div>
          <div style="text-align: right;">
            <h3 style="margin: 0;">STATEMENT OF ACCOUNT</h3>
            <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Generated: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div style="margin: 16px 0; background: #f8fafc; padding: 12px; border-radius: 6px;">
          <p style="margin: 0; font-size: 15px; font-weight: bold;">${customer.name}</p>
          <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Phone: ${customer.phone} | City: ${customer.city}</p>
          <p style="margin: 2px 0; font-size: 12px; color: #dc2626; font-weight: bold;">Current Outstanding Balance: Rs. ${Number(customer.outstandingBalance || 0).toLocaleString()}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description / Ref</th>
              <th class="text-right">Debit (Rs)</th>
              <th class="text-right">Credit (Rs)</th>
              <th class="text-right">Balance (Rs)</th>
            </tr>
          </thead>
          <tbody>
            ${ledgerEntries
              .map(
                (en) => `
              <tr>
                <td>${new Date(en.date).toLocaleDateString()}</td>
                <td>${en.description}</td>
                <td class="text-right" style="color: ${en.debit ? '#dc2626' : '#64748b'};">${en.debit ? Number(en.debit).toLocaleString() : '-'}</td>
                <td class="text-right" style="color: ${en.credit ? '#16a34a' : '#64748b'};">${en.credit ? Number(en.credit).toLocaleString() : '-'}</td>
                <td class="text-right font-bold">Rs. ${Number(en.balance).toLocaleString()}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;

    this.openPrintWindow(ledgerHtml, `CustomerLedger-${customer.name}`);
  }

  /**
   * 5. Print Supplier Account Ledger
   */
  public printSupplierLedger(supplier: Supplier, ledgerEntries: any[], brand: BrandSettings) {
    const ledgerHtml = `
      <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0284c7; padding-bottom: 16px;">
          <div>
            <h1 style="margin: 0; color: #0284c7; font-size: 24px;">${brand.businessName}</h1>
            <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Supplier Account Statement</p>
          </div>
          <div style="text-align: right;">
            <h3 style="margin: 0;">SUPPLIER LEDGER</h3>
            <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Generated: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div style="margin: 16px 0; background: #f8fafc; padding: 12px; border-radius: 6px;">
          <p style="margin: 0; font-size: 15px; font-weight: bold;">${supplier.company || supplier.name}</p>
          <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Contact: ${supplier.contactPerson || supplier.name} | Phone: ${supplier.phone}</p>
          <p style="margin: 2px 0; font-size: 12px; color: #dc2626; font-weight: bold;">Payable Balance: Rs. ${Number(supplier.outstandingBalance || 0).toLocaleString()}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description / Ref</th>
              <th class="text-right">Purchases / Debit (Rs)</th>
              <th class="text-right">Paid / Credit (Rs)</th>
              <th class="text-right">Balance (Rs)</th>
            </tr>
          </thead>
          <tbody>
            ${ledgerEntries
              .map(
                (en) => `
              <tr>
                <td>${new Date(en.date).toLocaleDateString()}</td>
                <td>${en.description}</td>
                <td class="text-right">${en.debit ? Number(en.debit).toLocaleString() : '-'}</td>
                <td class="text-right" style="color: #16a34a;">${en.credit ? Number(en.credit).toLocaleString() : '-'}</td>
                <td class="text-right font-bold">Rs. ${Number(en.balance).toLocaleString()}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;

    this.openPrintWindow(ledgerHtml, `SupplierLedger-${supplier.name}`);
  }

  /**
   * 6. Print Report View (Generic analytical report)
   */
  public printReport(
    title: string,
    dateRange: string,
    columns: ReportColumn[],
    rows: any[],
    summaryMetrics: Array<{ label: string; value: string | number }>,
    brand: BrandSettings
  ) {
    const reportHtml = `
      <div style="max-width: 900px; margin: 0 auto; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #059669; padding-bottom: 16px;">
          <div>
            <h1 style="margin: 0; color: #059669; font-size: 24px;">${brand.businessName}</h1>
            <h2 style="margin: 4px 0 0 0; font-size: 18px; color: #1e293b;">${title}</h2>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 12px; color: #64748b;">Period: <strong>${dateRange}</strong></p>
            <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Generated: ${new Date().toLocaleString()}</p>
          </div>
        </div>

        <!-- Summary Metrics -->
        ${summaryMetrics.length > 0 ? `
          <div style="display: flex; gap: 16px; margin: 20px 0; flex-wrap: wrap;">
            ${summaryMetrics
              .map(
                (m) => `
              <div style="flex: 1; min-width: 140px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center;">
                <p style="margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase;">${m.label}</p>
                <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: bold; color: #059669;">${m.value}</p>
              </div>
            `
              )
              .join('')}
          </div>
        ` : ''}

        <!-- Table -->
        <table>
          <thead>
            <tr>
              ${columns
                .map(
                  (col) => `
                <th class="${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}">${col.header}</th>
              `
                )
                .join('')}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
              <tr>
                ${columns
                  .map((col) => {
                    const val = row[col.key];
                    const formatted = col.format ? col.format(val) : val;
                    return `<td class="${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}">${formatted ?? '-'}</td>`;
                  })
                  .join('')}
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;

    this.openPrintWindow(reportHtml, title);
  }

  /**
   * 7. Universal CSV Downloader
   */
  public downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
    const csvContent =
      '\uFEFF' +
      [
        headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
        ...rows.map((r) =>
          r
            .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
            .join(',')
        ),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * 8. Export Array of Objects directly to CSV
   */
  public exportToCSV(data: Record<string, any>[], filename: string) {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const rows = data.map((item) => headers.map((key) => item[key] ?? ''));
    this.downloadCsv(filename, headers, rows);
  }
}

export const printService = new PrintService();
