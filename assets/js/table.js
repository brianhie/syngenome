let filteredData = null;
let totalData = null;
let searchKey = null;
let jsonUrl = null;
let processedDataCache = null;
let processedDataCacheKey = null;

const tableBody = document.querySelector('#dataTable tbody');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const searchInput = document.getElementById('searchInput');

let itemsPerPage = 5;
let currentPage = 1;

// Extract key and value from URL parameters.
const urlParams = new URLSearchParams(window.location.search);
let filterKey = null;
let filterValue = null;
let filterTerm = null;
// Iterate through URL parameters and use the first one found.
for (const [key, value] of urlParams.entries()) {
    filterKey = key;
    filterValue = value.toLowerCase();
    break; // We only need the first parameter.
}

function isItemAllowableUnderURLParam(item) {
    if (filterKey && filterValue) {
        const searchValues = ((filterKey.toLowerCase() === "id") || (filterKey.toLowerCase() === "text"))
              ? Object.values(item) 
              : [item[filterKey]];

        return searchValues.some(value => {
            const searchArray = Array.isArray(value) ? value : [value];
            return searchArray.some(element =>
                String(element).toLowerCase().includes(filterValue)
            );
        });
    }
    return true; // If no URL filter, include all items.
}

function updatePaginationButtons(filteredData) {
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === Math.ceil(filteredData.length / itemsPerPage);
}

const columnOrder = [
    'go_term',
    'go_id',
    'go_type',
    'domain_id',
    'domain_name',
    'uniprot_id', 'u',
    'uniprot_name', 'n',
    'species_id', 's',
    'domain_ids', 'd',
    'go_terms', 't',
    'go_ids', 'g',
    'n_prompts', 'p',
    'n_seqs_dna', 'a',
    'n_seqs_prot', 'r'
];

function buildProcessedDataCacheKey() {
    return `${jsonUrl || ''}|${filterKey || ''}|${filterValue || ''}|${filterTerm || ''}`;
}

function invalidateProcessedDataCache() {
    processedDataCache = null;
    processedDataCacheKey = null;
}

function applyFiltersAndSort(data) {
    return data
        .filter(item => {
            if (filterTerm) {
                const searchValues = Object.values(item);
                const filterMatch = searchValues.some(value => {
                    const searchArray = Array.isArray(value) ? value : [value];
                    return searchArray.some(element =>
                        String(element).toLowerCase().includes(filterTerm)
                    );
                });
                return filterMatch && isItemAllowableUnderURLParam(item);
            }
            return isItemAllowableUnderURLParam(item);
        })
        .sort((a, b) => {
            const aValue = Number(a.n_prompts !== undefined ? a.n_prompts : a.p) || 0;
            const bValue = Number(b.n_prompts !== undefined ? b.n_prompts : b.p) || 0;
            if (aValue !== bValue) {
                return bValue - aValue;
            }
            const aU = Number(a.u) || 0;
            const bU = Number(b.u) || 0;
            return bU - aU;
        });
}

function getProcessedData(data) {
    const key = buildProcessedDataCacheKey();
    if (processedDataCache && processedDataCacheKey === key) {
        return processedDataCache;
    }

    processedDataCache = applyFiltersAndSort(data);
    processedDataCacheKey = key;
    return processedDataCache;
}

