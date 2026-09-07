import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  BrandSettings,
  GeneralSettings,
  Brand,
  Category,
  Product,
  ProductVariation,
  Warehouse,
  WarehouseInventory,
  Supplier,
  SupplierLedgerEntry,
  Customer,
  CustomerLedgerEntry,
  Order,
  OrderItem,
  Purchase,
  Invoice,
  PaymentMethodConfig,
  PaymentRecord,
  Expense,
  Coupon,
  OrderReturn,
  Employee,
  RolePermissions,
  RoleType,
  AuditLog,
  ERPNotification,
  WebsiteCMS,
  MediaAsset,
  StockMovement,
  StockMovementType,
  ModuleName,
  PermissionAction,
  SalesChannel,
  ChannelProductMapping,
  WebhookEvent,
  SyncLog,
  MarketplaceSettlement,
  MarketplaceFeeConfig,
  InventoryReservation,
  ChannelHealthStatus,
  FinancialStats,
  OfflineSale,
} from '../types/erp';
import { posOfflineDB } from '../services/posOfflineDB';
import {
  initialBrandSettings,
  initialGeneralSettings,
  initialBrands,
  initialCategories,
  initialProducts,
  initialWarehouses,
  initialWarehouseInventory,
  initialSuppliers,
  initialSupplierLedger,
  initialCustomers,
  initialCustomerLedger,
  initialOrders,
  initialPurchases,
  initialInvoices,
  initialPaymentMethods,
  initialPaymentRecords,
  initialExpenses,
  initialCoupons,
  initialReturns,
  initialEmployees,
  initialRolePermissions,
  initialAuditLogs,
  initialNotifications,
  initialWebsiteCMS,
  initialMediaAssets,
  initialStockMovements,
  initialSalesChannels,
  initialChannelMappings,
  initialSyncLogs,
  initialWebhookEvents,
  initialSettlements,
  initialFeeConfigs,
  initialReservations,
} from '../data/seedData';
import { ConnectorFactory } from '../connectors';
import { Language, getTranslation } from './i18n';

interface ERPContextType {
  // State
  brandSettings: BrandSettings;
  generalSettings: GeneralSettings;
  brands: Brand[];
  activeBrandId: string;
  categories: Category[];
  products: Product[];
  warehouses: Warehouse[];
  warehouseInventory: WarehouseInventory[];
  stockMovements: StockMovement[];
  suppliers: Supplier[];
  supplierLedger: SupplierLedgerEntry[];
  purchases: Purchase[];
  customers: Customer[];
  customerLedger: CustomerLedgerEntry[];
  orders: Order[];
  invoices: Invoice[];
  paymentMethods: PaymentMethodConfig[];
  paymentRecords: PaymentRecord[];
  expenses: Expense[];
  coupons: Coupon[];
  returns: OrderReturn[];
  employees: Employee[];
  rolePermissions: Record<string, RolePermissions>;
  currentRole: RoleType;
  auditLogs: AuditLog[];
  notifications: ERPNotification[];
  websiteCMS: WebsiteCMS;
  mediaAssets: MediaAsset[];
  
  // Active Navigation Module & Current User
  activeModule: ModuleName;
  setActiveModule: (module: ModuleName) => void;
  currentUserRole: RoleType;

  // App Environment & Preferences
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  formatCurrency: (amount: number) => string;
  financialStats: FinancialStats;
  setCurrentRole: (role: RoleType) => void;
  hasPermission: (
    moduleOrRole: ModuleName | RoleType | string,
    actionOrModule?: PermissionAction | ModuleName
  ) => boolean;
  setActiveBrandId: (brandId: string) => void;

  // Actions
  updateBrandSettings: (newSettings: Partial<BrandSettings>) => void;
  updateGeneralSettings: (newSettings: Partial<GeneralSettings>) => void;
  
  // Brands
  addBrand: (brand: Omit<Brand, 'id' | 'createdAt'>) => void;
  updateBrand: (id: string, brand: Partial<Brand>) => void;
  deleteBrand: (id: string) => void;

  // Categories
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Products
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Warehouses & Inventory
  addWarehouse: (wh: Omit<Warehouse, 'id'>) => void;
  updateWarehouse: (id: string, wh: Partial<Warehouse>) => void;
  deleteWarehouse: (id: string) => void;
  getAvailableStock: (productId: string, warehouseId?: string) => number;
  adjustStock: (
    productId: string,
    warehouseId: string,
    quantityDelta: number,
    type: StockMovementType,
    reason: string
  ) => void;
  transferStock: (
    productId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    quantity: number,
    reason: string
  ) => void;

  // Purchases & Suppliers
  addPurchase: (purchase: Omit<Purchase, 'id' | 'invoiceNumber'>) => void;
  receivePurchase: (purchaseId: string) => void;
  addPurchasePayment: (purchaseId: string, amount: number, method: string, notes?: string) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'totalPurchases' | 'paidAmount' | 'outstandingBalance'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addSupplierPayment: (supplierId: string, amount: number, method: string, notes?: string) => void;

  // Sales & Orders & POS
  createOrder: (orderData: {
    customerId: string;
    items: OrderItem[];
    channel: 'POS' | 'ONLINE' | 'MANUAL' | 'WHOLESALE' | 'RETAIL' | 'DARAZ' | 'SHOPIFY' | 'WOOCOMMERCE' | 'WEBSITE';
    paymentMethod: string;
    paidAmount: number;
    shipping?: number;
    discount?: number;
    couponCode?: string;
    warehouseId?: string;
    notes?: string;
    channelId?: string;
    channelType?: 'DARAZ' | 'WOOCOMMERCE' | 'SHOPIFY' | 'WEBSITE' | 'POS' | 'MANUAL';
    externalOrderId?: string;
    channelFee?: number;
    commission?: number;
    netProfit?: number;
  }) => Order;
  posCheckout: (saleData: {
    customerId: string;
    customerName?: string;
    customerPhone?: string;
    items: OrderItem[];
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
    paymentMethod: string;
    paidAmount: number;
    warehouseId?: string;
    notes?: string;
    couponCode?: string;
  }) => Promise<{ success: boolean; order: Order; invoice: Invoice; isOffline?: boolean }>;
  syncOfflineSales: () => Promise<{ syncedCount: number; pendingCount: number }>;
  pendingOfflineCount: number;
  isOnline: boolean;
  updateOrderStatus: (orderId: string, status: Order['orderStatus']) => void;
  updateDeliveryStatus: (orderId: string, status: Order['deliveryStatus'], courier?: string, tracking?: string) => void;

  // Customers
  addCustomer: (customer: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'outstandingBalance'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addCustomerPayment: (customerId: string, amount: number, method: string, note?: string) => void;
  addInvoicePayment: (invoiceId: string, amount: number, method: string, note?: string) => void;

  // Payments & Methods
  addPaymentMethod: (method: Omit<PaymentMethodConfig, 'id'>) => void;
  updatePaymentMethod: (id: string, method: Partial<PaymentMethodConfig>) => void;
  deletePaymentMethod: (id: string) => void;

  // Expenses
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'status'>) => void;
  updateExpenseStatus: (id: string, status: Expense['status']) => void;
  deleteExpense: (id: string) => void;

  // Coupons
  addCoupon: (coupon: Omit<Coupon, 'id' | 'usageCount'>) => void;
  updateCoupon: (id: string, coupon: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;

  // Returns
  processReturn: (returnData: Omit<OrderReturn, 'id' | 'returnNumber' | 'createdAt' | 'status'>) => void;
  updateReturnStatus: (id: string, status: OrderReturn['status']) => void;

  // Employees
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, emp: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  // Website CMS & Media
  updateWebsiteCMS: (cms: Partial<WebsiteCMS>) => void;
  addMediaAsset: (asset: Omit<MediaAsset, 'id' | 'uploadedAt'>) => void;
  deleteMediaAsset: (id: string) => void;

  // Notifications
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notif: Omit<ERPNotification, 'id' | 'timestamp' | 'read'>) => void;

  // Audit
  logAudit: (action: string, module: ModuleName, recordId: string, oldValue?: string, newValue?: string) => void;

  // Multi-Channel Universal Commerce & Synchronization
  salesChannels: SalesChannel[];
  channelMappings: ChannelProductMapping[];
  syncLogs: SyncLog[];
  webhookEvents: WebhookEvent[];
  settlements: MarketplaceSettlement[];
  feeConfigs: MarketplaceFeeConfig[];
  reservations: InventoryReservation[];
  channelHealth: ChannelHealthStatus[];

  updateSalesChannel: (id: string, updates: Partial<SalesChannel>) => void;
  toggleChannelEnabled: (id: string) => void;
  testChannelConnection: (id: string) => Promise<{ isHealthy: boolean; latencyMs: number; details: string }>;
  triggerChannelSync: (id: string, entityType: 'ALL' | 'PRODUCTS' | 'ORDERS' | 'INVENTORY' | 'SETTLEMENTS') => Promise<void>;
  addChannelProductMapping: (mapping: Omit<ChannelProductMapping, 'id'>) => void;
  updateChannelProductMapping: (id: string, updates: Partial<ChannelProductMapping>) => void;
  deleteChannelProductMapping: (id: string) => void;
  addSettlement: (settlement: Omit<MarketplaceSettlement, 'id' | 'createdAt'>) => void;
  reconcileSettlement: (id: string, bankReference: string) => void;
  simulateWebhookEvent: (channelId: string, eventType: string, payload: Record<string, unknown>) => Promise<void>;
  clearSyncLogs: () => void;
  updateChannelFeeConfig: (id: string, updates: Partial<MarketplaceFeeConfig>) => void;
  broadcastInventoryUpdate: (productId?: string) => Promise<void>;

