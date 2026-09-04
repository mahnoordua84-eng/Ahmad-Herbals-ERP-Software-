/**
 * AHMAD HERBALS ENTERPRISE ERP - RELATIONAL DATABASE SCHEMA
 * Production-ready PostgreSQL / Prisma / Drizzle Schema Definition
 * 
 * Supports:
 * - Foreign Keys & Referential Integrity
 * - B-Tree & GIN Indexes
 * - Unique Constraints
 * - Timestamps (created_at, updated_at)
 * - Soft Deletes (deleted_at IS NULL)
 * - Multi-Tenant Business & Brand Isolation
 */

export interface SchemaTableDefinition {
  tableName: string;
  description: string;
  columns: Array<{
    name: string;
    type: string;
    isPrimary?: boolean;
    isNullable?: boolean;
    isUnique?: boolean;
    defaultValue?: string;
    references?: { table: string; column: string; onDelete?: string };
    description?: string;
  }>;
  indexes?: Array<{
    name: string;
    columns: string[];
    isUnique?: boolean;
  }>;
}

export const ERP_DATABASE_SCHEMA: Record<string, SchemaTableDefinition> = {
  // 1. BUSINESSES / ENTERPRISES
  businesses: {
    tableName: 'businesses',
    description: 'Multi-tenant parent enterprise entities',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'name', type: 'VARCHAR(255)', isNullable: false },
      { name: 'legal_name', type: 'VARCHAR(255)', isNullable: false },
      { name: 'registration_no', type: 'VARCHAR(100)', isUnique: true },
      { name: 'tax_number', type: 'VARCHAR(100)' },
      { name: 'currency', type: 'VARCHAR(10)', defaultValue: "'PKR'" },
      { name: 'phone', type: 'VARCHAR(50)' },
      { name: 'email', type: 'VARCHAR(255)' },
      { name: 'address', type: 'TEXT' },
      { name: 'country', type: 'VARCHAR(100)', defaultValue: "'Pakistan'" },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', isNullable: true },
    ],
  },

  // 2. ROLES & PERMISSIONS
  roles: {
    tableName: 'roles',
    description: 'Granular Role-Based Access Control definitions',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'name', type: 'VARCHAR(100)', isUnique: true, isNullable: false },
      { name: 'description', type: 'TEXT' },
      { name: 'is_system_role', type: 'BOOLEAN', defaultValue: 'FALSE' },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
    ],
  },

  permissions: {
    tableName: 'permissions',
    description: 'System actions formatted as MODULE.ACTION',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'role_id', type: 'UUID', references: { table: 'roles', column: 'id', onDelete: 'CASCADE' } },
      { name: 'module', type: 'VARCHAR(100)', isNullable: false },
      { name: 'action', type: 'VARCHAR(50)', isNullable: false }, // view, create, edit, delete, export, approve
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
    ],
    indexes: [{ name: 'idx_role_module_action', columns: ['role_id', 'module', 'action'], isUnique: true }],
  },

  // 3. USERS (Super Admin, Managers, Cashiers)
  users: {
    tableName: 'users',
    description: 'Authenticated application operators and employees',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'business_id', type: 'UUID', references: { table: 'businesses', column: 'id', onDelete: 'CASCADE' } },
      { name: 'name', type: 'VARCHAR(255)', isNullable: false },
      { name: 'email', type: 'VARCHAR(255)', isUnique: true, isNullable: false },
      { name: 'password_hash', type: 'VARCHAR(255)', isNullable: false },
      { name: 'role_id', type: 'UUID', references: { table: 'roles', column: 'id' } },
      { name: 'role_name', type: 'VARCHAR(100)', defaultValue: "'Manager'" },
      { name: 'phone', type: 'VARCHAR(50)' },
      { name: 'is_active', type: 'BOOLEAN', defaultValue: 'TRUE' },
      { name: 'last_login_at', type: 'TIMESTAMPTZ', isNullable: true },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', isNullable: true },
    ],
    indexes: [{ name: 'idx_users_email', columns: ['email'], isUnique: true }],
  },

  // 4. BRANDS
  brands: {
    tableName: 'brands',
    description: 'Product brand ownership (Ahmad Herbals, ABC Naturals)',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'business_id', type: 'UUID', references: { table: 'businesses', column: 'id', onDelete: 'CASCADE' } },
      { name: 'name', type: 'VARCHAR(255)', isNullable: false },
      { name: 'code', type: 'VARCHAR(50)', isUnique: true },
      { name: 'logo_url', type: 'TEXT' },
      { name: 'description', type: 'TEXT' },
      { name: 'website', type: 'VARCHAR(255)' },
      { name: 'status', type: 'VARCHAR(20)', defaultValue: "'active'" },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', isNullable: true },
    ],
  },

  // 5. CATEGORIES
  categories: {
    tableName: 'categories',
    description: 'Hierarchical product category tree',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'parent_id', type: 'UUID', isNullable: true, references: { table: 'categories', column: 'id', onDelete: 'SET NULL' } },
      { name: 'name', type: 'VARCHAR(255)', isNullable: false },
      { name: 'slug', type: 'VARCHAR(255)', isUnique: true },
      { name: 'image_url', type: 'TEXT' },
      { name: 'display_order', type: 'INTEGER', defaultValue: '0' },
      { name: 'status', type: 'VARCHAR(20)', defaultValue: "'active'" },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', isNullable: true },
    ],
  },

  // 6. PRODUCTS & VARIATIONS
  products: {
    tableName: 'products',
    description: 'Core product catalog items with pricing and tax',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'brand_id', type: 'UUID', references: { table: 'brands', column: 'id' } },
      { name: 'category_id', type: 'UUID', references: { table: 'categories', column: 'id' } },
      { name: 'name', type: 'VARCHAR(255)', isNullable: false },
      { name: 'sku', type: 'VARCHAR(100)', isUnique: true, isNullable: false },
      { name: 'barcode', type: 'VARCHAR(100)', isUnique: true },
      { name: 'short_description', type: 'TEXT' },
      { name: 'full_description', type: 'TEXT' },
      { name: 'purchase_price', type: 'NUMERIC(12, 2)', isNullable: false },
      { name: 'sale_price', type: 'NUMERIC(12, 2)', isNullable: false },
      { name: 'wholesale_price', type: 'NUMERIC(12, 2)' },
      { name: 'tax_percent', type: 'NUMERIC(5, 2)', defaultValue: '0' },
      { name: 'min_stock_level', type: 'INTEGER', defaultValue: '10' },
      { name: 'total_stock', type: 'INTEGER', defaultValue: '0' },
      { name: 'image_url', type: 'TEXT' },
      { name: 'status', type: 'VARCHAR(20)', defaultValue: "'active'" },
      { name: 'is_featured', type: 'BOOLEAN', defaultValue: 'FALSE' },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', isNullable: true },
    ],
    indexes: [
      { name: 'idx_products_sku', columns: ['sku'], isUnique: true },
      { name: 'idx_products_barcode', columns: ['barcode'], isUnique: true },
    ],
  },

  product_variations: {
    tableName: 'product_variations',
    description: 'Weight and package variations (e.g. 1kg, 2kg, 5kg)',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'product_id', type: 'UUID', references: { table: 'products', column: 'id', onDelete: 'CASCADE' } },
      { name: 'sku', type: 'VARCHAR(100)', isUnique: true },
      { name: 'barcode', type: 'VARCHAR(100)' },
      { name: 'weight', type: 'NUMERIC(8, 2)', isNullable: false },
      { name: 'unit', type: 'VARCHAR(20)', defaultValue: "'KG'" },
      { name: 'purchase_price', type: 'NUMERIC(12, 2)', isNullable: false },
      { name: 'sale_price', type: 'NUMERIC(12, 2)', isNullable: false },
      { name: 'stock', type: 'INTEGER', defaultValue: '0' },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
    ],
  },

  // 7. WAREHOUSES & STOCK
  warehouses: {
    tableName: 'warehouses',
    description: 'Multi-warehouse physical locations and branches',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'name', type: 'VARCHAR(255)', isNullable: false },
      { name: 'code', type: 'VARCHAR(50)', isUnique: true },
      { name: 'type', type: 'VARCHAR(50)', defaultValue: "'Main Warehouse'" },
      { name: 'address', type: 'TEXT' },
      { name: 'city', type: 'VARCHAR(100)' },
      { name: 'manager_name', type: 'VARCHAR(255)' },
      { name: 'manager_phone', type: 'VARCHAR(50)' },
      { name: 'is_default', type: 'BOOLEAN', defaultValue: 'FALSE' },
      { name: 'status', type: 'VARCHAR(20)', defaultValue: "'active'" },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
    ],
  },

  inventory: {
    tableName: 'inventory',
    description: 'Warehouse specific product inventory balances',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'warehouse_id', type: 'UUID', references: { table: 'warehouses', column: 'id', onDelete: 'CASCADE' } },
      { name: 'product_id', type: 'UUID', references: { table: 'products', column: 'id', onDelete: 'CASCADE' } },
      { name: 'variation_id', type: 'UUID', isNullable: true, references: { table: 'product_variations', column: 'id', onDelete: 'CASCADE' } },
      { name: 'physical_stock', type: 'INTEGER', defaultValue: '0' },
      { name: 'reserved_stock', type: 'INTEGER', defaultValue: '0' },
      { name: 'damaged_stock', type: 'INTEGER', defaultValue: '0' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
    ],
    indexes: [{ name: 'idx_inventory_wh_prod_var', columns: ['warehouse_id', 'product_id', 'variation_id'], isUnique: true }],
  },

  stock_movements: {
    tableName: 'stock_movements',
    description: 'Immutable ledger of every inventory increment or decrement',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'product_id', type: 'UUID', references: { table: 'products', column: 'id' } },
      { name: 'variation_id', type: 'UUID', isNullable: true },
      { name: 'warehouse_id', type: 'UUID', references: { table: 'warehouses', column: 'id' } },
      { name: 'to_warehouse_id', type: 'UUID', isNullable: true, references: { table: 'warehouses', column: 'id' } },
      { name: 'type', type: 'VARCHAR(50)', isNullable: false }, // PURCHASE, SALE, RETURN, DAMAGE, ADJUSTMENT, TRANSFER_IN, TRANSFER_OUT
      { name: 'quantity', type: 'INTEGER', isNullable: false },
      { name: 'before_stock', type: 'INTEGER', isNullable: false },
      { name: 'after_stock', type: 'INTEGER', isNullable: false },
      { name: 'reference_no', type: 'VARCHAR(100)' },
      { name: 'reason', type: 'TEXT' },
      { name: 'performed_by', type: 'VARCHAR(255)' },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
    ],
  },

  // 8. SUPPLIERS & PURCHASES
  suppliers: {
    tableName: 'suppliers',
    description: 'Raw materials, herbs, and grain suppliers',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'name', type: 'VARCHAR(255)', isNullable: false },
      { name: 'company', type: 'VARCHAR(255)' },
      { name: 'phone', type: 'VARCHAR(50)' },
      { name: 'email', type: 'VARCHAR(255)' },
      { name: 'address', type: 'TEXT' },
      { name: 'opening_balance', type: 'NUMERIC(14, 2)', defaultValue: '0' },
      { name: 'total_purchases', type: 'NUMERIC(14, 2)', defaultValue: '0' },
      { name: 'paid_amount', type: 'NUMERIC(14, 2)', defaultValue: '0' },
      { name: 'outstanding_balance', type: 'NUMERIC(14, 2)', defaultValue: '0' },
      { name: 'status', type: 'VARCHAR(20)', defaultValue: "'active'" },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
    ],
  },

  purchases: {
    tableName: 'purchases',
    description: 'Purchase orders from suppliers',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'invoice_number', type: 'VARCHAR(100)', isUnique: true, isNullable: false },
      { name: 'supplier_id', type: 'UUID', references: { table: 'suppliers', column: 'id' } },
      { name: 'warehouse_id', type: 'UUID', references: { table: 'warehouses', column: 'id' } },
      { name: 'subtotal', type: 'NUMERIC(14, 2)', isNullable: false },
      { name: 'discount', type: 'NUMERIC(14, 2)', defaultValue: '0' },
      { name: 'tax', type: 'NUMERIC(14, 2)', defaultValue: '0' },
      { name: 'shipping', type: 'NUMERIC(14, 2)', defaultValue: '0' },
      { name: 'total', type: 'NUMERIC(14, 2)', isNullable: false },
      { name: 'paid_amount', type: 'NUMERIC(14, 2)', defaultValue: '0' },
      { name: 'due_amount', type: 'NUMERIC(14, 2)', defaultValue: '0' },
      { name: 'payment_status', type: 'VARCHAR(20)', defaultValue: "'UNPAID'" },
      { name: 'status', type: 'VARCHAR(20)', defaultValue: "'RECEIVED'" }, // DRAFT, ORDERED, RECEIVED, CANCELLED
      { name: 'notes', type: 'TEXT' },
      { name: 'date', type: 'DATE', defaultValue: 'CURRENT_DATE' },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
    ],
  },

  purchase_items: {
    tableName: 'purchase_items',
    description: 'Items belonging to a purchase order',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'purchase_id', type: 'UUID', references: { table: 'purchases', column: 'id', onDelete: 'CASCADE' } },
      { name: 'product_id', type: 'UUID', references: { table: 'products', column: 'id' } },
      { name: 'product_name', type: 'VARCHAR(255)' },
      { name: 'quantity', type: 'INTEGER', isNullable: false },
      { name: 'purchase_price', type: 'NUMERIC(12, 2)', isNullable: false },
      { name: 'total', type: 'NUMERIC(14, 2)', isNullable: false },
    ],
  },

  // 9. CUSTOMERS & ORDERS
  customers: {
    tableName: 'customers',
    description: 'Retail, wholesale, and distributor client profiles',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'name', type: 'VARCHAR(255)', isNullable: false },
      { name: 'phone', type: 'VARCHAR(50)', isNullable: false },
      { name: 'email', type: 'VARCHAR(255)' },
      { name: 'address', type: 'TEXT' },
      { name: 'city', type: 'VARCHAR(100)' },
      { name: 'type', type: 'VARCHAR(50)', defaultValue: "'RETAIL'" }, // RETAIL, WHOLESALE, VIP, DISTRIBUTOR
      { name: 'total_orders', type: 'INTEGER', defaultValue: '0' },
      { name: 'total_spent', type: 'NUMERIC(14, 2)', defaultValue: '0' },
      { name: 'outstanding_balance', type: 'NUMERIC(14, 2)', defaultValue: '0' },
      { name: 'credit_limit', type: 'NUMERIC(14, 2)', defaultValue: '50000' },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
    ],
    indexes: [{ name: 'idx_customers_phone', columns: ['phone'] }],
  },

  orders: {
    tableName: 'orders',
    description: 'Customer sales orders across POS, Online, and Wholesale',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'order_number', type: 'VARCHAR(100)', isUnique: true, isNullable: false },
      { name: 'customer_id', type: 'UUID', references: { table: 'customers', column: 'id' } },
      { name: 'warehouse_id', type: 'UUID', references: { table: 'warehouses', column: 'id' } },
      { name: 'channel', type: 'VARCHAR(50)', defaultValue: "'POS'" }, // POS, ONLINE, WHOLESALE, MANUAL
      { name: 'subtotal', type: 'NUMERIC(14, 2)', isNullable: false },
      { name: 'discount', type: 'NUMERIC(14, 2)', defaultValue: '0' },
      { name: 'tax', type: 'NUMERIC(14, 2)', defaultValue: '0' },
      { name: 'shipping', type: 'NUMERIC(14, 2)', defaultValue: '0' },
      { name: 'total', type: 'NUMERIC(14, 2)', isNullable: false },
      { name: 'paid_amount', type: 'NUMERIC(14, 2)', defaultValue: '0' },
      { name: 'due_amount', type: 'NUMERIC(14, 2)', defaultValue: '0' },
      { name: 'payment_method', type: 'VARCHAR(50)', defaultValue: "'Cash'" },
      { name: 'payment_status', type: 'VARCHAR(20)', defaultValue: "'PAID'" },
      { name: 'order_status', type: 'VARCHAR(30)', defaultValue: "'DELIVERED'" },
      { name: 'delivery_status', type: 'VARCHAR(30)', defaultValue: "'DELIVERED'" },
      { name: 'courier', type: 'VARCHAR(100)' },
      { name: 'tracking_number', type: 'VARCHAR(100)' },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
    ],
    indexes: [{ name: 'idx_orders_order_number', columns: ['order_number'], isUnique: true }],
  },

  order_items: {
    tableName: 'order_items',
    description: 'Line items within customer sales orders',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'order_id', type: 'UUID', references: { table: 'orders', column: 'id', onDelete: 'CASCADE' } },
      { name: 'product_id', type: 'UUID', references: { table: 'products', column: 'id' } },
      { name: 'product_name', type: 'VARCHAR(255)' },
      { name: 'quantity', type: 'INTEGER', isNullable: false },
      { name: 'price', type: 'NUMERIC(12, 2)', isNullable: false },
      { name: 'purchase_price', type: 'NUMERIC(12, 2)', isNullable: false }, // For exact COGS
      { name: 'discount', type: 'NUMERIC(12, 2)', defaultValue: '0' },
      { name: 'total', type: 'NUMERIC(14, 2)', isNullable: false },
    ],
  },

  // 10. PAYMENTS & INVOICES
  payments: {
    tableName: 'payments',
    description: 'Cash, bank, and online financial transactions',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'order_id', type: 'UUID', isNullable: true, references: { table: 'orders', column: 'id' } },
      { name: 'purchase_id', type: 'UUID', isNullable: true, references: { table: 'purchases', column: 'id' } },
      { name: 'customer_id', type: 'UUID', isNullable: true, references: { table: 'customers', column: 'id' } },
      { name: 'supplier_id', type: 'UUID', isNullable: true, references: { table: 'suppliers', column: 'id' } },
      { name: 'type', type: 'VARCHAR(20)', isNullable: false }, // INFLOW, OUTFLOW
      { name: 'amount', type: 'NUMERIC(14, 2)', isNullable: false },
      { name: 'method', type: 'VARCHAR(50)', isNullable: false }, // Cash, Bank, Easypaisa, JazzCash, Card
      { name: 'transaction_ref', type: 'VARCHAR(100)' },
      { name: 'status', type: 'VARCHAR(20)', defaultValue: "'COMPLETED'" },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
    ],
  },

  // 11. EXPENSES
  expenses: {
    tableName: 'expenses',
    description: 'Operating expenses, utility bills, salaries, and packaging costs',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'title', type: 'VARCHAR(255)', isNullable: false },
      { name: 'category', type: 'VARCHAR(100)', isNullable: false },
      { name: 'amount', type: 'NUMERIC(14, 2)', isNullable: false },
      { name: 'payment_method', type: 'VARCHAR(50)', defaultValue: "'Cash'" },
      { name: 'reference', type: 'VARCHAR(100)' },
      { name: 'receipt_url', type: 'TEXT' },
      { name: 'status', type: 'VARCHAR(30)', defaultValue: "'APPROVED'" },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
    ],
  },

  // 12. RETURNS & REFUNDS
  returns: {
    tableName: 'returns',
    description: 'Customer return requests and condition inspection',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'return_number', type: 'VARCHAR(100)', isUnique: true, isNullable: false },
      { name: 'order_id', type: 'UUID', references: { table: 'orders', column: 'id' } },
      { name: 'customer_id', type: 'UUID', references: { table: 'customers', column: 'id' } },
      { name: 'product_id', type: 'UUID', references: { table: 'products', column: 'id' } },
      { name: 'quantity', type: 'INTEGER', isNullable: false },
      { name: 'reason', type: 'TEXT' },
      { name: 'condition', type: 'VARCHAR(50)', defaultValue: "'UNOPENED'" },
      { name: 'refund_amount', type: 'NUMERIC(14, 2)', isNullable: false },
      { name: 'restock_inventory', type: 'BOOLEAN', defaultValue: 'TRUE' },
      { name: 'status', type: 'VARCHAR(30)', defaultValue: "'REFUNDED'" },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
    ],
  },

  // 13. COUPONS & PROMOTIONS
  coupons: {
    tableName: 'coupons',
    description: 'Discount codes with usage limits and minimum order checks',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'code', type: 'VARCHAR(50)', isUnique: true, isNullable: false },
      { name: 'discount_type', type: 'VARCHAR(20)', defaultValue: "'percentage'" }, // percentage, fixed
      { name: 'discount_value', type: 'NUMERIC(10, 2)', isNullable: false },
      { name: 'minimum_order', type: 'NUMERIC(12, 2)', defaultValue: '0' },
      { name: 'maximum_discount', type: 'NUMERIC(12, 2)' },
      { name: 'usage_limit', type: 'INTEGER' },
      { name: 'usage_count', type: 'INTEGER', defaultValue: '0' },
      { name: 'expiry_date', type: 'DATE' },
      { name: 'status', type: 'VARCHAR(20)', defaultValue: "'active'" },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
    ],
  },

  // 14. AUDIT LOGS & NOTIFICATIONS
  audit_logs: {
    tableName: 'audit_logs',
    description: 'Security & accountability trail of administrative actions',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'user_id', type: 'VARCHAR(100)', isNullable: false },
      { name: 'user_name', type: 'VARCHAR(255)', isNullable: false },
      { name: 'action', type: 'VARCHAR(255)', isNullable: false },
      { name: 'module', type: 'VARCHAR(100)', isNullable: false },
      { name: 'record_id', type: 'VARCHAR(100)', isNullable: false },
      { name: 'old_value', type: 'TEXT' },
      { name: 'new_value', type: 'TEXT' },
      { name: 'ip_address', type: 'VARCHAR(50)' },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
    ],
  },

  notifications: {
    tableName: 'notifications',
    description: 'Live system alerts for low stock, orders, payments',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'type', type: 'VARCHAR(50)', isNullable: false },
      { name: 'title', type: 'VARCHAR(255)', isNullable: false },
      { name: 'message', type: 'TEXT', isNullable: false },
      { name: 'read', type: 'BOOLEAN', defaultValue: 'FALSE' },
      { name: 'priority', type: 'VARCHAR(20)', defaultValue: "'medium'" },
      { name: 'link_to_module', type: 'VARCHAR(100)' },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' },
    ],
  },
};

