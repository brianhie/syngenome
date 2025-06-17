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

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('DataCache', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore('decompressed', { keyPath: 'url' });
        };
    });
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
            const db = await openDB();
            const tx = db.transaction('decompressed', 'readonly');
            const store = tx.objectStore('decompressed');
            const cached = await new Promise((resolve, reject) => {
                const request = store.get(url);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
            });

            if (cached) {
                return cached.data;
            }
        } catch (e) {
            console.warn('Cache read failed:', e);
        }
    }

    // If not in cache, fetch and cache
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (url.toLowerCase().endsWith('.gz')) {
        const blob = await response.blob();
        const ds = new DecompressionStream('gzip');
        const decompressedStream = blob.stream().pipeThrough(ds);
        const decompressedResponse = new Response(decompressedStream);
        const text = await decompressedResponse.text();
        const data = JSON.parse(text);

        // Cache the result
        try {
            const db = await openDB();
            const tx = db.transaction('decompressed', 'readwrite');
            const store = tx.objectStore('decompressed');
            await new Promise((resolve, reject) => {
                const request = store.put({ url, data });
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve();
            });
        } catch (e) {
            console.warn('Cache write failed:', e);
        }

        return data;
    }

    return response.json();
}