  // Backup & Restore
  createBackupJSON: () => string;
  restoreFromBackupJSON: (jsonString: string) => boolean;
  resetToFactoryDefaults: () => void;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export const ERPProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load state from localStorage or fallback to seeds
  const [brandSettings, setBrandSettings] = useState<BrandSettings>(() => {
    const saved = localStorage.getItem('ah_erp_brand_settings');
    return saved ? JSON.parse(saved) : initialBrandSettings;
  });

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(() => {
    const saved = localStorage.getItem('ah_erp_general_settings');
    return saved ? JSON.parse(saved) : initialGeneralSettings;
  });

  const [brands, setBrands] = useState<Brand[]>(() => {
    const saved = localStorage.getItem('ah_erp_brands');
    return saved ? JSON.parse(saved) : initialBrands;
  });

  const [activeBrandId, setActiveBrandId] = useState<string>('b-1');

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('ah_erp_categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(0);

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('ah_erp_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem('ah_erp_warehouses');
    return saved ? JSON.parse(saved) : initialWarehouses;
  });

  const [warehouseInventory, setWarehouseInventory] = useState<WarehouseInventory[]>(() => {
    const saved = localStorage.getItem('ah_erp_inventory');
    return saved ? JSON.parse(saved) : initialWarehouseInventory;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('ah_erp_stock_movements');
    return saved ? JSON.parse(saved) : initialStockMovements;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('ah_erp_suppliers');
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [supplierLedger, setSupplierLedger] = useState<SupplierLedgerEntry[]>(() => {
    const saved = localStorage.getItem('ah_erp_supplier_ledger');
    return saved ? JSON.parse(saved) : initialSupplierLedger;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('ah_erp_customers');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [customerLedger, setCustomerLedger] = useState<CustomerLedgerEntry[]>(() => {
    const saved = localStorage.getItem('ah_erp_customer_ledger');
    return saved ? JSON.parse(saved) : initialCustomerLedger;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('ah_erp_orders');
    return saved ? JSON.parse(saved) : initialOrders;
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const saved = localStorage.getItem('ah_erp_purchases');
    return saved ? JSON.parse(saved) : initialPurchases;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('ah_erp_invoices');
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(() => {
    const saved = localStorage.getItem('ah_erp_payment_methods');
    return saved ? JSON.parse(saved) : initialPaymentMethods;
  });

  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('ah_erp_payment_records');
    return saved ? JSON.parse(saved) : initialPaymentRecords;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('ah_erp_expenses');
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('ah_erp_coupons');
    return saved ? JSON.parse(saved) : initialCoupons;
  });

  const [returns, setReturns] = useState<OrderReturn[]>(() => {
    const saved = localStorage.getItem('ah_erp_returns');
    return saved ? JSON.parse(saved) : initialReturns;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('ah_erp_employees');
    return saved ? JSON.parse(saved) : initialEmployees;
  });

  const [rolePermissions] = useState<Record<string, RolePermissions>>(initialRolePermissions);
  const [currentRole, setCurrentRole] = useState<RoleType>('Super Admin');
  const [activeModule, setActiveModuleState] = useState<ModuleName>(() => {
    return (localStorage.getItem('ah_erp_active_module') as ModuleName) || 'dashboard';
  });

  const setActiveModule = (mod: ModuleName) => {
    setActiveModuleState(mod);
    localStorage.setItem('ah_erp_active_module', mod);
  };

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('ah_erp_audit_logs');
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  const [notifications, setNotifications] = useState<ERPNotification[]>(() => {
    const saved = localStorage.getItem('ah_erp_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [websiteCMS, setWebsiteCMS] = useState<WebsiteCMS>(() => {
    const saved = localStorage.getItem('ah_erp_website_cms');
    return saved ? JSON.parse(saved) : initialWebsiteCMS;
  });

  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(() => {
    const saved = localStorage.getItem('ah_erp_media');
    return saved ? JSON.parse(saved) : initialMediaAssets;
  });

  // ==========================================================================
  // MULTI-CHANNEL COMMERCE STATE
  // ==========================================================================
  const [salesChannels, setSalesChannels] = useState<SalesChannel[]>(() => {
    const saved = localStorage.getItem('ah_erp_sales_channels');
    return saved ? JSON.parse(saved) : initialSalesChannels;
  });

  const [channelMappings, setChannelMappings] = useState<ChannelProductMapping[]>(() => {
    const saved = localStorage.getItem('ah_erp_channel_mappings');
    return saved ? JSON.parse(saved) : initialChannelMappings;
  });

  const [syncLogs, setSyncLogs] = useState<SyncLog[]>(() => {
    const saved = localStorage.getItem('ah_erp_sync_logs');
    return saved ? JSON.parse(saved) : initialSyncLogs;
  });

  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>(() => {
    const saved = localStorage.getItem('ah_erp_webhook_events');
    return saved ? JSON.parse(saved) : initialWebhookEvents;
  });

  const [settlements, setSettlements] = useState<MarketplaceSettlement[]>(() => {
    const saved = localStorage.getItem('ah_erp_settlements');
    return saved ? JSON.parse(saved) : initialSettlements;
  });

  const [feeConfigs, setFeeConfigs] = useState<MarketplaceFeeConfig[]>(() => {
    const saved = localStorage.getItem('ah_erp_fee_configs');
    return saved ? JSON.parse(saved) : initialFeeConfigs;
  });

  const [reservations, setReservations] = useState<InventoryReservation[]>(() => {
    const saved = localStorage.getItem('ah_erp_reservations');
    return saved ? JSON.parse(saved) : initialReservations;
  });

  const [channelHealth, setChannelHealth] = useState<ChannelHealthStatus[]>([
    {
      channelId: 'chan-daraz',
      channelName: 'Daraz Pakistan Official Store',
      platform: 'DARAZ',
      isConnected: true,
      authStatus: 'HEALTHY',
      productsSyncStatus: 'HEALTHY',
      ordersSyncStatus: 'HEALTHY',
      inventorySyncStatus: 'HEALTHY',
      webhooksStatus: 'HEALTHY',
      responseTimeMs: 64,
      lastHeartbeat: new Date().toISOString(),
      lastSync: '2026-09-04T18:10:00',
    },
    {
      channelId: 'chan-website',
      channelName: 'Ahmad Herbals Web Store',
      platform: 'WEBSITE',
      isConnected: true,
      authStatus: 'HEALTHY',
      productsSyncStatus: 'HEALTHY',
      ordersSyncStatus: 'HEALTHY',
      inventorySyncStatus: 'HEALTHY',
      webhooksStatus: 'HEALTHY',
      responseTimeMs: 22,
      lastHeartbeat: new Date().toISOString(),
      lastSync: '2026-09-04T18:12:00',
    },
    {
      channelId: 'chan-shopify',
      channelName: 'Shopify Premium Portal',
      platform: 'SHOPIFY',
      isConnected: true,
      authStatus: 'HEALTHY',
      productsSyncStatus: 'HEALTHY',
      ordersSyncStatus: 'HEALTHY',
      inventorySyncStatus: 'HEALTHY',
      webhooksStatus: 'HEALTHY',
      responseTimeMs: 78,
      lastHeartbeat: new Date().toISOString(),
      lastSync: '2026-09-04T18:00:00',
    },
    {
      channelId: 'chan-woo',
      channelName: 'WooCommerce Wholesale Portal',
      platform: 'WOOCOMMERCE',
      isConnected: true,
      authStatus: 'HEALTHY',
      productsSyncStatus: 'HEALTHY',
      ordersSyncStatus: 'HEALTHY',
      inventorySyncStatus: 'HEALTHY',
      webhooksStatus: 'HEALTHY',
      responseTimeMs: 45,
      lastHeartbeat: new Date().toISOString(),
      lastSync: '2026-09-04T18:02:00',
    },
  ]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('ah_erp_sales_channels', JSON.stringify(salesChannels));
  }, [salesChannels]);

  useEffect(() => {
    localStorage.setItem('ah_erp_channel_mappings', JSON.stringify(channelMappings));
  }, [channelMappings]);

  useEffect(() => {
    localStorage.setItem('ah_erp_sync_logs', JSON.stringify(syncLogs));
  }, [syncLogs]);

  useEffect(() => {
    localStorage.setItem('ah_erp_webhook_events', JSON.stringify(webhookEvents));
  }, [webhookEvents]);

  useEffect(() => {
    localStorage.setItem('ah_erp_settlements', JSON.stringify(settlements));
  }, [settlements]);

  useEffect(() => {
    localStorage.setItem('ah_erp_fee_configs', JSON.stringify(feeConfigs));
  }, [feeConfigs]);

  useEffect(() => {
    localStorage.setItem('ah_erp_reservations', JSON.stringify(reservations));
  }, [reservations]);

  // Dark mode & language
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('ah_erp_lang') as Language) || 'en';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('ah_erp_dark_mode') === 'true';
  });

  // Apply dark mode & language direction to root document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ah_erp_dark_mode', isDarkMode ? 'true' : 'false');
  }, [isDarkMode]);

  useEffect(() => {
    document.documentElement.setAttribute('dir', language === 'ur' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', language);
    localStorage.setItem('ah_erp_lang', language);
  }, [language]);

  // Apply dynamic theme CSS variables for white-labeling
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', brandSettings.primaryColor);
    root.style.setProperty('--brand-secondary', brandSettings.secondaryColor);
    root.style.setProperty('--brand-accent', brandSettings.accentColor);
    root.style.setProperty('--brand-sidebar', brandSettings.sidebarColor);
  }, [brandSettings.primaryColor, brandSettings.secondaryColor, brandSettings.accentColor, brandSettings.sidebarColor]);

  // Auto-persist updates
  useEffect(() => {
    localStorage.setItem('ah_erp_brand_settings', JSON.stringify(brandSettings));
  }, [brandSettings]);

  useEffect(() => {
    localStorage.setItem('ah_erp_general_settings', JSON.stringify(generalSettings));
  }, [generalSettings]);

  useEffect(() => {
    localStorage.setItem('ah_erp_products', JSON.stringify(products));
    posOfflineDB.cacheProducts(products).catch(() => {});
  }, [products]);

  useEffect(() => {
    localStorage.setItem('ah_erp_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('ah_erp_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('ah_erp_customers', JSON.stringify(customers));
    posOfflineDB.cacheCustomers(customers).catch(() => {});
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('ah_erp_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('ah_erp_inventory', JSON.stringify(warehouseInventory));
  }, [warehouseInventory]);

  useEffect(() => {
    localStorage.setItem('ah_erp_stock_movements', JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem('ah_erp_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('ah_erp_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('ah_erp_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('ah_erp_website_cms', JSON.stringify(websiteCMS));
  }, [websiteCMS]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);
  const setLanguage = (lang: Language) => setLanguageState(lang);
  const t = (key: string) => getTranslation(key, language);

  const formatCurrency = (amount: number): string => {
    const formattedNum = Number(amount || 0).toLocaleString('en-US');
    if (brandSettings.currencyPosition === 'prefix') {
      return `${brandSettings.currencySymbol} ${formattedNum}`;
    }
    return `${formattedNum} ${brandSettings.currencySymbol}`;
  };

  const hasPermission = (
    moduleOrRole: ModuleName | RoleType | string,
    actionOrModule: PermissionAction | ModuleName = 'view'
  ): boolean => {
    const knownRoles = [
      'Super Admin',
      'Admin',
      'Manager',
      'Inventory Manager',
      'Sales Manager',
      'Purchase Manager',
      'Accountant',
      'Warehouse Manager',
      'POS User',
      'Delivery Manager',
      'Content Manager',
    ];

    if (knownRoles.includes(moduleOrRole)) {
      if (moduleOrRole === 'Super Admin') return true;
      const roleConf = rolePermissions[moduleOrRole];
      if (!roleConf) return false;
      const targetMod = actionOrModule as ModuleName;
      const modulePerms = roleConf.permissions[targetMod];
      return modulePerms ? modulePerms.includes('view') : false;
    }

    if (currentRole === 'Super Admin') return true;
    const roleConf = rolePermissions[currentRole];
    if (!roleConf) return false;
    const targetModule = moduleOrRole as ModuleName;
    const targetAction = (actionOrModule as PermissionAction) || 'view';
    const modulePerms = roleConf.permissions[targetModule];
    return modulePerms ? modulePerms.includes(targetAction) : false;
  };

  const logAudit = (action: string, module: ModuleName, recordId: string, oldValue?: string, newValue?: string) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: 'usr-current',
      userName: `Admin (${currentRole})`,
      action,
      module,
      recordId,
      oldValue,
      newValue,
      ip: '127.0.0.1 (Session)',
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const addNotification = (notif: Omit<ERPNotification, 'id' | 'timestamp' | 'read'>) => {
    const newN: ERPNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newN, ...prev]);
  };

  // Stock formula calculation: Available Stock = Physical Stock - Reserved Stock - Damaged Stock
  const getAvailableStock = (productId: string, warehouseId?: string): number => {
    const invRecords = warehouseInventory.filter(
      (wi) => wi.productId === productId && (!warehouseId || wi.warehouseId === warehouseId)
    );
    return invRecords.reduce((acc, curr) => {
      const avail = Math.max(0, curr.physicalStock - curr.reservedStock - curr.damagedStock);
      return acc + avail;
    }, 0);
  };

  const adjustStock = (
    productId: string,
    warehouseId: string,
    quantityDelta: number,
    type: StockMovementType,
    reason: string
  ) => {
    const targetProduct = products.find((p) => p.id === productId);
    const existingIndex = warehouseInventory.findIndex(
      (wi) => wi.productId === productId && wi.warehouseId === warehouseId
    );

    let prevStock = 0;
    let newStock = 0;

    setWarehouseInventory((prev) => {
      const copy = [...prev];
      if (existingIndex >= 0) {
        prevStock = copy[existingIndex].physicalStock;
        const updatedPhys = Math.max(0, copy[existingIndex].physicalStock + quantityDelta);
        newStock = updatedPhys;
        copy[existingIndex] = {
          ...copy[existingIndex],
          physicalStock: updatedPhys,
        };
      } else {
        prevStock = 0;
        newStock = Math.max(0, quantityDelta);
        copy.push({
          id: `wi-${Date.now()}`,
          warehouseId,
          productId,
          physicalStock: newStock,
          reservedStock: 0,
          damagedStock: 0,
        });
      }
      return copy;
    });

    // Update product global stock
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const updatedStock = Math.max(0, p.stock + quantityDelta);
          if (updatedStock <= p.minStock) {
            addNotification({
              type: 'STOCK',
              title: `Low Stock: ${p.name}`,
              message: `Available stock for ${p.name} has fallen to ${updatedStock} ${p.unit}.`,
              priority: 'high',
              linkToModule: 'inventory',
            });
          }
          return { ...p, stock: updatedStock };
        }
        return p;
      })
    );

    // Record Stock Movement audit
    const movement: StockMovement = {
      id: `sm-${Date.now()}`,
      productId,
      productName: targetProduct?.name || 'Product',
      warehouseId,
      type,
      quantity: Math.abs(quantityDelta),
      previousStock: prevStock,
      newStock: newStock,
      reason,
      performedBy: `Admin (${currentRole})`,
      timestamp: new Date().toISOString(),
    };
    setStockMovements((prev) => [movement, ...prev]);
    logAudit(`Stock ${type}: ${quantityDelta > 0 ? '+' : ''}${quantityDelta}`, 'inventory', productId, `${prevStock}`, `${newStock}`);
  };

  const transferStock = (
    productId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    quantity: number,
    reason: string
  ) => {
    adjustStock(productId, fromWarehouseId, -quantity, 'TRANSFER', `Transfer to warehouse: ${reason}`);
    adjustStock(productId, toWarehouseId, quantity, 'TRANSFER', `Transfer from warehouse: ${reason}`);
    logAudit(`Stock Transfer ${quantity} units`, 'warehouses', productId, fromWarehouseId, toWarehouseId);
  };

  // Orders & POS (Multi-Channel Universal Transaction)
  const createOrder = (orderData: {
    customerId: string;
    items: OrderItem[];
    channel: 'POS' | 'ONLINE' | 'MANUAL' | 'WHOLESALE' | 'RETAIL' | 'DARAZ' | 'SHOPIFY' | 'WOOCOMMERCE' | 'WEBSITE';
    paymentMethod: string;
    paidAmount: number;
    shipping?: number;
    discount?: number;
    couponCode?: string;
    warehouseId?: string;
    notes?: string;
    channelId?: string;
    channelType?: 'DARAZ' | 'WOOCOMMERCE' | 'SHOPIFY' | 'WEBSITE' | 'POS' | 'MANUAL';
    externalOrderId?: string;
    channelFee?: number;
    commission?: number;
    netProfit?: number;
  }): Order => {
    const customer = customers.find((c) => c.id === orderData.customerId) || {
      id: 'cust-walkin',
      name: 'Walk-in Customer',
      phone: '0300-0000000',
      address: 'In-store',
    };

    const subtotal = orderData.items.reduce((acc, item) => acc + item.total, 0);
    const shipping = orderData.shipping || 0;
    const discount = orderData.discount || 0;
    const tax = 0; // Default zero or calculated
    const total = Math.max(0, subtotal - discount + shipping + tax);
    const dueAmount = Math.max(0, total - orderData.paidAmount);
    const paymentStatus: Order['paymentStatus'] =
      dueAmount === 0 ? 'PAID' : orderData.paidAmount > 0 ? 'PARTIAL' : 'PENDING';

    const orderNumber = `${generalSettings.orderPrefix}${new Date().getFullYear()}-${String(orders.length + 101).padStart(5, '0')}`;
    const invoiceNumber = `${generalSettings.invoicePrefix}${String(invoices.length + 1).padStart(5, '0')}`;
    const defaultWh = orderData.warehouseId || warehouses[0]?.id || 'wh-main';

    // Channel detection and fee calculation
    const channelPlatform = orderData.channelType || (orderData.channel as 'DARAZ' | 'WOOCOMMERCE' | 'SHOPIFY' | 'WEBSITE' | 'POS' | 'MANUAL') || 'MANUAL';
    const matchingChannel = salesChannels.find((c) => c.id === orderData.channelId || c.platform === channelPlatform);

    // Calculate COGS
    const cogs = orderData.items.reduce((sum, item) => {
      const prod = products.find((p) => p.id === item.productId);
      const unitCost = item.purchasePrice || prod?.purchasePrice || (item.price * 0.65);
      return sum + unitCost * item.quantity;
    }, 0);

    const commission = orderData.commission ?? (matchingChannel ? Math.round(total * (matchingChannel.commissionRate / 100)) : 0);
    const paymentFee = matchingChannel ? Math.round(total * (matchingChannel.paymentFeeRate / 100)) : 0;
    const channelFee = orderData.channelFee ?? (matchingChannel ? commission + paymentFee + matchingChannel.fixedFeePerOrder : 0);
    const netProfit = orderData.netProfit ?? Math.round(total - cogs - channelFee - (shipping > 0 ? shipping * 0.5 : 0));

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      externalOrderId: orderData.externalOrderId,
      channel: orderData.channel,
      channelType: channelPlatform,
      channelId: matchingChannel?.id,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      items: orderData.items,
      subtotal,
      discount,
      couponCode: orderData.couponCode,
      shipping,
      tax,
      total,
      paidAmount: orderData.paidAmount,
      dueAmount,
      paymentMethod: orderData.paymentMethod,
      paymentStatus,
      orderStatus: orderData.channel === 'POS' ? 'DELIVERED' : 'CONFIRMED',
      deliveryStatus: orderData.channel === 'POS' ? 'DELIVERED' : 'PENDING',
      fulfillmentStatus: orderData.channel === 'POS' ? 'FULFILLED' : 'UNFULFILLED',
      warehouseId: defaultWh,
      channelFee,
      commission,
      netProfit,
      notes: orderData.notes,
      createdAt: new Date().toISOString(),
    };

    // 1. Deduct Stock from Warehouse and log movement
    orderData.items.forEach((item) => {
      adjustStock(
        item.productId,
        defaultWh,
        -item.quantity,
        'SALE',
        `Sold via ${orderData.channel} order #${orderNumber}`
      );
    });

    // 2. Generate Invoice
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      orderId: newOrder.id,
      orderNumber,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      items: orderData.items,
      subtotal,
      discount,
      shipping,
      tax,
      total,
      paidAmount: orderData.paidAmount,
      dueAmount,
      paymentMethod: orderData.paymentMethod,
      paymentStatus,
      date: new Date().toISOString().split('T')[0],
    };
    setInvoices((prev) => [newInvoice, ...prev]);

    // 3. Record Payment if paidAmount > 0
    if (orderData.paidAmount > 0) {
      const paymentRec: PaymentRecord = {
        id: `pay-${Date.now()}`,
        orderId: newOrder.id,
        customerId: customer.id,
        customerName: customer.name,
        type: 'INFLOW',
        amount: orderData.paidAmount,
        method: orderData.paymentMethod,
        transactionRef: `INV-${newInvoice.invoiceNumber}`,
        date: new Date().toISOString(),
        note: `Payment for Order #${orderNumber}`,
        status: 'COMPLETED',
      };
      setPaymentRecords((prev) => [paymentRec, ...prev]);
    }

    // 4. Update Customer Spending & Ledger
    if (customer.id !== 'cust-walkin') {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === customer.id) {
            return {
              ...c,
              totalOrders: c.totalOrders + 1,
              totalSpent: c.totalSpent + total,
              outstandingBalance: c.outstandingBalance + dueAmount,
              lastOrderDate: new Date().toISOString().split('T')[0],
            };
          }
          return c;
        })
      );

      // Customer Ledger entry
      const ledgerEntry: CustomerLedgerEntry = {
        id: `cl-${Date.now()}`,
        customerId: customer.id,
        date: new Date().toISOString().split('T')[0],
        type: 'SALE',
        referenceNo: invoiceNumber,
        description: `Order #${orderNumber} (${orderData.items.length} items)`,
        debit: total,
        credit: orderData.paidAmount,
        balance: customer.outstandingBalance + dueAmount,
      };
      setCustomerLedger((prev) => [ledgerEntry, ...prev]);
    }

    // 5. Update Coupon usage if used
    if (orderData.couponCode) {
      setCoupons((prev) =>
        prev.map((c) =>
          c.code.toUpperCase() === orderData.couponCode?.toUpperCase()
            ? { ...c, usageCount: c.usageCount + 1 }
            : c
        )
      );
    }

    setOrders((prev) => [newOrder, ...prev]);
    logAudit(`Order Created #${orderNumber}`, 'orders', newOrder.id, 'Draft', `Total: ${formatCurrency(total)}`);
    addNotification({
      type: 'ORDER',
      title: `New Order #${orderNumber}`,
      message: `${customer.name} placed an order of ${formatCurrency(total)} via ${orderData.channel}.`,
      priority: 'medium',
      linkToModule: 'orders',
    });

    return newOrder;
  };

  const syncOfflineSales = async (): Promise<{ syncedCount: number; pendingCount: number }> => {
    try {
      const pendingSales = await posOfflineDB.getPendingOfflineSales();
      if (!pendingSales || pendingSales.length === 0) {
        setPendingOfflineCount(0);
        return { syncedCount: 0, pendingCount: 0 };
      }

      const resp = await fetch('/api/pos/sync-offline-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sales: pendingSales }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.results && Array.isArray(data.results)) {
          for (const res of data.results) {
            if (res.success) {
              await posOfflineDB.markOfflineSaleSynced(
                res.localSaleId,
                res.orderId,
                res.invoiceNumber
              );
            }
          }
        }

        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
          posOfflineDB.cacheProducts(data.products).catch(() => {});
        }

        const remaining = await posOfflineDB.getPendingOfflineSales();
        setPendingOfflineCount(remaining.length);

        if (data.syncedCount > 0) {
          addNotification({
            type: 'ORDER',
            title: `Offline POS Sales Synced`,
            message: `Successfully synchronized ${data.syncedCount} offline sale transactions to the central database.`,
            priority: 'low',
            linkToModule: 'orders',
          });
        }

        return { syncedCount: data.syncedCount || 0, pendingCount: remaining.length };
      }
    } catch (err) {
      console.warn('Offline sales sync failed:', err);
    }
    const remaining = await posOfflineDB.getPendingOfflineSales().catch(() => []);
    setPendingOfflineCount(remaining.length);
    return { syncedCount: 0, pendingCount: remaining.length };
  };

  const posCheckout = async (saleData: {
    customerId: string;
    customerName?: string;
    customerPhone?: string;
    items: OrderItem[];
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
    paymentMethod: string;
    paidAmount: number;
    warehouseId?: string;
    notes?: string;
    couponCode?: string;
  }): Promise<{ success: boolean; order: Order; invoice: Invoice; isOffline?: boolean }> => {
    const warehouseId = saleData.warehouseId || warehouses[0]?.id || 'wh-main';
    const cashier = `Admin (${currentRole})`;
    const deviceId = posOfflineDB.getDeviceId();
    const localSaleId = `pos-local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const payload = {
      deviceId,
      localSaleId,
      customerId: saleData.customerId || 'cust-walkin',
      customerName: saleData.customerName,
      customerPhone: saleData.customerPhone,
      warehouseId,
      cashier,
      items: saleData.items,
      subtotal: saleData.subtotal,
      discount: saleData.discount,
      tax: saleData.tax,
      shipping: saleData.shipping,
      total: saleData.total,
      paymentMethod: saleData.paymentMethod,
      paidAmount: saleData.paidAmount,
      notes: saleData.notes,
      couponCode: saleData.couponCode,
    };

    // If online, attempt central server transaction first
    if (isOnline) {
      try {
        const resp = await fetch('/api/pos/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (resp.ok) {
          const resData = await resp.json();
          if (resData.success) {
            // Update local state with server results
            if (resData.updatedProducts) {
              setProducts((prev) =>
                prev.map((p) => {
                  const updated = resData.updatedProducts.find((u: any) => u.id === p.id);
                  return updated ? { ...p, stock: updated.stock } : p;
                })
              );
            }
            if (resData.order) {
              setOrders((prev) => [resData.order, ...prev]);
            }
            if (resData.invoice) {
              setInvoices((prev) => [resData.invoice, ...prev]);
            }
            if (resData.stockMovements) {
              setStockMovements((prev) => [...resData.stockMovements, ...prev]);
            }

            posOfflineDB.cacheProducts(products).catch(() => {});

            logAudit(
              `POS Retail Sale #${resData.order.orderNumber} Completed`,
              'orders',
              resData.order.id,
              'Draft',
              `Total: ${formatCurrency(resData.order.total)}`
            );

            return {
              success: true,
              order: resData.order,
              invoice: resData.invoice,
              isOffline: false,
            };
          }
        }
      } catch (networkErr) {
        console.warn('Network error during POS checkout, operating in offline fallback:', networkErr);
      }
    }

    // Offline Mode transaction
    const localOrderNumber = `AH-POS-OFF-${Math.floor(10000 + Math.random() * 90000)}`;
    const invoiceNumber = `INV-${localOrderNumber}`;

    const offlineOrder: Order = {
      id: `ord-${localSaleId}`,
      orderNumber: localOrderNumber,
      channel: 'POS',
      channelType: 'POS',
      customerId: saleData.customerId,
      customerName: saleData.customerName || 'Walk-in Customer',
      customerPhone: saleData.customerPhone || 'In-store',
      items: saleData.items,
      subtotal: saleData.subtotal,
      discount: saleData.discount,
      tax: saleData.tax,
      shipping: saleData.shipping,
      total: saleData.total,
      paidAmount: saleData.paidAmount,
      dueAmount: Math.max(0, saleData.total - saleData.paidAmount),
      paymentMethod: saleData.paymentMethod as any,
      paymentStatus: saleData.paidAmount >= saleData.total ? 'PAID' : 'PARTIAL',
      orderStatus: 'DELIVERED',
      deliveryStatus: 'DELIVERED',
      warehouseId,
      notes: saleData.notes || 'Offline POS Sale (Queued for Sync)',
      createdAt: new Date().toISOString(),
    };

    const offlineInvoice: Invoice = {
      id: `inv-${localSaleId}`,
      invoiceNumber,
      orderId: offlineOrder.id,
      orderNumber: offlineOrder.orderNumber,
      customerId: offlineOrder.customerId,
      customerName: offlineOrder.customerName,
      customerPhone: offlineOrder.customerPhone,
      items: offlineOrder.items,
      subtotal: offlineOrder.subtotal,
      discount: offlineOrder.discount,
      tax: offlineOrder.tax,
      shipping: offlineOrder.shipping,
      total: offlineOrder.total,
      paidAmount: offlineOrder.paidAmount,
      dueAmount: offlineOrder.dueAmount,
      paymentMethod: offlineOrder.paymentMethod,
      paymentStatus: saleData.paidAmount >= saleData.total ? 'PAID' : 'PARTIAL',
      status: saleData.paidAmount >= saleData.total ? 'PAID' : 'PARTIAL',
      date: new Date().toISOString().split('T')[0],
    };

    // Deduct stock locally so UI updates immediately
    setProducts((prev) =>
      prev.map((p) => {
        const item = saleData.items.find((it) => it.productId === p.id);
        if (item) {
          const newStock = Math.max(0, p.stock - item.quantity);
          return { ...p, stock: newStock };
        }
        return p;
      })
    );

    setOrders((prev) => [offlineOrder, ...prev]);
    setInvoices((prev) => [offlineInvoice, ...prev]);

    // Enqueue into IndexedDB
    const offlineRecord: OfflineSale = {
      localSaleId,
      deviceId,
      createdAt: offlineOrder.createdAt,
      cashier,
      customerId: saleData.customerId,
      customerName: offlineOrder.customerName,
      customerPhone: offlineOrder.customerPhone,
      items: saleData.items,
      subtotal: saleData.subtotal,
      discount: saleData.discount,
      tax: saleData.tax,
      shipping: saleData.shipping,
      total: saleData.total,
      paymentMethod: saleData.paymentMethod,
      paidAmount: saleData.paidAmount,
      dueAmount: offlineOrder.dueAmount,
      warehouseId,
      notes: saleData.notes,
      couponCode: saleData.couponCode,
      synced: false,
    };

    await posOfflineDB.enqueueOfflineSale(offlineRecord);
    setPendingOfflineCount((prev) => prev + 1);

    return {
      success: true,
      order: offlineOrder,
      invoice: offlineInvoice,
      isOffline: true,
    };
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineSales();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check for pending offline sales
    posOfflineDB.getPendingOfflineSales().then((pending) => {
      setPendingOfflineCount(pending.length);
      if (pending.length > 0 && navigator.onLine) {
        syncOfflineSales();
      }
    }).catch(() => {});

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateOrderStatus = (orderId: string, status: Order['orderStatus']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, orderStatus: status } : o))
    );
    logAudit(`Order Status Updated to ${status}`, 'orders', orderId);
  };

  const updateDeliveryStatus = (
    orderId: string,
    status: Order['deliveryStatus'],
    courier?: string,
    tracking?: string
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            deliveryStatus: status,
            courier: courier || o.courier,
            trackingNumber: tracking || o.trackingNumber,
            dispatchDate: status === 'DISPATCHED' ? new Date().toISOString().split('T')[0] : o.dispatchDate,
            deliveryDate: status === 'DELIVERED' ? new Date().toISOString().split('T')[0] : o.deliveryDate,
          };
        }
        return o;
      })
    );
    logAudit(`Delivery Status Updated: ${status}`, 'delivery', orderId);
  };

  // Purchases
  const addPurchase = (p: Omit<Purchase, 'id' | 'invoiceNumber'>) => {
    const invNum = `PO-${new Date().getFullYear()}-${String(purchases.length + 101).padStart(4, '0')}`;
    const newPur: Purchase = {
      ...p,
      id: `pur-${Date.now()}`,
      invoiceNumber: invNum,
    };
    setPurchases((prev) => [newPur, ...prev]);
    logAudit(`Created Purchase Order #${invNum}`, 'purchases', newPur.id);
  };

  const receivePurchase = (purchaseId: string) => {
    const target = purchases.find((p) => p.id === purchaseId);
    if (!target || target.status === 'RECEIVED') return;

    // Automatically update inventory for all items
    target.items.forEach((item) => {
      adjustStock(
        item.productId,
        target.warehouseId,
        item.quantity,
        'STOCK_IN',
        `Purchase Order #${target.invoiceNumber} received from ${target.supplierName}`
      );
    });

    // Update supplier ledger
    const supplier = suppliers.find((s) => s.id === target.supplierId);
    if (supplier) {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === supplier.id
            ? {
                ...s,
                totalPurchases: s.totalPurchases + target.total,
                paidAmount: s.paidAmount + target.paid,
                outstandingBalance: s.outstandingBalance + target.due,
              }
            : s
        )
      );

      const ledgerEntry: SupplierLedgerEntry = {
        id: `sl-${Date.now()}`,
        supplierId: supplier.id,
        date: new Date().toISOString().split('T')[0],
        type: 'PURCHASE',
        referenceNo: target.invoiceNumber,
        description: `Purchase order received (${target.items.length} items)`,
        debit: target.paid,
        credit: target.total,
        balance: supplier.outstandingBalance + target.due,
      };
      setSupplierLedger((prev) => [ledgerEntry, ...prev]);
    }

    setPurchases((prev) =>
      prev.map((p) => (p.id === purchaseId ? { ...p, status: 'RECEIVED' } : p))
    );
    logAudit(`Received Purchase Order #${target.invoiceNumber}`, 'purchases', purchaseId);
    addNotification({
      type: 'PURCHASE',
      title: `Stock Received from ${target.supplierName}`,
      message: `Purchase #${target.invoiceNumber} verified and stock added to ${target.warehouseName}.`,
      priority: 'medium',
      linkToModule: 'inventory',
    });
  };

  const addPurchasePayment = (purchaseId: string, amount: number, method: string, notes?: string) => {
    const po = purchases.find((p) => p.id === purchaseId);
    if (!po) return;

    const newPaid = (po.paid || 0) + amount;
    const newDue = Math.max(0, po.total - newPaid);
    const newPaymentStatus = newDue === 0 ? 'PAID' : 'PARTIAL';

    setPurchases((prev) =>
      prev.map((p) =>
        p.id === purchaseId
          ? {
              ...p,
              paid: newPaid,
              due: newDue,
              paymentStatus: newPaymentStatus,
            }
          : p
      )
    );

    addSupplierPayment(po.supplierId, amount, method, notes || `Payment for PO #${po.invoiceNumber}`);
    logAudit(`Disbursed Payment of ${formatCurrency(amount)} for PO #${po.invoiceNumber}`, 'purchases', purchaseId);
  };

  const addSupplierPayment = (supplierId: string, amount: number, method: string, notes?: string) => {
    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup) return;

    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === supplierId
          ? {
              ...s,
              paidAmount: s.paidAmount + amount,
              outstandingBalance: Math.max(0, s.outstandingBalance - amount),
            }
          : s
      )
    );

    const ledger: SupplierLedgerEntry = {
      id: `sl-${Date.now()}`,
      supplierId,
      date: new Date().toISOString().split('T')[0],
      type: 'PAYMENT',
      referenceNo: `PAY-SUP-${Date.now().toString().slice(-5)}`,
      description: notes || `Payment disbursed via ${method}`,
      debit: amount,
      credit: 0,
      balance: Math.max(0, sup.outstandingBalance - amount),
    };
    setSupplierLedger((prev) => [ledger, ...prev]);

    const payRec: PaymentRecord = {
      id: `pay-${Date.now()}`,
      supplierId,
      supplierName: sup.company || sup.name,
      type: 'OUTFLOW',
      amount,
      method,
      transactionRef: ledger.referenceNo,
      date: new Date().toISOString(),
      note: notes,
      status: 'COMPLETED',
    };
    setPaymentRecords((prev) => [payRec, ...prev]);
    logAudit(`Disbursed Supplier Payment of ${formatCurrency(amount)}`, 'suppliers', supplierId);
  };

  const addCustomerPayment = (customerId: string, amount: number, method: string, note?: string) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, outstandingBalance: Math.max(0, c.outstandingBalance - amount) }
          : c
      )
    );

    const ledger: CustomerLedgerEntry = {
      id: `cl-${Date.now()}`,
      customerId,
      date: new Date().toISOString().split('T')[0],
      type: 'PAYMENT',
      referenceNo: `PAY-REC-${Date.now().toString().slice(-5)}`,
      description: note || `Payment received via ${method}`,
      debit: 0,
      credit: amount,
      balance: Math.max(0, cust.outstandingBalance - amount),
    };
    setCustomerLedger((prev) => [ledger, ...prev]);

    const payRec: PaymentRecord = {
      id: `pay-${Date.now()}`,
      customerId,
      customerName: cust.name,
      type: 'INFLOW',
      amount,
      method,
      transactionRef: ledger.referenceNo,
      date: new Date().toISOString(),
      note,
      status: 'COMPLETED',
    };
    setPaymentRecords((prev) => [payRec, ...prev]);
    logAudit(`Customer Payment Received: ${formatCurrency(amount)}`, 'customers', customerId);
  };

  const addInvoicePayment = (invoiceId: string, amount: number, method: string, note?: string) => {
    const inv = invoices.find((i) => i.id === invoiceId || i.invoiceNumber === invoiceId);
    if (!inv) return;

    const paymentAmt = Math.min(amount, inv.due > 0 ? inv.due : amount);
    const newPaid = inv.paid + paymentAmt;
    const newDue = Math.max(0, inv.total - newPaid);
    const newStatus: Invoice['status'] = newDue <= 0 ? 'PAID' : 'PARTIAL';

    setInvoices((prev) =>
      prev.map((i) =>
        i.id === inv.id
          ? { ...i, paid: newPaid, due: newDue, status: newStatus }
          : i
      )
    );

    if (inv.customerId) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === inv.customerId
            ? { ...c, outstandingBalance: Math.max(0, c.outstandingBalance - paymentAmt) }
            : c
        )
      );

      const cust = customers.find((c) => c.id === inv.customerId);
      const ledger: CustomerLedgerEntry = {
        id: `cl-${Date.now()}`,
        customerId: inv.customerId,
        date: new Date().toISOString().split('T')[0],
        type: 'PAYMENT',
        referenceNo: inv.invoiceNumber,
        description: note || `Payment against invoice ${inv.invoiceNumber} via ${method}`,
        debit: 0,
        credit: paymentAmt,
        balance: cust ? Math.max(0, cust.outstandingBalance - paymentAmt) : 0,
      };
      setCustomerLedger((prev) => [ledger, ...prev]);
    }

    if (inv.orderId) {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === inv.orderId || o.orderNumber === inv.orderNumber) {
            const ordPaid = o.paidAmount + paymentAmt;
            return {
              ...o,
              paidAmount: ordPaid,
              paymentStatus: ordPaid >= o.total ? 'PAID' : 'PARTIAL',
            };
          }
          return o;
        })
      );
    }

    const payRec: PaymentRecord = {
      id: `pay-${Date.now()}`,
      customerId: inv.customerId,
      customerName: inv.customerName,
      type: 'INFLOW',
      amount: paymentAmt,
      method,
      transactionRef: inv.invoiceNumber,
      date: new Date().toISOString(),
      note: note || `Payment against invoice #${inv.invoiceNumber}`,
      status: 'COMPLETED',
    };
    setPaymentRecords((prev) => [payRec, ...prev]);
    logAudit(`Invoice Payment Logged: ${inv.invoiceNumber} (${formatCurrency(paymentAmt)})`, 'invoices', inv.id);
  };

  // Returns
  const processReturn = (returnData: Omit<OrderReturn, 'id' | 'returnNumber' | 'createdAt' | 'status'>) => {
    const returnNum = `AH-RET-${new Date().getFullYear()}-${String(returns.length + 1).padStart(3, '0')}`;
    const newRet: OrderReturn = {
      ...returnData,
      id: `ret-${Date.now()}`,
      returnNumber: returnNum,
      status: 'REQUESTED',
      createdAt: new Date().toISOString(),
    };
    setReturns((prev) => [newRet, ...prev]);
    logAudit(`Return Requested #${returnNum}`, 'returns', newRet.id);
  };

  const updateReturnStatus = (id: string, status: OrderReturn['status']) => {
    const target = returns.find((r) => r.id === id);
    if (!target) return;

    if (status === 'REFUNDED' && target.restockInventory) {
      adjustStock(target.productId, 'wh-main', target.quantity, 'RETURNED', `Restocked from return #${target.returnNumber}`);
    }

    setReturns((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    logAudit(`Return Status Updated: ${status}`, 'returns', id);
  };

  // Products CRUD
  const addProduct = (prodData: Omit<Product, 'id' | 'createdAt'>, warehouseId = 'wh-main') => {
    const prodId = `prod-${Date.now()}`;
    const openingStock = Number(prodData.stock || 0);

    const newProd: Product = {
      ...prodData,
      id: prodId,
      stock: openingStock,
      createdAt: new Date().toISOString().split('T')[0],
      status: prodData.status || 'active',
      images: prodData.images || (prodData.image ? [{
        id: `img-${Date.now()}`,
        productId: prodId,
        url: prodData.image,
        filename: 'primary.jpg',
        mimeType: 'image/jpeg',
        size: 0,
        sortOrder: 1,
        isPrimary: true,
        altText: prodData.name,
        createdAt: new Date().toISOString(),
      }] : []),
    };

    setProducts((prev) => [newProd, ...prev]);

    // Requirement 13: Opening stock creates real inventory transaction
    if (openingStock > 0) {
      setWarehouseInventory((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex((wi) => wi.productId === prodId && wi.warehouseId === warehouseId);
        if (idx >= 0) {
          copy[idx] = { ...copy[idx], physicalStock: copy[idx].physicalStock + openingStock };
        } else {
          copy.push({
            id: `wi-${Date.now()}`,
            warehouseId,
            productId: prodId,
            physicalStock: openingStock,
            reservedStock: 0,
            damagedStock: 0,
          });
        }
        return copy;
      });

      const movement: StockMovement = {
        id: `sm-${Date.now()}`,
        productId: prodId,
        productName: newProd.name,
        warehouseId,
        type: 'OPENING_STOCK',
        quantity: openingStock,
        previousStock: 0,
        newStock: openingStock,
        reason: `Opening Stock for ${newProd.name}`,
        performedBy: `Admin (${currentRole})`,
        timestamp: new Date().toISOString(),
      };
      setStockMovements((prev) => [movement, ...prev]);
    }

    logAudit(`Product Created: ${newProd.name} (Opening Stock: ${openingStock})`, 'products', newProd.id);

    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newProd, openingStock, warehouseId }),
    }).catch((err) => console.warn('Backend product persist error:', err));
  };

  const updateProduct = (id: string, pData: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...pData } : p))
    );
    logAudit(`Product Updated: ${id}`, 'products', id);

    fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pData),
    }).catch((err) => console.warn('Backend product update error:', err));
  };

  const deleteProduct = (id: string) => {
    // Requirement 32: Soft delete / archive if product has transactions
    const hasOrders = orders.some((o) => o.items.some((it) => it.productId === id));
    const hasInvoices = invoices.some((inv) => inv.items.some((it) => it.productId === id));
    const hasMovements = stockMovements.some((sm) => sm.productId === id);

    if (hasOrders || hasInvoices || hasMovements) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'ARCHIVED' } : p))
      );
      logAudit(`Product Archived (historical records preserved): ${id}`, 'products', id);
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      logAudit(`Product Deleted: ${id}`, 'products', id);
    }

    fetch(`/api/products/${id}`, { method: 'DELETE' }).catch((err) =>
      console.warn('Backend delete product error:', err)
    );
  };

  // Categories CRUD
  const addCategory = (cData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...cData,
      id: `cat-${Date.now()}`,
    };
    setCategories((prev) => [...prev, newCat]);
    logAudit(`Category Created: ${newCat.name}`, 'categories', newCat.id);
  };

  const updateCategory = (id: string, cData: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...cData } : c))
    );
    logAudit(`Category Updated: ${id}`, 'categories', id);
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id && c.parentId !== id));
    logAudit(`Category Deleted: ${id}`, 'categories', id);
  };

  // Brands CRUD
  const addBrand = (bData: Omit<Brand, 'id' | 'createdAt'>) => {
    const newB: Brand = {
      ...bData,
      id: `brand-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBrands((prev) => [...prev, newB]);
    logAudit(`Brand Created: ${newB.name}`, 'brands', newB.id);
  };

  const updateBrand = (id: string, bData: Partial<Brand>) => {
    setBrands((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...bData } : b))
    );
    logAudit(`Brand Updated: ${id}`, 'brands', id);
  };

  const deleteBrand = (id: string) => {
    setBrands((prev) => prev.filter((b) => b.id !== id));
    logAudit(`Brand Deleted: ${id}`, 'brands', id);
  };

  // Warehouses CRUD
  const addWarehouse = (whData: Omit<Warehouse, 'id'>) => {
    const newW: Warehouse = {
      ...whData,
      id: `wh-${Date.now()}`,
    };
    setWarehouses((prev) => [...prev, newW]);
    logAudit(`Warehouse Added: ${newW.name}`, 'warehouses', newW.id);
  };

  const updateWarehouse = (id: string, whData: Partial<Warehouse>) => {
    setWarehouses((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...whData } : w))
    );
    logAudit(`Warehouse Updated: ${id}`, 'warehouses', id);
  };

  const deleteWarehouse = (id: string) => {
    setWarehouses((prev) => prev.filter((w) => w.id !== id));
    logAudit(`Warehouse Deleted: ${id}`, 'warehouses', id);
  };

  // Suppliers CRUD
  const addSupplier = (sData: Omit<Supplier, 'id' | 'totalPurchases' | 'paidAmount' | 'outstandingBalance'>) => {
    const newS: Supplier = {
      ...sData,
      id: `sup-${Date.now()}`,
      totalPurchases: 0,
      paidAmount: 0,
      outstandingBalance: sData.openingBalance || 0,
    };
    setSuppliers((prev) => [...prev, newS]);
    logAudit(`Supplier Added: ${newS.name}`, 'suppliers', newS.id);
  };

  const updateSupplier = (id: string, sData: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...sData } : s))
    );
    logAudit(`Supplier Updated: ${id}`, 'suppliers', id);
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    logAudit(`Supplier Deleted: ${id}`, 'suppliers', id);
  };

  // Customers CRUD
  const addCustomer = (cData: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'outstandingBalance'>) => {
    const newC: Customer = {
      ...cData,
      id: `cust-${Date.now()}`,
      totalOrders: 0,
      totalSpent: 0,
      outstandingBalance: 0,
    };
    setCustomers((prev) => [...prev, newC]);
    logAudit(`Customer Added: ${newC.name}`, 'customers', newC.id);
  };

  const updateCustomer = (id: string, cData: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...cData } : c))
    );
    logAudit(`Customer Updated: ${id}`, 'customers', id);
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    logAudit(`Customer Deleted: ${id}`, 'customers', id);
  };

  // Payment Methods CRUD
  const addPaymentMethod = (pmData: Omit<PaymentMethodConfig, 'id'>) => {
    const newPm: PaymentMethodConfig = {
      ...pmData,
      id: `pm-${Date.now()}`,
    };
    setPaymentMethods((prev) => [...prev, newPm]);
    logAudit(`Payment Method Added: ${newPm.name}`, 'payments', newPm.id);
  };

  const updatePaymentMethod = (id: string, pmData: Partial<PaymentMethodConfig>) => {
    setPaymentMethods((prev) =>
      prev.map((pm) => (pm.id === id ? { ...pm, ...pmData } : pm))
    );
    logAudit(`Payment Method Updated: ${id}`, 'payments', id);
  };

  const deletePaymentMethod = (id: string) => {
    setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
    logAudit(`Payment Method Deleted: ${id}`, 'payments', id);
  };

  // Expenses CRUD
  const addExpense = (expData: Omit<Expense, 'id' | 'createdAt' | 'status'>) => {
    const newE: Expense = {
      ...expData,
      id: `exp-${Date.now()}`,
      status: 'APPROVED',
      approvedBy: `Admin (${currentRole})`,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newE, ...prev]);
    logAudit(`Expense Logged: ${newE.title} (${formatCurrency(newE.amount)})`, 'expenses', newE.id);
  };

  const updateExpenseStatus = (id: string, status: Expense['status']) => {
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, status, approvedBy: status === 'APPROVED' ? `Admin (${currentRole})` : undefined }
          : e
      )
    );
    logAudit(`Expense Status: ${status}`, 'expenses', id);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    logAudit(`Expense Deleted: ${id}`, 'expenses', id);
  };

  // Coupons CRUD
  const addCoupon = (cpData: Omit<Coupon, 'id' | 'usageCount'>) => {
    const newCp: Coupon = {
      ...cpData,
      id: `cp-${Date.now()}`,
      code: cpData.code.toUpperCase(),
      usageCount: 0,
    };
    setCoupons((prev) => [...prev, newCp]);
    logAudit(`Coupon Created: ${newCp.code}`, 'coupons', newCp.id);
  };

  const updateCoupon = (id: string, cpData: Partial<Coupon>) => {
    setCoupons((prev) =>
      prev.map((cp) => (cp.id === id ? { ...cp, ...cpData } : cp))
    );
    logAudit(`Coupon Updated: ${id}`, 'coupons', id);
  };

  const deleteCoupon = (id: string) => {
    setCoupons((prev) => prev.filter((cp) => cp.id !== id));
    logAudit(`Coupon Deleted: ${id}`, 'coupons', id);
  };

  // Employees CRUD
  const addEmployee = (eData: Omit<Employee, 'id'>) => {
    const newE: Employee = {
      ...eData,
      id: `emp-${Date.now()}`,
    };
    setEmployees((prev) => [...prev, newE]);
    logAudit(`Employee Added: ${newE.name}`, 'employees', newE.id);
  };

  const updateEmployee = (id: string, eData: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...eData } : e))
    );
    logAudit(`Employee Updated: ${id}`, 'employees', id);
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    logAudit(`Employee Deleted: ${id}`, 'employees', id);
  };

  // Media
  const addMediaAsset = (asset: Omit<MediaAsset, 'id' | 'uploadedAt'>) => {
    const newA: MediaAsset = {
      ...asset,
      id: `med-${Date.now()}`,
      uploadedAt: new Date().toISOString().split('T')[0],
    };
    setMediaAssets((prev) => [newA, ...prev]);
    logAudit(`Media Uploaded: ${newA.name}`, 'media', newA.id);
  };

  const deleteMediaAsset = (id: string) => {
    setMediaAssets((prev) => prev.filter((m) => m.id !== id));
    logAudit(`Media Deleted: ${id}`, 'media', id);
  };

  // Settings
  const updateBrandSettings = (newSettings: Partial<BrandSettings>) => {
    setBrandSettings((prev) => ({ ...prev, ...newSettings }));
    logAudit('Brand Settings Updated', 'settings', 'brand-settings');
  };

  const updateGeneralSettings = (newSettings: Partial<GeneralSettings>) => {
    setGeneralSettings((prev) => ({ ...prev, ...newSettings }));
    logAudit('General Settings Updated', 'settings', 'general-settings');
  };

  const updateWebsiteCMS = (cms: Partial<WebsiteCMS>) => {
    setWebsiteCMS((prev) => ({ ...prev, ...cms }));
    logAudit('Website CMS Updated', 'website', 'website-cms');
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Backup & Restore
  const createBackupJSON = (): string => {
    const fullBackup = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      brandSettings,
      generalSettings,
      brands,
      categories,
      products,
      warehouses,
      warehouseInventory,
      stockMovements,
      suppliers,
      supplierLedger,
      customers,
      customerLedger,
      orders,
      invoices,
      paymentMethods,
      paymentRecords,
      expenses,
      coupons,
      returns,
      employees,
      auditLogs,
      websiteCMS,
      mediaAssets,
    };
    return JSON.stringify(fullBackup, null, 2);
  };

  const restoreFromBackupJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.brandSettings) setBrandSettings(data.brandSettings);
      if (data.generalSettings) setGeneralSettings(data.generalSettings);
      if (data.products) setProducts(data.products);
      if (data.categories) setCategories(data.categories);
      if (data.brands) setBrands(data.brands);
      if (data.warehouses) setWarehouses(data.warehouses);
      if (data.warehouseInventory) setWarehouseInventory(data.warehouseInventory);
      if (data.orders) setOrders(data.orders);
      if (data.invoices) setInvoices(data.invoices);
      if (data.customers) setCustomers(data.customers);
      if (data.suppliers) setSuppliers(data.suppliers);
      if (data.expenses) setExpenses(data.expenses);
      if (data.coupons) setCoupons(data.coupons);
      if (data.employees) setEmployees(data.employees);
      if (data.websiteCMS) setWebsiteCMS(data.websiteCMS);
      logAudit('System Database Restored from Backup', 'backup', 'restore-op');
      return true;
    } catch {
      return false;
    }
  };

  const resetToFactoryDefaults = () => {
    localStorage.clear();
    setBrandSettings(initialBrandSettings);
    setGeneralSettings(initialGeneralSettings);
    setBrands(initialBrands);
    setCategories(initialCategories);
    setProducts(initialProducts);
    setWarehouses(initialWarehouses);
    setWarehouseInventory(initialWarehouseInventory);
    setStockMovements(initialStockMovements);
    setSuppliers(initialSuppliers);
    setSupplierLedger(initialSupplierLedger);
    setCustomers(initialCustomers);
    setCustomerLedger(initialCustomerLedger);
    setOrders(initialOrders);
    setPurchases(initialPurchases);
    setInvoices(initialInvoices);
    setPaymentMethods(initialPaymentMethods);
    setPaymentRecords(initialPaymentRecords);
    setExpenses(initialExpenses);
    setCoupons(initialCoupons);
    setReturns(initialReturns);
    setEmployees(initialEmployees);
    setAuditLogs(initialAuditLogs);
    setNotifications(initialNotifications);
    setWebsiteCMS(initialWebsiteCMS);
    setMediaAssets(initialMediaAssets);
  };

  // ==========================================================================
  // MULTI-CHANNEL COMMERCE OPERATIONS
  // ==========================================================================
  const updateSalesChannel = (id: string, updates: Partial<SalesChannel>) => {
    setSalesChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, ...updates, updatedAt: new Date().toISOString() } : ch))
    );
    logAudit(`Sales Channel Updated: ${id}`, 'sales_channels', id);
  };

  const toggleChannelEnabled = (id: string) => {
    setSalesChannels((prev) =>
      prev.map((ch) => {
        if (ch.id === id) {
          const nextState = !ch.isEnabled;
          return {
            ...ch,
            isEnabled: nextState,
            status: nextState ? 'CONNECTED' : 'DISCONNECTED',
            updatedAt: new Date().toISOString(),
          };
        }
        return ch;
      })
    );
    logAudit(`Toggled Sales Channel ${id}`, 'sales_channels', id);
  };

  const testChannelConnection = async (id: string): Promise<{ isHealthy: boolean; latencyMs: number; details: string }> => {
    const channel = salesChannels.find((c) => c.id === id);
    if (!channel) {
      return { isHealthy: false, latencyMs: 0, details: 'Channel not found' };
    }

    const connector = ConnectorFactory.getConnector(channel);
    const res = await connector.testConnection();

    if (res.data) {
      setChannelHealth((prev) =>
        prev.map((h) =>
          h.channelId === id
            ? {
                ...h,
                isConnected: res.data!.isHealthy,
                authStatus: res.data!.isHealthy ? 'HEALTHY' : 'DEGRADED',
                responseTimeMs: res.data!.latencyMs,
                lastHeartbeat: new Date().toISOString(),
                errorSnippet: res.data!.isHealthy ? undefined : res.data!.details,
              }
            : h
        )
      );
    }

    const log: SyncLog = {
      id: `log-test-${Date.now()}`,
      channelId: channel.id,
      platform: channel.platform,
      entity: 'ORDER',
      operation: 'RECONCILIATION',
      status: res.success && res.data?.isHealthy ? 'SUCCESS' : 'WARNING',
      message: res.data?.details || 'Connection test performed',
      durationMs: res.data?.latencyMs || 50,
      timestamp: new Date().toISOString(),
    };
    setSyncLogs((prev) => [log, ...prev]);

    return res.data || { isHealthy: false, latencyMs: 0, details: res.error || 'Connection error' };
  };

  const triggerChannelSync = async (
    id: string,
    entityType: 'ALL' | 'PRODUCTS' | 'ORDERS' | 'INVENTORY' | 'SETTLEMENTS'
  ) => {
    const channel = salesChannels.find((c) => c.id === id);
    if (!channel) return;

    const connector = ConnectorFactory.getConnector(channel);

    setSalesChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'SYNCING' } : c))
    );

    try {
      if (entityType === 'ALL' || entityType === 'PRODUCTS') {
        const pRes = await connector.syncProducts();
        if (pRes.data?.logs) {
          setSyncLogs((prev) => [...pRes.data!.logs, ...prev]);
        }
      }

      if (entityType === 'ALL' || entityType === 'ORDERS') {
        const oRes = await connector.syncOrders();
        if (oRes.data?.logs) {
          setSyncLogs((prev) => [...oRes.data!.logs, ...prev]);
        }
      }

      if (entityType === 'ALL' || entityType === 'INVENTORY') {
        const iRes = await connector.syncInventory(products);
        if (iRes.data?.logs) {
          setSyncLogs((prev) => [...iRes.data!.logs, ...prev]);
        }
      }

      if (entityType === 'ALL' || entityType === 'SETTLEMENTS') {
        if (connector.fetchSettlements) {
          const sRes = await connector.fetchSettlements();
          if (sRes.data && sRes.data.length > 0) {
            setSettlements((prev) => {
              const existingIds = new Set(prev.map((s) => s.id));
              const newItems = sRes.data!.filter((s) => !existingIds.has(s.id));
              return [...newItems, ...prev];
            });
          }
        }
      }

      setSalesChannels((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status: 'CONNECTED',
                lastSyncTime: new Date().toISOString(),
                errorCount: 0,
              }
            : c
        )
      );

      addNotification({
        type: 'CHANNEL',
        title: `${channel.name} Synchronized`,
        message: `Successfully completed ${entityType.toLowerCase()} sync cycle.`,
        priority: 'low',
        linkToModule: 'sales_channels',
      });
    } catch (err: unknown) {
      setSalesChannels((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status: 'ERROR',
                errorCount: c.errorCount + 1,
                lastErrorMessage: err instanceof Error ? err.message : 'Sync failed',
              }
            : c
        )
      );
    }
  };

  const addChannelProductMapping = (m: Omit<ChannelProductMapping, 'id'>) => {
    const newMap: ChannelProductMapping = {
      ...m,
      id: `map-${Date.now()}`,
    };
    setChannelMappings((prev) => [newMap, ...prev]);
    logAudit(`Added Channel SKU Mapping for ${m.erpSku}`, 'sales_channels', newMap.id);
  };

  const updateChannelProductMapping = (id: string, updates: Partial<ChannelProductMapping>) => {
    setChannelMappings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
    logAudit(`Updated Channel SKU Mapping: ${id}`, 'sales_channels', id);
  };

  const deleteChannelProductMapping = (id: string) => {
    setChannelMappings((prev) => prev.filter((m) => m.id !== id));
    logAudit(`Deleted Channel SKU Mapping: ${id}`, 'sales_channels', id);
  };

  const addSettlement = (s: Omit<MarketplaceSettlement, 'id' | 'createdAt'>) => {
    const newS: MarketplaceSettlement = {
      ...s,
      id: `set-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSettlements((prev) => [newS, ...prev]);
    logAudit(`Added Marketplace Settlement ${newS.statementNumber}`, 'settlements', newS.id);
  };

  const reconcileSettlement = (id: string, bankReference: string) => {
    setSettlements((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'RECONCILED',
              bankReference,
              payoutDate: new Date().toISOString().split('T')[0],
            }
          : s
      )
    );
    logAudit(`Reconciled Marketplace Settlement ${id}`, 'settlements', id);
    addNotification({
      type: 'PAYMENT',
      title: 'Settlement Reconciled',
      message: `Marketplace statement #${id} reconciled with Bank Ref: ${bankReference}`,
      priority: 'medium',
      linkToModule: 'settlements',
    });
  };

  const simulateWebhookEvent = async (
    channelId: string,
    eventType: string,
    payload: Record<string, unknown>
  ) => {
    const channel = salesChannels.find((c) => c.id === channelId);
    if (!channel) return;

    const newEvt: WebhookEvent = {
      id: `wh-evt-${Date.now()}`,
      channelId,
      platform: channel.platform,
      eventType,
      externalEventId: `evt_${Math.random().toString(36).substring(2, 9)}`,
      idempotencyKey: `idemp_${Date.now()}`,
      payload,
      status: 'PROCESSED',
      attempts: 1,
      receivedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
    };

    setWebhookEvents((prev) => [newEvt, ...prev]);

    const log: SyncLog = {
      id: `log-wh-${Date.now()}`,
      channelId,
      platform: channel.platform,
      entity: 'WEBHOOK',
      operation: 'WEBHOOK',
      status: 'SUCCESS',
      message: `Received and processed webhook: ${eventType} from ${channel.name}`,
      details: JSON.stringify(payload),
      durationMs: 42,
      timestamp: new Date().toISOString(),
    };
    setSyncLogs((prev) => [log, ...prev]);

    addNotification({
      type: 'CHANNEL',
      title: `Webhook: ${eventType}`,
      message: `Successfully processed event from ${channel.name}`,
      priority: 'low',
      linkToModule: 'webhooks',
    });
  };

  const clearSyncLogs = () => {
    setSyncLogs([]);
  };

  const updateChannelFeeConfig = (id: string, updates: Partial<MarketplaceFeeConfig>) => {
    setFeeConfigs((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const broadcastInventoryUpdate = async (productId?: string) => {
    const prodsToSync = productId ? products.filter((p) => p.id === productId) : products;
    await ConnectorFactory.broadcastInventory(salesChannels, prodsToSync);

    const log: SyncLog = {
      id: `log-bcast-${Date.now()}`,
      channelId: 'all',
      platform: 'MANUAL',
      entity: 'INVENTORY',
      operation: 'EXPORT',
      status: 'SUCCESS',
      message: `Broadcast inventory quantities across connected channels for ${prodsToSync.length} items`,
      durationMs: 85,
      timestamp: new Date().toISOString(),
    };
    setSyncLogs((prev) => [log, ...prev]);
  };

  const financialStats = useMemo<FinancialStats>(() => {
    const totalRevenue = (orders || []).reduce((sum, o) => sum + (o.total || 0), 0);
    let totalCOGS = 0;
    (orders || []).forEach((o) => {
      (o.items || []).forEach((item) => {
        const costPerUnit = (item as any).purchasePrice ?? ((item as any).price ? (item as any).price * 0.65 : ((item as any).unitPrice ? (item as any).unitPrice * 0.65 : 0));
        totalCOGS += costPerUnit * (item.quantity || 1);
      });
    });
    if (totalCOGS === 0 && totalRevenue > 0) {
      totalCOGS = totalRevenue * 0.62;
    }
    const totalExpenses = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    const grossProfit = Math.max(0, totalRevenue - totalCOGS);
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netProfit = grossProfit - totalExpenses;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCOGS,
      totalExpenses,
      grossProfit,
      grossMargin,
      netProfit,
      netMargin,
    };
  }, [orders, expenses]);

  return (
    <ERPContext.Provider
      value={{
        brandSettings,
        generalSettings,
        brands,
        activeBrandId,
        categories,
        products,
        warehouses,
        warehouseInventory,
        stockMovements,
        suppliers,
        supplierLedger,
        purchases,
        customers,
        customerLedger,
        orders,
        invoices,
        paymentMethods,
        paymentRecords,
        expenses,
        coupons,
        returns,
        employees,
        rolePermissions,
        currentRole,
        currentUserRole: currentRole,
        activeModule,
        setActiveModule,
        auditLogs,
        notifications,
        websiteCMS,
        mediaAssets,
        salesChannels,
        channelMappings,
        syncLogs,
        webhookEvents,
        settlements,
        feeConfigs,
        reservations,
        channelHealth,
        language,
        setLanguage,
        t,
        isDarkMode,
        toggleDarkMode,
        formatCurrency,
        financialStats,
        setCurrentRole,
        hasPermission,
        setActiveBrandId,
        updateBrandSettings,
        updateGeneralSettings,
        addBrand,
        updateBrand,
        deleteBrand,
        addCategory,
        updateCategory,
        deleteCategory,
        addProduct,
        updateProduct,
        deleteProduct,
        addWarehouse,
        updateWarehouse,
        deleteWarehouse,
        getAvailableStock,
        adjustStock,
        transferStock,
        addPurchase,
        receivePurchase,
        addPurchasePayment,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addSupplierPayment,
        createOrder,
        posCheckout,
        syncOfflineSales,
        pendingOfflineCount,
        isOnline,
        updateOrderStatus,
        updateDeliveryStatus,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addCustomerPayment,
        addInvoicePayment,
        addPaymentMethod,
        updatePaymentMethod,
        deletePaymentMethod,
        addExpense,
        updateExpenseStatus,
        deleteExpense,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        processReturn,
        updateReturnStatus,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        updateWebsiteCMS,
        addMediaAsset,
        deleteMediaAsset,
        markNotificationAsRead,
        clearAllNotifications,
        addNotification,
        logAudit,
        updateSalesChannel,
        toggleChannelEnabled,
        testChannelConnection,
        triggerChannelSync,
        addChannelProductMapping,
        updateChannelProductMapping,
        deleteChannelProductMapping,
        addSettlement,
        reconcileSettlement,
        simulateWebhookEvent,
        clearSyncLogs,
        updateChannelFeeConfig,
        broadcastInventoryUpdate,
        createBackupJSON,
        restoreFromBackupJSON,
        resetToFactoryDefaults,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
