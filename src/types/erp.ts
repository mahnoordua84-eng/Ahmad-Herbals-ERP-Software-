export type RoleType = 
  | 'Super Admin'
  | 'Admin'
  | 'Manager'
  | 'Inventory Manager'
  | 'Sales Manager'
  | 'Purchase Manager'
  | 'Accountant'
  | 'Warehouse Manager'
  | 'POS User'
  | 'Delivery Manager'
  | 'Content Manager';

export type UserRole =
  | RoleType
  | 'ADMIN'
  | 'MANAGER'
  | 'CASHIER'
  | 'INVENTORY_MANAGER'
  | 'ACCOUNTANT'
  | 'DELIVERY_RIDER';

export type ExpenseCategory =
  | 'PACKAGING'
  | 'DELIVERY'
  | 'UTILITIES'
  | 'SALARY'
  | 'MARKETING'
  | 'RENT'
  | 'MAINTENANCE'
  | 'TAX'
  | 'MISC'
  | 'Salaries'
  | 'Electricity'
  | 'Packaging'
  | 'Transportation'
  | 'Advertising'
  | 'Office Expenses'
  | 'Other'
  | string;

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export' | 'print';

export type ModuleName =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'brands'
  | 'inventory'
  | 'warehouses'
  | 'stock_transfers'
  | 'low_stock'
  | 'purchases'
  | 'suppliers'
  | 'sales'
  | 'pos'
  | 'orders'
  | 'customers'
  | 'invoices'
  | 'payments'
  | 'expenses'
  | 'accounting'
  | 'profit_loss'
  | 'reports'
  | 'analytics'
  | 'employees'
  | 'roles'
  | 'audit'
  | 'notifications'
  | 'website'
  | 'media'
  | 'pages'
  | 'coupons'
  | 'marketing'
  | 'reviews'
  | 'returns'
  | 'delivery'
  | 'tracking'
  | 'backup'
  | 'settings';

export interface RolePermissions {
  role: RoleType;
  description: string;
  permissions: Partial<Record<ModuleName, PermissionAction[]>>;
}

export interface BrandSettings {
  id: string;
  businessName: string;
  shortName: string;
  logo: string;
  favicon: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  sidebarColor: string;
  businessDescription: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  country: string;
  currency: string;
  currencySymbol: string;
  currencyPosition: 'prefix' | 'suffix';
  taxName: string;
  taxRate: number; // percentage
  websiteUrl: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
    youtube?: string;
  };
}

export interface GeneralSettings {
  legalBusinessName: string;
  registrationNumber: string;
  taxNumber: string;
  state: string;
  postalCode: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  fiscalYear: string;
  invoicePrefix: string;
  orderPrefix: string;
  skuPrefix: string;
  lowStockThreshold: number;
  paginationLimit: number;
  enableStockAlerts: boolean;
  enableAuditLog: boolean;
  requireApprovalForRefunds: boolean;
  requireApprovalForLargeExpenses: boolean;
  largeExpenseThreshold: number;
}

export interface Brand {
  id: string;
  name: string;
  code?: string;
  shortName?: string;
  logo: string;
  description: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  parentId?: string | null; // For unlimited subcategory nesting
  image?: string;
  description?: string;
  status: 'active' | 'inactive';
  order: number;
  seoTitle?: string;
  seoDescription?: string;
}

export interface ProductVariation {
  id: string;
  sku: string;
  barcode: string;
  weight: number;
  unit: string; // KG, Grams, Pack, Litre
  purchasePrice: number;
  salePrice: number;
  discountPrice?: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  brandId: string;
  categoryId: string;
  subcategoryId?: string;
  shortDescription: string;
  fullDescription: string;
  description?: string;
  ingredients?: string;
  weight: number;
  unit: string;
  purchasePrice: number;
  costPrice?: number;
  salePrice: number;
  sellingPrice?: number;
  wholesalePrice?: number;
  discountPrice?: number;
  tax: number; // percentage
  stock: number; // total stock across warehouses
  minStock: number;
  maxStock: number;
  supplierId?: string;
  image: string;
  gallery: string[];
  status: 'active' | 'inactive' | 'draft';
  featured: boolean;
  bestseller: boolean;
  isNew: boolean;
  seoTitle?: string;
  seoDescription?: string;
  tags: string[];
  hasVariations: boolean;
  variations: ProductVariation[];
  createdAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code?: string;
  type: 'Main Warehouse' | 'Store' | 'Branch' | 'Factory' | 'Distribution Center';
  address: string;
  city: string;
  managerName?: string;
  managerPhone?: string;
  manager?: string;
  phone?: string;
  status: 'active' | 'inactive';
  isDefault?: boolean;
}

export interface WarehouseInventory {
  id: string;
  warehouseId: string;
  productId: string;
  variationId?: string;
  physicalStock: number;
  reservedStock: number;
  damagedStock: number;
  // Available Stock = Physical Stock - Reserved Stock - Damaged Stock
}

