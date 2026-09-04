export type Language = 'en' | 'ur';

export interface Translations {
  [key: string]: {
    en: string;
    ur: string;
  };
}

export const translations: Translations = {
  // Navigation & Modules
  dashboard: { en: 'Dashboard', ur: 'ڈیش بورڈ' },
  sales: { en: 'Sales & Orders', ur: 'سیلز اور آرڈرز' },
  orders: { en: 'Orders Management', ur: 'آرڈرز کا انتظام' },
  pos: { en: 'POS Terminal', ur: 'پی او ایس کاؤنٹر' },
  products: { en: 'Products', ur: 'مصنوعات' },
  categories: { en: 'Categories', ur: 'کیٹیگریز' },
  brands: { en: 'Brands', ur: 'برانڈز' },
  inventory: { en: 'Inventory & Stock', ur: 'انوینٹری اور سٹاک' },
  warehouses: { en: 'Warehouses', ur: 'گودام / ویئرہاؤسز' },
  purchases: { en: 'Purchases', ur: 'خریداری' },
  suppliers: { en: 'Suppliers', ur: 'سپلائرز' },
  customers: { en: 'Customers', ur: 'کسٹمرز' },
  invoices: { en: 'Invoices', ur: 'انوائسز' },
  payments: { en: 'Payments', ur: 'ادائیگیاں' },
  expenses: { en: 'Expenses', ur: 'اخراجات' },
  accounting: { en: 'Finance & P&L', ur: 'فنانس اور نفع و نقصان' },
  reports: { en: 'Reports & Analytics', ur: 'رپورٹس اور تجزیات' },
  employees: { en: 'Employees & HR', ur: 'ملازمین اور ایچ آر' },
  roles: { en: 'Roles & Permissions', ur: 'کردار اور اجازتیں' },
  audit: { en: 'Audit Logs', ur: 'آڈٹ لاگز' },
  notifications: { en: 'Notifications', ur: 'اطلاعات' },
  website: { en: 'Website CMS', ur: 'ویب سائٹ کنٹرول' },
  media: { en: 'Media Library', ur: 'میڈیا لائبریری' },
  coupons: { en: 'Coupons & Discounts', ur: 'کوپنز اور رعایت' },
  returns: { en: 'Returns & Refunds', ur: 'واپسی اور ریفنڈ' },
  delivery: { en: 'Delivery & Shipping', ur: 'ڈلیوری اور لاجسٹکس' },
  backup: { en: 'Backup & Restore', ur: 'بیک اپ اور بحالی' },
  settings: { en: 'Settings', ur: 'ترتیبات' },
  
  // Dashboard & Metrics
  businessOverview: { en: 'Business Overview', ur: 'کاروباری جائزہ' },
  totalSales: { en: 'Total Sales', ur: 'کل فروخت' },
  todaySales: { en: "Today's Sales", ur: 'آج کی فروخت' },
  monthlySales: { en: 'Monthly Sales', ur: 'ماہانہ فروخت' },
  totalOrders: { en: 'Total Orders', ur: 'کل آرڈرز' },
  pendingOrders: { en: 'Pending Orders', ur: 'زیر التواء آرڈرز' },
  completedOrders: { en: 'Completed Orders', ur: 'مکمل شدہ آرڈرز' },
  cancelledOrders: { en: 'Cancelled Orders', ur: 'منسوخ شدہ آرڈرز' },
  totalCustomers: { en: 'Total Customers', ur: 'کل کسٹمرز' },
  totalProducts: { en: 'Total Products', ur: 'کل مصنوعات' },
  lowStockProducts: { en: 'Low Stock Items', ur: 'کم سٹاک مصنوعات' },
  outOfStockProducts: { en: 'Out of Stock', ur: 'ختم شدہ سٹاک' },
  totalExpenses: { en: 'Total Expenses', ur: 'کل اخراجات' },
  grossProfit: { en: 'Gross Profit', ur: 'خام منافع' },
  netProfit: { en: 'Net Profit', ur: 'خالص منافع' },
  
  // Time filters
  today: { en: 'Today', ur: 'آج' },
  yesterday: { en: 'Yesterday', ur: 'کل' },
  last7Days: { en: 'Last 7 Days', ur: 'پچھلے 7 دن' },
  last30Days: { en: 'Last 30 Days', ur: 'پچھلے 30 دن' },
  thisMonth: { en: 'This Month', ur: 'یہ مہینہ' },
  lastMonth: { en: 'Last Month', ur: 'پچھلا مہینہ' },
  thisYear: { en: 'This Year', ur: 'یہ سال' },
  customRange: { en: 'Custom Date Range', ur: 'اپنی مرضی کی تاریخ' },
  
  // Common Actions
  search: { en: 'Search...', ur: 'تلاش کریں...' },
  filter: { en: 'Filter', ur: 'فلٹر' },
  exportCsv: { en: 'Export CSV', ur: 'ایکسپورٹ سی ایس وی' },
  print: { en: 'Print', ur: 'پرنٹ کریں' },
  add: { en: 'Add New', ur: 'نیا شامل کریں' },
  save: { en: 'Save Changes', ur: 'محفوظ کریں' },
  cancel: { en: 'Cancel', ur: 'منسوخ' },
  delete: { en: 'Delete', ur: 'حذف کریں' },
  edit: { en: 'Edit', ur: 'ترمیم کریں' },
  actions: { en: 'Actions', ur: 'اقدامات' },
  status: { en: 'Status', ur: 'حیثیت' },
  view: { en: 'View', ur: 'دیکھیں' },
  download: { en: 'Download', ur: 'ڈاؤن لوڈ' },
  shareWhatsapp: { en: 'Share WhatsApp', ur: 'واٹس ایپ پر بھیجیں' },
  
  // Brand & Slogan
  taglineDefault: { en: 'Pure • Natural • Premium • Trusted', ur: 'خالص • قدرتی • معیاری • قابلِ اعتماد' },
  herbsAndGrains: { en: 'Herbs & Grains', ur: 'جڑی بوٹیاں اور اناج' },
};

export const getTranslation = (key: string, lang: Language): string => {
  if (translations[key] && translations[key][lang]) {
    return translations[key][lang];
  }
  return key;
};
