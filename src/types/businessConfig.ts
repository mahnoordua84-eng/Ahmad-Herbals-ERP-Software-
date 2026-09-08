export type BusinessTypeId =
  | 'auto_parts'
  | 'grocery'
  | 'clothing'
  | 'boutique'
  | 'shoes'
  | 'hardware'
  | 'medical_store'
  | 'cosmetics'
  | 'electronics'
  | 'mobile_accessories'
  | 'bakery'
  | 'restaurant'
  | 'supermarket'
  | 'wholesale'
  | 'retail'
  | 'distributor'
  | 'manufacturing'
  | 'services'
  | 'general'
  | 'custom';

export interface BusinessTypeOption {
  id: BusinessTypeId;
  name: string;
  badge: string;
  category: string;
  description: string;
  iconName: string;
  recommendedCategoriesCount: number;
  recommendedAttributesCount: number;
}

export interface BusinessProfile {
  businessName: string;
  legalBusinessName: string;
  brandName: string;
  logo: string;
  favicon: string;
  businessType: BusinessTypeId;
  businessDescription: string;
  tagline: string;
  ownerName: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  city: string;
  area: string;
  province: string;
  country: string;
  postalCode: string;
  ntn: string;
  strn: string;
  taxNumber: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  invoicePrefix: string;
  orderPrefix: string;
  customerPrefix: string;
  supplierPrefix: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  manager: string;
  warehouseId?: string;
  status: 'active' | 'archived';
  openingDate: string;
  invoicePrefix?: string;
  isDefault?: boolean;
  notes?: string;
  assignedEmployees?: string[];
}

export interface UnitOfMeasure {
  id: string;
  name: string;
  code: string; // e.g. kg, liter, piece
  symbol: string; // e.g. KG, L, PCS
  isDefault?: boolean;
  status: 'active' | 'archived';
  description?: string;
}

export type AttributeInputType =
  | 'text'
  | 'number'
  | 'dropdown'
  | 'multiselect'
  | 'color'
  | 'size'
  | 'date'
  | 'boolean'
  | 'image'
  | 'measurement';

export interface ProductAttribute {
  id: string;
  name: string;
  code: string; // vehicle_model, size, color, oem_number
  type: AttributeInputType;
  values: string[]; // Options or common presets
  target: 'business_type' | 'category' | 'product';
  businessTypeId?: string;
  categoryId?: string;
  isRequired?: boolean;
  showInPOS?: boolean;
  showInInvoice?: boolean;
  status: 'active' | 'archived';
}

export type CustomFieldEntityType = 'product' | 'customer' | 'order' | 'supplier';

export interface CustomField {
  id: string;
  name: string;
  key: string;
  entity: CustomFieldEntityType;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'boolean';
  options?: string[];
  businessTypeId?: string;
  isRequired?: boolean;
  defaultValue?: string;
  status: 'active' | 'archived';
}

export interface BusinessTemplateCategory {
  name: string;
  slug: string;
  subcategories?: string[];
  icon?: string;
  description?: string;
}

export interface BusinessTemplate {
  id: string;
  type: BusinessTypeId;
  name: string;
  description: string;
  iconName: string;
  badge: string;
  recommendedCategories: BusinessTemplateCategory[];
  recommendedAttributes: Array<{
    name: string;
    code: string;
    type: AttributeInputType;
    values: string[];
    showInPOS?: boolean;
    showInInvoice?: boolean;
  }>;
  recommendedUnits: Array<{
    name: string;
    code: string;
    symbol: string;
  }>;
  recommendedBrands?: string[];
  recommendedProductFields: string[];
  posDisplayFields: string[];
  inventoryRules?: {
    batchTracking?: boolean;
    expiryTracking?: boolean;
    serialTracking?: boolean;
    variantSupport?: boolean;
  };
  sampleProducts?: Array<{
    name: string;
    category: string;
    sku: string;
    salePrice: number;
    purchasePrice: number;
    attributes: Record<string, any>;
  }>;
  isCustom?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLogDetail {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'ADD' | 'EDIT' | 'ARCHIVE' | 'RESTORE' | 'DELETE' | 'SWITCH_TEMPLATE' | 'IMPORT' | 'EXPORT';
  module: string;
  recordId: string;
  recordName?: string;
  oldValue?: any;
  newValue?: any;
  ip?: string;
}