export type StockMovementType = 
  | 'STOCK_IN' 
  | 'STOCK_OUT' 
  | 'ADJUSTMENT' 
  | 'TRANSFER' 
  | 'DAMAGED' 
  | 'RETURNED' 
  | 'SALE';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  variationId?: string;
  warehouseId: string;
  toWarehouseId?: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceNo?: string;
  reason: string;
  performedBy: string;
  timestamp: string;
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city?: string;
  paymentTerms?: string;
  contactPerson?: string;
  taxNumber?: string;
  openingBalance: number;
  totalPurchases: number;
  paidAmount: number;
  outstandingBalance: number;
  status: 'active' | 'inactive';
}

export interface SupplierLedgerEntry {
  id: string;
  supplierId: string;
  date: string;
  type: 'PURCHASE' | 'PAYMENT' | 'RETURN';
  referenceNo: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  variationId?: string;
  weightLabel?: string;
  quantity: number;
  purchasePrice: number;
  costPrice?: number;
  total: number;
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  paid: number;
  due: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  date: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  type: 'RETAIL' | 'WHOLESALE' | 'VIP' | 'DISTRIBUTOR';
  totalOrders: number;
  totalSpent: number;
  outstandingBalance: number;
  creditBalance?: number;
  creditLimit?: number;
  lastOrderDate?: string;
  status: 'active' | 'inactive';
}

export interface CustomerLedgerEntry {
  id: string;
  customerId: string;
  date: string;
  type: 'SALE' | 'PAYMENT' | 'REFUND';
  referenceNo: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  variationId?: string;
  unitWeight?: string;
  price: number;
  purchasePrice: number; // For exact COGS and profit computation
  quantity: number;
  discount: number;
  total: number;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export type DeliveryStatus =
  | 'PENDING'
  | 'PACKED'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'RETURNED';

export interface Order {
  id: string;
  orderNumber: string;
  channel: 'POS' | 'ONLINE' | 'MANUAL' | 'WHOLESALE' | 'RETAIL';
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  shipping: number;
  tax: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING' | 'REFUNDED';
  orderStatus: OrderStatus;
  deliveryStatus: DeliveryStatus;
  warehouseId: string;
  courier?: string;
  trackingNumber?: string;
  dispatchDate?: string;
  deliveryDate?: string;
  notes?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING';
  date: string;
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  accountTitle: string;
  accountNumber: string;
  iban?: string;
  instructions: string;
  qrCodeUrl?: string;
  status: 'active' | 'inactive';
}

export interface PaymentRecord {
  id: string;
  orderId?: string;
  purchaseId?: string;
  customerId?: string;
  customerName?: string;
  supplierId?: string;
  supplierName?: string;
  type: 'INFLOW' | 'OUTFLOW';
  amount: number;
  method: string;
  transactionRef?: string;
  date: string;
  note?: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  paymentMethod: string;
  date: string;
  warehouseId?: string;
  warehouseName?: string;
  reference?: string;
  receiptUrl?: string;
  notes?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type?: 'PERCENTAGE' | 'FIXED' | 'percentage' | 'fixed';
  discountType?: 'percentage' | 'fixed';
  value?: number;
  discountValue?: number;
  minOrderAmount?: number;
  minimumOrder?: number;
  maxDiscount?: number;
  maximumDiscount?: number;
  validUntil?: string;
  expiryDate?: string;
  usageLimit?: number;
  usageCount?: number;
  status: 'active' | 'inactive' | 'ACTIVE' | 'EXPIRED';
}

export interface OrderReturn {
  id: string;
  returnNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: string;
  condition: 'UNOPENED' | 'OPENED_DEFECTIVE' | 'EXPIRED' | 'DAMAGED_IN_TRANSIT';
  refundAmount: number;
  restockInventory: boolean;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED';
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  email: string;
  department: string;
  designation: string;
  role?: UserRole;
  warehouseId?: string;
  joiningDate: string;
  salary: number;
  status: 'active' | 'inactive' | 'on_leave' | 'ACTIVE' | 'INACTIVE';
  attendanceRate?: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: ModuleName;
  recordId: string;
  oldValue?: string;
  newValue?: string;
  ip: string;
  timestamp: string;
}

export interface ERPNotification {
  id: string;
  type: 'ORDER' | 'STOCK' | 'PAYMENT' | 'CUSTOMER' | 'PURCHASE' | 'RETURN' | 'EXPENSE' | 'SYSTEM';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  linkToModule?: ModuleName;
}

export interface WebsiteCMS {
  general: {
    announcementBarText: string;
    announcementBarEnabled: boolean;
  };
  homepage: {
    heroHeading: string;
    heroDescription: string;
    heroImage: string;
    ctaPrimaryText: string;
    ctaPrimaryLink: string;
    ctaSecondaryText: string;
    ctaSecondaryLink: string;
    featuredCategoryIds: string[];
    featuredProductIds: string[];
    testimonials: Array<{
      id: string;
      customerName: string;
      rating: number;
      comment: string;
      verified: boolean;
    }>;
    faqs: Array<{
      id: string;
      question: string;
      answer: string;
    }>;
  };
  footer: {
    description: string;
    copyrightText: string;
    links: Array<{ title: string; url: string }>;
  };
}

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  size: string;
  category: 'Products' | 'Banners' | 'Brands' | 'Receipts' | 'General';
  dimensions?: string;
  uploadedAt: string;
}
