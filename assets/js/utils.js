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

// Helper function to chunk string data
function* chunkString(str, size) {
    for (let i = 0; i < str.length; i += size) {
        yield str.slice(i, i + size);
    }
}

// Helper function to stream JSON parsing
async function streamParseJSON(readableStream) {
    const decoder = new TextDecoder();
    const reader = readableStream.getReader();
    let buffer = '';
    
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            
            // Process buffer in chunks to avoid memory issues
            if (buffer.length > 1024 * 1024) { // 1MB chunks
                const lastNewline = buffer.lastIndexOf('\n');
                if (lastNewline > 0) {
                    const processable = buffer.slice(0, lastNewline);
                    buffer = buffer.slice(lastNewline + 1);
                    // Process the chunk here if needed
                }
            }
        }
        
        // Process any remaining buffer content
        buffer += decoder.decode(); // flush the decoder
        return JSON.parse(buffer);
    } finally {
        reader.releaseLock();
    }
}

async function fetchAndParseJSON(url, overrideData, progressCallback) {
    if (overrideData) {
        return overrideData;
    }

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

    // If not in cache, fetch with progress tracking
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentLength = response.headers.get('Content-Length');
    let loaded = 0;

    // Create a transform stream to track progress
    const progressStream = new TransformStream({
        transform(chunk, controller) {
            loaded += chunk.length;
            if (progressCallback && contentLength) {
                progressCallback(loaded / parseInt(contentLength));
            }
            controller.enqueue(chunk);
        }
    });

    if (url.toLowerCase().endsWith('.gz')) {
        // Handle gzipped content
        const ds = new DecompressionStream('gzip');
        const decompressedStream = response.body
            .pipeThrough(progressStream)
            .pipeThrough(ds);

        const data = await streamParseJSON(decompressedStream);

        // Cache the result in chunks
        try {
            const db = await openDB();
            const tx = db.transaction('decompressed', 'readwrite');
            const store = tx.objectStore('decompressed');
            
            // Convert data to string and store in chunks if it's very large
            const dataString = JSON.stringify(data);
            if (dataString.length > 5 * 1024 * 1024) { // 5MB threshold
                const chunks = Array.from(chunkString(dataString, 1024 * 1024)); // 1MB chunks
                await new Promise((resolve, reject) => {
                    const request = store.put({ 
                        url, 
                        data,
                        chunks: true,
                        chunkCount: chunks.length
                    });
                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => resolve();
                });
            } else {
                await new Promise((resolve, reject) => {
                    const request = store.put({ url, data });
                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => resolve();
                });
            }
        } catch (e) {
            console.warn('Cache write failed:', e);
        }

        return data;
    }

    // For non-gzipped content, use streaming JSON parser
    return streamParseJSON(response.body.pipeThrough(progressStream));
}
