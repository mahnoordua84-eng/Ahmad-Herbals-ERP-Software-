import { SalesChannel, ChannelPlatform, Product } from '../types/erp';
import { BaseConnector } from './core/BaseConnector';
import { DarazConnector } from './daraz/DarazConnector';
import { WooCommerceConnector } from './woocommerce/WooCommerceConnector';
import { ShopifyConnector } from './shopify/ShopifyConnector';
import { CustomWebsiteConnector } from './custom/CustomWebsiteConnector';
import { IChannelConnector, ConnectorResponse, SyncResult } from './core/types';

export * from './core/types';
export * from './core/BaseConnector';
export * from './daraz/DarazConnector';
export * from './woocommerce/WooCommerceConnector';
export * from './shopify/ShopifyConnector';
export * from './custom/CustomWebsiteConnector';

export class ConnectorFactory {
  private static instances: Map<string, BaseConnector> = new Map();

  public static getConnector(channel: SalesChannel): BaseConnector {
    if (this.instances.has(channel.id)) {
      const existing = this.instances.get(channel.id)!;
      existing.channel = channel;
      return existing;
    }

    let connector: BaseConnector;
    switch (channel.platform) {
      case 'DARAZ':
        connector = new DarazConnector(channel);
        break;
      case 'WOOCOMMERCE':
        connector = new WooCommerceConnector(channel);
        break;
      case 'SHOPIFY':
        connector = new ShopifyConnector(channel);
        break;
      case 'WEBSITE':
      default:
        connector = new CustomWebsiteConnector(channel);
        break;
    }

    this.instances.set(channel.id, connector);
    return connector;
  }

  // Automatic multi-channel inventory distribution
  public static async broadcastInventory(
    channels: SalesChannel[],
    products: Product[]
  ): Promise<Record<string, ConnectorResponse<SyncResult>>> {
    const results: Record<string, ConnectorResponse<SyncResult>> = {};

    for (const channel of channels) {
      if (channel.isEnabled && channel.status === 'CONNECTED' && channel.autoSyncInventory) {
        const conn = this.getConnector(channel);
        try {
          const res = await conn.syncInventory(products);
          results[channel.id] = res;
        } catch (err: unknown) {
          results[channel.id] = {
            success: false,
            error: err instanceof Error ? err.message : 'Broadcast failed',
          };
        }
      }
    }

    return results;
  }
}
