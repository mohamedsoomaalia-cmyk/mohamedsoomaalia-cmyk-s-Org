
export class KoobDB {
  private dbName = 'KoobCoffeeDB';
  private version = 4;
  private stores = ['products', 'orders', 'customers', 'staff', 'expenses', 'config', 'categories', 'settlements', 'staffLogs'];

  async open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        this.stores.forEach(store => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName: string): Promise<any[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName: string, data: any): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearStore(storeName: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Backup all data from all stores
  async exportDatabase(): Promise<Record<string, any[]>> {
    const backup: Record<string, any[]> = {};
    for (const store of this.stores) {
      backup[store] = await this.getAll(store);
    }
    return backup;
  }

  // Restore all data into stores
  async importDatabase(data: Record<string, any[]>): Promise<void> {
    for (const storeName of this.stores) {
      if (data[storeName]) {
        await this.clearStore(storeName);
        const db = await this.open();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        for (const item of data[storeName]) {
          store.put(item);
        }
      }
    }
  }
}

export const db = new KoobDB();