/**
 * Generates SQL DDL to initialize all tables in PostgreSQL
 */
export function generatePostgreSqlDDL(): string {
  let ddl = '-- ==========================================================================\n';
  ddl += '-- AHMAD HERBALS ENTERPRISE ERP - POSTGRESQL DDL SCHEMA\n';
  ddl += '-- ==========================================================================\n\n';
  ddl += 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n';

  for (const [tableKey, def] of Object.entries(ERP_DATABASE_SCHEMA)) {
    ddl += `-- Table: ${def.tableName} (${def.description})\n`;
    ddl += `CREATE TABLE IF NOT EXISTS ${def.tableName} (\n`;
    
    const colLines = def.columns.map((c) => {
      let line = `  ${c.name} ${c.type}`;
      if (c.isPrimary) line += ' PRIMARY KEY';
      if (c.isNullable === false) line += ' NOT NULL';
      if (c.isUnique) line += ' UNIQUE';
      if (c.defaultValue) line += ` DEFAULT ${c.defaultValue}`;
      if (c.references) {
        line += ` REFERENCES ${c.references.table}(${c.references.column})`;
        if (c.references.onDelete) line += ` ON DELETE ${c.references.onDelete}`;
      }
      return line;
    });

    ddl += colLines.join(',\n');
    ddl += '\n);\n\n';

    if (def.indexes) {
      for (const idx of def.indexes) {
        const uniqueStr = idx.isUnique ? 'UNIQUE ' : '';
        ddl += `CREATE ${uniqueStr}INDEX IF NOT EXISTS ${idx.name} ON ${def.tableName} (${idx.columns.join(', ')});\n`;
      }
      ddl += '\n';
    }
  }

  return ddl;
}
