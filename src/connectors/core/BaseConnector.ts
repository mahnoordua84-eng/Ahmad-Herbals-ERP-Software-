import {
  SalesChannel,
  ChannelProductMapping,
  Product,
  MarketplaceSettlement,
  SyncLog,
  ChannelPlatform,
} from '../../types/erp';
import {
  IChannelConnector,
  ChannelCredentials,
  ConnectorResponse,
  SyncResult,
  StockUpdatePayload,
} from './types';

export abstract class BaseConnector implements IChannelConnector {
  public channel: SalesChannel;
  public platform: ChannelPlatform;

  constructor(channel: SalesChannel) {
    this.channel = channel;
    this.platform = channel.platform;
  }

  abstract connect(credentials: ChannelCredentials): Promise<ConnectorResponse<boolean>>;
  abstract disconnect(): Promise<ConnectorResponse<boolean>>;
  abstract testConnection(): Promise<ConnectorResponse<{ isHealthy: boolean; latencyMs: number; details: string }>>;

  abstract syncProducts(): Promise<ConnectorResponse<SyncResult>>;
  abstract syncOrders(since?: string): Promise<ConnectorResponse<SyncResult>>;
  abstract syncCustomers(): Promise<ConnectorResponse<SyncResult>>;
  abstract syncInventory(products: Product[]): Promise<ConnectorResponse<SyncResult>>;

  abstract updateProduct(product: Product, mapping?: ChannelProductMapping): Promise<ConnectorResponse<boolean>>;
  abstract updateInventory(stockUpdates: StockUpdatePayload[]): Promise<ConnectorResponse<boolean>>;
  abstract updateOrderStatus(externalOrderId: string, status: string, trackingNumber?: string, courier?: string): Promise<ConnectorResponse<boolean>>;

  abstract verifyWebhookSignature(headers: Record<string, string | string[] | undefined>, rawBody: string): boolean;

  fetchReturns?(): Promise<ConnectorResponse<unknown[]>> {
    return Promise.resolve({
      success: true,
      data: [],
    });
  }

  fetchPayments?(): Promise<ConnectorResponse<unknown[]>> {
    return Promise.resolve({
      success: true,
      data: [],
    });
  }

  fetchSettlements?(startDate?: string, endDate?: string): Promise<ConnectorResponse<MarketplaceSettlement[]>> {
    return Promise.resolve({
      success: true,
      data: [],
    });
  }

  protected createSyncLog(
    entity: 'ORDER' | 'PRODUCT' | 'INVENTORY' | 'CUSTOMER' | 'SETTLEMENT' | 'WEBHOOK',
    operation: 'IMPORT' | 'EXPORT' | 'UPDATE' | 'DELETE' | 'WEBHOOK' | 'RECONCILIATION',
    status: 'SUCCESS' | 'WARNING' | 'FAILED',
    message: string,
    details?: string,
    entityId?: string,
    externalId?: string
  ): SyncLog {
    return {
      id: `synclog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      channelId: this.channel.id,
      platform: this.platform,
      entity,
      entityId,
      externalId,
      operation,
      status,
      message,
      details,
      timestamp: new Date().toISOString(),
    };
  }

  protected calculateNetProfit(
    saleAmount: number,
    cogs: number,
    shippingPaid: number,
    commissionRate: number = 0,
    paymentFeeRate: number = 0,
    fixedFee: number = 0,
    packagingCost: number = 40
  ): { commission: number; channelFee: number; netProfit: number } {
    const commission = Math.round(saleAmount * (commissionRate / 100));
    const paymentFee = Math.round(saleAmount * (paymentFeeRate / 100));
    const channelFee = commission + paymentFee + fixedFee;
    const netProfit = Math.round(saleAmount - cogs - channelFee - shippingPaid - packagingCost);
    return { commission, channelFee, netProfit };
  }
}
