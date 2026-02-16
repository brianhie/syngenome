import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT_DIR = process.cwd();

function loadScript(relativePath, context) {
    const scriptPath = path.join(ROOT_DIR, relativePath);
    const code = fs.readFileSync(scriptPath, 'utf8');
    vm.runInContext(code, context, { filename: relativePath });
}

function cloneJSON(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
}

function flushTasks() {
    return new Promise(resolve => setImmediate(resolve));
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createFakeIndexedDB() {
    const databases = new Map();

    class FakeObjectStore {
        constructor(storeRecord) {
            this.storeRecord = storeRecord;
        }

        get(key) {
            const request = {
                onsuccess: null,
                onerror: null,
                result: undefined,
                error: null
            };

            queueMicrotask(() => {
                request.result = cloneJSON(this.storeRecord.data.get(key));
                if (request.onsuccess) {
                    request.onsuccess({ target: request });
                }
            });

            return request;
        }

        put(value) {
            const request = {
                onsuccess: null,
                onerror: null,
                result: undefined,
                error: null
            };

            queueMicrotask(() => {
                const key = value[this.storeRecord.keyPath];
                this.storeRecord.data.set(key, cloneJSON(value));
                request.result = key;
                if (request.onsuccess) {
                    request.onsuccess({ target: request });
                }
            });

            return request;
        }

        delete(key) {
            const request = {
                onsuccess: null,
                onerror: null,
                result: undefined,
                error: null
            };

            queueMicrotask(() => {
                this.storeRecord.data.delete(key);
                if (request.onsuccess) {
                    request.onsuccess({ target: request });
                }
            });

            return request;
        }
    }

    class FakeDB {
        constructor(databaseRecord) {
            this.databaseRecord = databaseRecord;
            this.objectStoreNames = {
                contains: name => this.databaseRecord.stores.has(name)
            };
        }

        createObjectStore(name, options) {
            const storeRecord = {
                keyPath: options.keyPath,
                data: new Map()
            };
            this.databaseRecord.stores.set(name, storeRecord);
            return new FakeObjectStore(storeRecord);
        }

        transaction(name) {
            const storeRecord = this.databaseRecord.stores.get(name);
            if (!storeRecord) {
                throw new Error(`Store does not exist: ${name}`);
            }

            return {
                objectStore: () => new FakeObjectStore(storeRecord)
            };
        }
    }

    return {
        open(name, version) {
            const request = {
                onsuccess: null,
                onerror: null,
                onupgradeneeded: null,
                result: null,
                error: null
            };

            queueMicrotask(() => {
                let databaseRecord = databases.get(name);
                if (!databaseRecord) {
                    databaseRecord = {
                        version: 0,
                        stores: new Map()
                    };
                    databases.set(name, databaseRecord);
                }

                const targetVersion = version || Math.max(databaseRecord.version, 1);
                const oldVersion = databaseRecord.version;
                const needsUpgrade = targetVersion > oldVersion;
                databaseRecord.version = Math.max(databaseRecord.version, targetVersion);

                const db = new FakeDB(databaseRecord);
                request.result = db;

                if (needsUpgrade && request.onupgradeneeded) {
                    request.onupgradeneeded({
                        target: { result: db },
                        oldVersion
                    });
                }

                if (request.onsuccess) {
                    request.onsuccess({ target: { result: db } });
                }
            });

            return request;
        }
    };
}

class FakeElement {
    constructor(id) {
        this.id = id;
        this.children = [];
        this.listeners = {};
        this.style = {};
        this.value = '';
        this.disabled = false;
        this.href = '';
        this.download = '';
        this._innerHTML = '';
        this._textContent = '';
    }

    set innerHTML(value) {
        this._innerHTML = String(value);
        this.children = [];
    }

    get innerHTML() {
        return this._innerHTML;
    }

    set textContent(value) {
        this._textContent = String(value);
        this._innerHTML = this._textContent;
    }

    get textContent() {
        return this._textContent;
    }

    appendChild(child) {
        this.children.push(child);
        this._innerHTML += child.innerHTML || child.textContent || '';
        return child;
    }

    removeChild(child) {
        this.children = this.children.filter(candidate => candidate !== child);
    }

    addEventListener(type, listener) {
        if (!this.listeners[type]) {
            this.listeners[type] = [];
        }
        this.listeners[type].push(listener);
    }

    dispatchEvent(event) {
        const listeners = this.listeners[event.type] || [];
        listeners.forEach(listener => listener(event));
    }

    click() {
        this.dispatchEvent({
            type: 'click',
            preventDefault: () => {}
        });
    }
}

class FakeDocument {
    constructor() {
        this.elements = new Map();
        this.body = this.getElementById('body');
    }

    getElementById(id) {
        if (!this.elements.has(id)) {
            this.elements.set(id, new FakeElement(id));
        }
        return this.elements.get(id);
    }

    querySelector(selector) {
        if (selector === '#dataTable tbody') {
            return this.getElementById('dataTableBody');
        }
        return null;
    }

    createElement(tagName) {
        return new FakeElement(tagName);
    }

    addEventListener() {
        // Not needed for these regression tests.
    }
}

function createUtilsContext(fetchImpl, nowStart = 1_700_000_000_000) {
    const DateShim = class extends Date {};
    let now = nowStart;
    DateShim.now = () => now;

    const context = vm.createContext({
        console,
        fetch: fetchImpl,
        indexedDB: createFakeIndexedDB(),
        Date: DateShim,
        setTimeout,
        clearTimeout,
        queueMicrotask,
        URLSearchParams,
        document: new FakeDocument(),
        window: {
            matchMedia: () => ({ matches: false })
        },
        navigator: {
            userAgent: 'node-test'
        }
    });

    loadScript('assets/js/utils.js', context);

    return {
        context,
        setNow(value) {
            now = value;
        }
    };
}

function createTableContext(dataset) {
    const document = new FakeDocument();
    document.getElementById('prevButton');
    document.getElementById('nextButton');
    document.getElementById('searchInput');
    document.getElementById('dataTableBody');

    let fetchCount = 0;

    const context = vm.createContext({
        console,
        document,
        setTimeout,
        clearTimeout,
        URLSearchParams,
        window: {
            location: {
                search: ''
            }
        },
        showLoading: () => {},
        hideLoading: () => {},
        capitalize: value => {
            if (typeof value !== 'string' || !value) {
                return value;
            }
            return value.charAt(0).toUpperCase() + value.slice(1);
        },
        fetchAndParseJSON: async (url, overrideData) => {
            fetchCount += 1;
            return overrideData || cloneJSON(dataset);
        }
    });

    loadScript('assets/js/table.js', context);

    return {
        context,
        document,
        getFetchCount() {
            return fetchCount;
        }
    };
}

function createEntryContext(datasetByUrl) {
    const document = new FakeDocument();
    document.getElementById('content');
    document.getElementById('loading');
    document.getElementById('download-button');

    const context = vm.createContext({
        console,
        document,
        setTimeout,
        clearTimeout,
        showLoading: () => {},
        hideLoading: () => {},
        fetchAndParseJSON: async url => cloneJSON(datasetByUrl[url]),
        downloadFile: async () => {},
        cleanIdentifier: value => String(value || '').toLowerCase(),
        capitalize: value => {
            if (typeof value !== 'string' || !value) {
                return value;
            }
            return value.charAt(0).toUpperCase() + value.slice(1);
        },
        zip: (...arrays) => {
            const minLength = Math.min(...arrays.map(array => array.length));
            return Array.from({ length: minLength }, (_, index) => arrays.map(array => array[index]));
        }
    });

    loadScript('assets/js/entry.js', context);
    return {
        context,
        document
    };
}

test('utils caches JSON responses between calls', async () => {
    let fetchCount = 0;
    const { context } = createUtilsContext(async url => {
        fetchCount += 1;
        return {
            ok: true,
            status: 200,
            json: async () => ({ url, fetchCount })
        };
    });

    const first = await context.fetchAndParseJSON('https://example.com/data.json');
    const second = await context.fetchAndParseJSON('https://example.com/data.json');

    assert.equal(fetchCount, 1);
    assert.deepEqual(first, second);
});

test('utils invalidates expired cache entries and refetches', async () => {
    let fetchCount = 0;
    const start = 1_700_000_000_000;
    const { context, setNow } = createUtilsContext(async () => {
        fetchCount += 1;
        return {
            ok: true,
            status: 200,
            json: async () => ({ fetchCount })
        };
    }, start);

    const first = await context.fetchAndParseJSON('https://example.com/freshness.json');
    setNow(start + (25 * 60 * 60 * 1000));
    const second = await context.fetchAndParseJSON('https://example.com/freshness.json');

    assert.equal(fetchCount, 2);
    assert.notDeepEqual(first, second);
});

test('utils deduplicates concurrent fetches for the same URL', async () => {
    let fetchCount = 0;
    let releaseFetch;
    const fetchGate = new Promise(resolve => {
        releaseFetch = resolve;
    });

    const { context } = createUtilsContext(async () => {
        fetchCount += 1;
        await fetchGate;
        return {
            ok: true,
            status: 200,
            json: async () => ({ done: true })
        };
    });

    const p1 = context.fetchAndParseJSON('https://example.com/concurrent.json', null, true);
    const p2 = context.fetchAndParseJSON('https://example.com/concurrent.json', null, true);

    releaseFetch();
    const [result1, result2] = await Promise.all([p1, p2]);

    assert.equal(fetchCount, 1);
    assert.deepEqual(result1, result2);
});

test('table recomputes filter/sort only when filter state changes', async () => {
    const dataset = Array.from({ length: 7 }, (_, index) => ({
        u: String(index + 1),
        n: `protein ${index + 1}`,
        s: 'Species',
        d: [`IPR${index + 1}`],
        t: [`go term ${index + 1}`],
        g: [`GO:${index + 1}`],
        p: 100 - index,
        a: 200 - index,
        r: 300 - index
    }));

    const { context, document } = createTableContext(dataset);
    const originalApply = context.applyFiltersAndSort;
    let applyCount = 0;
    context.applyFiltersAndSort = data => {
        applyCount += 1;
        return originalApply(data);
    };

    context.renderTable('https://example.com/table.json', true);
    await flushTasks();

    document.getElementById('nextButton').dispatchEvent({ type: 'click' });
    await flushTasks();

    assert.equal(applyCount, 1);

    const searchInput = document.getElementById('searchInput');
    searchInput.value = 'protein 1';
    searchInput.dispatchEvent({
        type: 'input',
        target: searchInput
    });
    await sleep(300);
    await flushTasks();

    assert.equal(applyCount, 2);
});

test('entry lookups still render GO and UniProt content correctly', async () => {
    const datasetByUrl = {
        'https://example.com/go.json.gz': [
            {
                go_id: 'GO:0004518',
                go_term: 'nuclease activity',
                go_type: 'molecular_function',
                n_prompts: 10,
                n_seqs_dna: 50,
                n_seqs_prot: 42
            }
        ],
        'https://example.com/uniprot.json.gz': [
            {
                u: 'P22995',
                n: 'Hypothetical protein',
                s: 'Escherichia coli',
                d: ['IPR003615'],
                g: ['GO:0004518'],
                t: ['nuclease activity'],
                p: 25,
                a: 125,
                r: 105,
                c: '00001'
            }
        ]
    };

    const { context, document } = createEntryContext(datasetByUrl);

    context.generatePageGO('nuclease activity', 'https://example.com/go.json.gz');
    await flushTasks();
    assert.match(document.getElementById('content').innerHTML, /GO:0004518/);

    context.generatePageUniProt('P22995', 'https://example.com/uniprot.json.gz');
    await flushTasks();
    assert.match(document.getElementById('content').innerHTML, /P22995/);
    assert.match(document.getElementById('content').innerHTML, /Hypothetical protein/);
});
