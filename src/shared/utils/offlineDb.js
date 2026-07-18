const DB_NAME = 'divine_mother_offline_v1';
const STORES = ['publicContent', 'mediaMetadata', 'checklistDrafts', 'syncQueue', 'cacheMetadata'];

export function initDb() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event);
      reject(event);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      STORES.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      });
    };
  });
}

export async function saveToStore(storeName, key, value) {
  try {
    const db = await initDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value, key);

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e);
    });
  } catch (err) {
    console.error(`Failed to save to ${storeName}:`, err);
    return false;
  }
}

export async function getFromStore(storeName, key) {
  try {
    const db = await initDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (e) => reject(e);
    });
  } catch (err) {
    console.error(`Failed to fetch from ${storeName}:`, err);
    return null;
  }
}

export async function clearAllUserRecords() {
  try {
    const db = await initDb();
    const transaction = db.transaction(STORES, 'readwrite');
    STORES.forEach((storeName) => {
      transaction.objectStore(storeName).clear();
    });
    console.log('IndexedDB database cleared on user logout.');
    return true;
  } catch (err) {
    console.error('Failed to clear IndexedDB stores:', err);
    return false;
  }
}
