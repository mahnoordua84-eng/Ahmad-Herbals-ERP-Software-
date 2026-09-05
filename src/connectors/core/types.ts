import {
  SalesChannel,
  ChannelProductMapping,
  Order,
  Product,
  Customer,
  MarketplaceSettlement,
  SyncLog,
  ChannelPlatform,
} from '../../types/erp';

export interface ChannelCredentials {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  webhookSecret?: string;
  sellerId?: string;
  shopUrl?: string;
  apiUrl?: string;
  appKey?: string;
  appSecret?: string;
}

export interface ConnectorResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  durationMs?: number;
  raw?: unknown;
}

export interface SyncResult {
  entity: 'PRODUCTS' | 'ORDERS' | 'INVENTORY' | 'CUSTOMERS' | 'SETTLEMENTS';
  totalFound: number;
  created: number;
  updated: number;
  failed: number;
  logs: SyncLog[];
}

export interface StockUpdatePayload {
  sku: string;
  externalProductId?: string;
  externalVariantId?: string;
  availableStock: number;
  physicalStock?: number;
}

export interface IChannelConnector {
  channel: SalesChannel;
  platform: ChannelPlatform;

  // Lifecycle
  connect(credentials: ChannelCredentials): Promise<ConnectorResponse<boolean>>;
  disconnect(): Promise<ConnectorResponse<boolean>>;
  testConnection(): Promise<ConnectorResponse<{ isHealthy: boolean; latencyMs: number; details: string }>>;

  // Data Sync
  syncProducts(): Promise<ConnectorResponse<SyncResult>>;
  syncOrders(since?: string): Promise<ConnectorResponse<SyncResult>>;
  syncCustomers(): Promise<ConnectorResponse<SyncResult>>;
  syncInventory(products: Product[]): Promise<ConnectorResponse<SyncResult>>;

  // Real-Time Operations
  updateProduct(product: Product, mapping?: ChannelProductMapping): Promise<ConnectorResponse<boolean>>;
  updateInventory(stockUpdates: StockUpdatePayload[]): Promise<ConnectorResponse<boolean>>;
  updateOrderStatus(externalOrderId: string, status: string, trackingNumber?: string, courier?: string): Promise<ConnectorResponse<boolean>>;

  // Finance & Reversals
  fetchReturns?(): Promise<ConnectorResponse<unknown[]>>;
  fetchPayments?(): Promise<ConnectorResponse<unknown[]>>;
  fetchSettlements?(startDate?: string, endDate?: string): Promise<ConnectorResponse<MarketplaceSettlement[]>>;

  // Webhook Signature Validation
  verifyWebhookSignature(headers: Record<string, string | string[] | undefined>, rawBody: string): boolean;
}
