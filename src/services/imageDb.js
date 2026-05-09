const DB_NAME = 'HostelX_ImageCache';
const STORE_NAME = 'images';
const DB_VERSION = 1;

const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
};

export const getCachedImage = async (url) => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const blob = await new Promise((resolve) => {
            const req = store.get(url);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
        });

        if (blob) {
            return URL.createObjectURL(blob);
        }

        const response = await fetch(url);
        const newBlob = await response.blob();
        
        const saveTx = db.transaction(STORE_NAME, 'readwrite');
        const saveStore = saveTx.objectStore(STORE_NAME);
        saveStore.put(newBlob, url);
        
        return URL.createObjectURL(newBlob);
    } catch (err) {
        console.warn('Failed to cache image in LocalDB:', err);
        return url;
    }
};
