function zip(...arrays) {
    const minLength = Math.min(...arrays.map(arr => arr.length));
    return Array.from({ length: minLength }, (_, i) => arrays.map(arr => arr[i]));
}

function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

async function downloadFile(url, fileName) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;  // This sets the file name
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error('Download failed:', error);
    }
}

function capitalize(str) {
    if (typeof str !== 'string' || !str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const CACHE_DB_NAME = 'DataCache';
const CACHE_DB_VERSION = 2;
const CACHE_STORE_NAME = 'decompressed';
const CACHE_SCHEMA_VERSION = 1;
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let dbPromise = null;
const inFlightJSONRequests = new Map();

function openDB() {
    if (dbPromise) {
        return dbPromise;
    }

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(CACHE_DB_NAME, CACHE_DB_VERSION);

        request.onerror = () => {
            dbPromise = null;
            reject(request.error);
        };
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
                db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'url' });
            }
        };
    });

    return dbPromise;
}

function getCacheTTLMS(url) {
    if (url.includes('/file_mapping.json')) {
        return 6 * 60 * 60 * 1000;
    }
    return DEFAULT_CACHE_TTL_MS;
}

function isCacheEntryFresh(entry) {
    if (!entry) {
        return false;
    }

    if (entry.schemaVersion !== CACHE_SCHEMA_VERSION) {
        return false;
    }

    if (typeof entry.expiresAt !== 'number') {
        return false;
    }

    return entry.expiresAt > Date.now();
}

async function readCachedJSON(url) {
    const db = await openDB();
    const tx = db.transaction(CACHE_STORE_NAME, 'readonly');
    const store = tx.objectStore(CACHE_STORE_NAME);

    const cached = await new Promise((resolve, reject) => {
        const request = store.get(url);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });

    if (isCacheEntryFresh(cached)) {
        return cached.data;
    }

    if (cached) {
        const cleanupTx = db.transaction(CACHE_STORE_NAME, 'readwrite');
        const cleanupStore = cleanupTx.objectStore(CACHE_STORE_NAME);
        await new Promise((resolve, reject) => {
            const request = cleanupStore.delete(url);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    return null;
}

async function writeCachedJSON(url, data) {
    const db = await openDB();
    const tx = db.transaction(CACHE_STORE_NAME, 'readwrite');
    const store = tx.objectStore(CACHE_STORE_NAME);
    const now = Date.now();
    const expiresAt = now + getCacheTTLMS(url);

    await new Promise((resolve, reject) => {
        const request = store.put({
            url,
            data,
            schemaVersion: CACHE_SCHEMA_VERSION,
            cachedAt: now,
            expiresAt
        });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

async function parseJSONResponse(url, response) {
    if (url.toLowerCase().endsWith('.gz')) {
        const blob = await response.blob();
        const ds = new DecompressionStream('gzip');
        const decompressedStream = blob.stream().pipeThrough(ds);
        const decompressedResponse = new Response(decompressedStream);
        const text = await decompressedResponse.text();
        return JSON.parse(text);
    }

    return response.json();
}

function cleanIdentifier(identifier) {
    if (identifier == null || identifier === '') {
        return "none";
    }
    let cleaned = String(identifier).toLowerCase();
    cleaned = cleaned.replace(/[^a-z0-9-]/g, '');
    cleaned = cleaned.replace(/-+/g, '-');
    cleaned = cleaned.replace(/^-+|-+$/g, '');
    return cleaned || "none";
}

function checkIfMobile() {
  return (
      window.matchMedia('(max-width: 768px)').matches ||
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
}

async function fetchAndParseJSON(url, overrideData, noCache) {
    if (overrideData) {
        return overrideData;
    }

    if (!noCache) {
        // Try cache first
        try {
            const cachedData = await readCachedJSON(url);
            if (cachedData !== null) {
                return cachedData;
            }
        } catch (e) {
            console.warn('Cache read failed:', e);
        }
    }

    if (inFlightJSONRequests.has(url)) {
        return inFlightJSONRequests.get(url);
    }

    const fetchPromise = (async () => {
        // If not in cache, fetch and cache
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await parseJSONResponse(url, response);

        if (!noCache) {
            try {
                await writeCachedJSON(url, data);
            } catch (e) {
                console.warn('Cache write failed:', e);
            }
        }

        return data;
    })();

    inFlightJSONRequests.set(url, fetchPromise);
    try {
        return await fetchPromise;
    } finally {
        inFlightJSONRequests.delete(url);
    }
}
