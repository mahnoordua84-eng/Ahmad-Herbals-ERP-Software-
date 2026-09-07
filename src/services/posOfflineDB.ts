import { Product, Customer, OfflineSale } from '../types/erp';

const DB_NAME = 'AhmadHerbalsPOS_DB';
const DB_VERSION = 1;

export interface HeldSaleRecord {
  id: string;
  holdNumber: string;
  timestamp: string;
  customerId: string;
  customerName: string;
  items: any[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
}

class POSOfflineDB {
  private db: IDBDatabase | null = null;
  private deviceId: string;

  constructor() {
    // Generate or retrieve persistent device ID
    let devId = localStorage.getItem('ahmad_pos_device_id');
    if (!devId) {
      devId = `POS-TERM-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      localStorage.setItem('ahmad_pos_device_id', devId);
    }
    this.deviceId = devId;
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('IndexedDB is not supported in this environment');
        return reject(new Error('IndexedDB not supported'));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB open error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Products Store
        if (!db.objectStoreNames.contains('products')) {
          const prodStore = db.createObjectStore('products', { keyPath: 'id' });
          prodStore.createIndex('barcode', 'barcode', { unique: false });
          prodStore.createIndex('sku', 'sku', { unique: false });
          prodStore.createIndex('categoryId', 'categoryId', { unique: false });
        }

        // Customers Store
        if (!db.objectStoreNames.contains('customers')) {
          db.createObjectStore('customers', { keyPath: 'id' });
        }

        // Offline Sales Queue Store
        if (!db.objectStoreNames.contains('offlineSalesQueue')) {
          const queueStore = db.createObjectStore('offlineSalesQueue', { keyPath: 'localSaleId' });
          queueStore.createIndex('synced', 'synced', { unique: false });
          queueStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Held Orders Store
        if (!db.objectStoreNames.contains('heldOrders')) {
          db.createObjectStore('heldOrders', { keyPath: 'id' });
        }
      };
    });
  }

  // 1. Products Caching
  public async cacheProducts(products: Product[]): Promise<void> {
    try {
      const db = await this.init();
      const tx = db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      store.clear();
      for (const p of products) {
        store.put(p);
      }
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('Failed to cache products to IndexedDB:', err);
    }
  }

  public async getCachedProducts(): Promise<Product[]> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('products', 'readonly');
        const store = tx.objectStore('products');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('Failed to read products from IndexedDB:', err);
      return [];
    }
  }

  // 2. Customers Caching
  public async cacheCustomers(customers: Customer[]): Promise<void> {
    try {
      const db = await this.init();
      const tx = db.transaction('customers', 'readwrite');
      const store = tx.objectStore('customers');
      store.clear();
      for (const c of customers) {
        store.put(c);
      }
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('Failed to cache customers to IndexedDB:', err);
    }
  }

  public async getCachedCustomers(): Promise<Customer[]> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('customers', 'readonly');
        const store = tx.objectStore('customers');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('Failed to read customers from IndexedDB:', err);
      return [];
    }
  }

  // 3. Offline Sales Queue
  public async enqueueOfflineSale(sale: OfflineSale): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('offlineSalesQueue', 'readwrite');
      const store = tx.objectStore('offlineSalesQueue');
      const request = store.put(sale);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async getPendingOfflineSales(): Promise<OfflineSale[]> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('offlineSalesQueue', 'readonly');
        const store = tx.objectStore('offlineSalesQueue');
        const request = store.getAll();
        request.onsuccess = () => {
          const allSales: OfflineSale[] = request.result || [];
          resolve(allSales.filter((s) => !s.synced));
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('Failed to get pending offline sales:', err);
      return [];
    }
  }

  public async markOfflineSaleSynced(
    localSaleId: string,
    serverOrderId: string,
    serverInvoiceNumber: string
  ): Promise<void> {
    try {
      const db = await this.init();
      const tx = db.transaction('offlineSalesQueue', 'readwrite');
      const store = tx.objectStore('offlineSalesQueue');
      const getReq = store.get(localSaleId);
      getReq.onsuccess = () => {
        const sale = getReq.result as OfflineSale;
        if (sale) {
          sale.synced = true;
          sale.syncedAt = new Date().toISOString();
          sale.serverOrderId = serverOrderId;
          sale.serverInvoiceNumber = serverInvoiceNumber;
          store.put(sale);
        }
      };
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('Failed to mark sale as synced:', err);
    }
  }

  // 4. Held Orders
  public async saveHeldOrder(held: HeldSaleRecord): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('heldOrders', 'readwrite');
      const store = tx.objectStore('heldOrders');
      const req = store.put(held);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async saveAllHeldOrders(orders: HeldSaleRecord[]): Promise<void> {
    try {
      const db = await this.init();
      const tx = db.transaction('heldOrders', 'readwrite');
      const store = tx.objectStore('heldOrders');
      store.clear();
      for (const ord of orders) {
        store.put(ord);
      }
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('Failed to save held orders to IndexedDB:', err);
    }
  }

  public async getHeldOrders(): Promise<HeldSaleRecord[]> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('heldOrders', 'readonly');
        const store = tx.objectStore('heldOrders');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed to load held orders from IndexedDB:', err);
      return [];
    }
  }

  public async removeHeldOrder(id: string): Promise<void> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('heldOrders', 'readwrite');
        const store = tx.objectStore('heldOrders');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed to remove held order from IndexedDB:', err);
    }
  }
}

export const posOfflineDB = new POSOfflineDB();