function renderTable(url, noLoading) {
    if (!noLoading) {
        showLoading();
    }

    const previousUrl = jsonUrl;
    jsonUrl = url;
    if (previousUrl !== jsonUrl) {
        totalData = null;
        currentPage = 1;
        invalidateProcessedDataCache();
    }

    fetchAndParseJSON(jsonUrl, totalData)
        .then(data => {
            if (!totalData) {
                totalData = data;
            }

            filteredData = getProcessedData(totalData);

            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const pageData = filteredData.slice(startIndex, endIndex);

            tableBody.innerHTML = '';

            if (columnOrder.length === 0 && pageData.length > 0) {
                columnOrder = Object.keys(pageData[0]);
            }

            pageData.forEach(item => {
                const row = document.createElement('tr');

                if ((item.species_id && item.species_id.toLowerCase() == "unknown") ||
                    (item.s && item.s.toLowerCase() == "unknown")) {
                    // Ignore the "Unknown" species.
                    return;
                }
                
                columnOrder.forEach(key => {
                    if (!(key in item)) return;
                    
                    const value = item[key];
                    const cell = document.createElement('td');

                    switch(key) {

                    case 'go_id':
                        const goLink = document.createElement('a');
                        goLink.href = `/syngenome/go?id=${encodeURIComponent(value)}`;
                        goLink.textContent = value;
                        cell.appendChild(goLink);
                        break;

                    case 'go_ids':
                    case 'g':
                        cell.innerHTML = value.map(go_id => 
                            `<a href="/syngenome/go?id=${encodeURIComponent(go_id)}">${go_id}</a>`
                        ).join(', ');
                        if (value.length === 0) {
                            cell.innerHTML = '-';
                        }
                        break;

                    case 'go_term':
                        const goTermLink = document.createElement('a');
                        goTermLink.href = `/syngenome/go?id=${encodeURIComponent(value)}`;
                        goTermLink.textContent = capitalize(value);
                        cell.appendChild(goTermLink);
                        if (!searchKey) {
                            searchKey = key;
                        }
                        break;

                    case 'go_terms':
                    case 't':
                        cell.innerHTML = value.map(go_term => 
                            `<a href="/syngenome/go?id=${encodeURIComponent(go_term)}">${go_term}</a>`
                        ).join(', ');
                        if (value.length === 0) {
                            cell.innerHTML = '-';
                        }
                        break;

                    case 'domain_id':
                        const domainLink = document.createElement('a');
                        domainLink.href = `/syngenome/domain?id=${encodeURIComponent(value)}`;
                        domainLink.textContent = value;
                        cell.appendChild(domainLink);
                        if (!searchKey) {
                            searchKey = key;
                        }
                        break;

                    case 'domain_ids':
                    case 'd':
                        cell.innerHTML = value.map(domain_id => 
                            `<a href="/syngenome/domain?id=${encodeURIComponent(domain_id)}">${domain_id}</a>`
                        ).join(', ');
                        if (value.length === 0) {
                            cell.innerHTML = '-';
                        }
                        break;

                    case 'species_id':
                    case 's':
                        const speciesLink = document.createElement('a');
                        speciesLink.href = `/syngenome/species?id=${encodeURIComponent(value)}`;
                        speciesLink.textContent = value;
                        cell.appendChild(speciesLink);
                        if (!searchKey) {
                            searchKey = key;
                        }
                        break;

                    case 'uniprot_id':
                    case 'u':
                        const uniprotLink = document.createElement('a');
                        uniprotLink.href = `/syngenome/uniprot?id=${encodeURIComponent(value)}`;
                        uniprotLink.textContent = value;
                        cell.appendChild(uniprotLink);
                        if (!searchKey) {
                            searchKey = key;
                        }
                        break;

                    case 'n_prompts':
                    case 'p':
                    case 'n_seqs_dna':
                    case 'a':
                    case 'n_seqs_prot':
                    case 'r':
                    case 'go_type':
                    case 'domain_name':
                    case 'uniprot_name':
                    case 'n':
                        cell.textContent = value;
                        break;

                    default:
                        // Skip unregistered keys.
                        return;
                    }

                    if (cell.innerHTML) {
                        row.appendChild(cell);
                    }
                });
                
                tableBody.appendChild(row);
            });
            updatePaginationButtons(filteredData);
        })
        .finally(() => {
            if (!noLoading) {
                hideLoading();
            }
        });
}

prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderTable(jsonUrl, true);
    }
});

nextButton.addEventListener('click', () => {
    if (currentPage < Math.ceil(filteredData.length / itemsPerPage)) {
        currentPage++;
        renderTable(jsonUrl, true);
    }
});

let timeoutId;
searchInput.addEventListener('input', (e) => {
    // Clear any existing timeout.
    clearTimeout(timeoutId);

    // Set new timeout for 250 milliseconds.
    timeoutId = setTimeout(() => {
        filterTerm = e.target.value.toLowerCase();
        currentPage = 1;
        invalidateProcessedDataCache();
        renderTable(jsonUrl, true);
    }, 250);
});
