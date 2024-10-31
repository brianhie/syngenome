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

// Constants for chunk sizing and memory management
const CHUNK_SIZE = 256 * 1024; // 256KB chunks - smaller chunks for mobile
const MAX_BUFFER_SIZE = 512 * 1024; // 512KB max buffer size
const MAX_CACHE_CHUNK_SIZE = 1024 * 1024; // 1MB max cache chunk size

// Helper to check if running on mobile
function isMobile() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

// Helper to check available memory (where supported)
async function checkMemoryPressure() {
    if ('performance' in window && 'memory' in performance) {
        const memory = performance.memory;
        return {
            hasWarning: memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.7,
            usedPercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        };
    }
    return { hasWarning: false, usedPercent: 0 };
}

// Stream reader that respects memory constraints
async function safeStreamReader(readableStream, onChunk) {
    const reader = readableStream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    try {
        while (true) {
            // Check memory pressure periodically
            const memCheck = await checkMemoryPressure();
            if (memCheck.hasWarning) {
                // If memory pressure is high, pause briefly to allow GC
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            const { done, value } = await reader.read();
            if (done) break;
            
            // Process in smaller chunks on mobile
            const chunkSize = isMobile() ? CHUNK_SIZE : CHUNK_SIZE * 4;
            buffer += decoder.decode(value, { stream: true });
            
            while (buffer.length > chunkSize) {
                const chunk = buffer.slice(0, chunkSize);
                buffer = buffer.slice(chunkSize);
                await onChunk(chunk);
            }
        }
        
        if (buffer.length > 0) {
            await onChunk(buffer + decoder.decode());
        }
    } finally {
        reader.releaseLock();
    }
}

// Memory-aware JSON parser
async function streamParseJSON(readableStream, progressCallback) {
    let jsonString = '';
    let totalProcessed = 0;

    await safeStreamReader(readableStream, async (chunk) => {
        totalProcessed += chunk.length;
        jsonString += chunk;
        
        if (progressCallback) {
            progressCallback(totalProcessed);
        }
        
        // If on mobile, periodically clear variables that aren't needed
        if (isMobile() && jsonString.length > MAX_BUFFER_SIZE) {
            jsonString = jsonString.slice(-MAX_BUFFER_SIZE);
            // Force garbage collection if available
            if (window.gc) {
                window.gc();
            }
        }
    });

    try {
        return JSON.parse(jsonString);
    } catch (e) {
        throw new Error(`JSON parsing failed: ${e.message}. This might be due to memory constraints or incomplete data.`);
    }
}

async function fetchAndParseJSON(url, overrideData, progressCallback) {
    if (overrideData) {
        return overrideData;
    }

    // Split large requests into ranges on mobile
    const isMobileDevice = isMobile();
    let response;
    
    try {
        // First, try to get the file size
        const headResponse = await fetch(url, { method: 'HEAD' });
        const fileSize = parseInt(headResponse.headers.get('Content-Length') || '0');

        if (isMobileDevice && fileSize > MAX_CACHE_CHUNK_SIZE) {
            // For large files on mobile, we'll use range requests
            const chunks = [];
            let startByte = 0;
            
            while (startByte < fileSize) {
                const endByte = Math.min(startByte + MAX_CACHE_CHUNK_SIZE, fileSize);
                const rangeResponse = await fetch(url, {
                    headers: {
                        'Range': `bytes=${startByte}-${endByte - 1}`
                    }
                });

                if (!rangeResponse.ok && !rangeResponse.status === 206) {
                    throw new Error('Range request failed');
                }

                const chunk = await rangeResponse.arrayBuffer();
                chunks.push(new Uint8Array(chunk));

                if (progressCallback) {
                    progressCallback(startByte / fileSize);
                }

                startByte = endByte;
                
                // Add a small delay between chunks on mobile to prevent memory pressure
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Combine chunks
            const combinedArray = new Uint8Array(fileSize);
            let offset = 0;
            for (const chunk of chunks) {
                combinedArray.set(chunk, offset);
                offset += chunk.length;
            }

            response = new Response(combinedArray);
        } else {
            // For smaller files or desktop, proceed normally
            response = await fetch(url);
        }
    } catch (e) {
        console.error('Fetch failed:', e);
        throw e;
    }

    if (!response.ok && response.status !== 206) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (url.toLowerCase().endsWith('.gz')) {
        try {
            const ds = new DecompressionStream('gzip');
            const decompressedStream = response.body.pipeThrough(ds);
            return await streamParseJSON(decompressedStream, progressCallback);
        } catch (e) {
            console.error('Decompression or parsing failed:', e);
            throw e;
        }
    }

    return streamParseJSON(response.body, progressCallback);
}
