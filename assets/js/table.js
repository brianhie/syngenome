let filteredData = null;
let totalData = null;
let searchKey = null;
let jsonUrl = null;

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

function renderTable(url, noLoading) {
    if (!noLoading) {
        showLoading();
    }

    jsonUrl = url;

    fetchAndParseJSON(jsonUrl, totalData)
        .then(data => {
            filteredData = data
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
                .sort(item => -item.n_prompts);

            if (!totalData) {
                totalData = filteredData;
            }

            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const pageData = filteredData.slice(startIndex, endIndex);

            tableBody.innerHTML = '';

            if (columnOrder.length === 0 && pageData.length > 0) {
                columnOrder = Object.keys(pageData[0]);
            }

            pageData.forEach(item => {
                const row = document.createElement('tr');
                
                columnOrder.forEach(key => {
                    if (!(key in item)) return;
                    
                    const value = item[key];
                    const cell = document.createElement('td');

                    switch(key) {

                    case 'go_id':
                        const goLink = document.createElement('a');
                        goLink.href = `/go.html?id=${encodeURIComponent(value)}`;
                        goLink.textContent = value;
                        cell.appendChild(goLink);
                        break;

                    case 'go_ids':
                    case 'g':
                        cell.innerHTML = value.map(go_id => 
                            `<a href="/go.html?id=${encodeURIComponent(go_id)}">${go_id}</a>`
                        ).join(', ');
                        if (value.length === 0) {
                            cell.innerHTML = '-';
                        }
                        break;

                    case 'go_term':
                        const goTermLink = document.createElement('a');
                        goTermLink.href = `/go.html?id=${encodeURIComponent(value)}`;
                        goTermLink.textContent = capitalize(value);
                        cell.appendChild(goTermLink);
                        if (!searchKey) {
                            searchKey = key;
                        }
                        break;

                    case 'go_terms':
                    case 't':
                        cell.innerHTML = value.map(go_term => 
                            `<a href="/go.html?id=${encodeURIComponent(go_term)}">${go_term}</a>`
                        ).join(', ');
                        if (value.length === 0) {
                            cell.innerHTML = '-';
                        }
                        break;

                    case 'domain_id':
                        const domainLink = document.createElement('a');
                        domainLink.href = `/domain.html?id=${encodeURIComponent(value)}`;
                        domainLink.textContent = value;
                        cell.appendChild(domainLink);
                        if (!searchKey) {
                            searchKey = key;
                        }
                        break;

                    case 'domain_ids':
                    case 'd':
                        cell.innerHTML = value.map(domain_id => 
                            `<a href="/domain.html?id=${encodeURIComponent(domain_id)}">${domain_id}</a>`
                        ).join(', ');
                        if (value.length === 0) {
                            cell.innerHTML = '-';
                        }
                        break;

                    case 'species_id':
                    case 's':
                        const speciesLink = document.createElement('a');
                        speciesLink.href = `/species.html?id=${encodeURIComponent(value)}`;
                        speciesLink.textContent = value;
                        cell.appendChild(speciesLink);
                        if (!searchKey) {
                            searchKey = key;
                        }
                        break;

                    case 'uniprot_id':
                    case 'u':
                        const uniprotLink = document.createElement('a');
                        uniprotLink.href = `/uniprot.html?id=${encodeURIComponent(value)}`;
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

searchInput.addEventListener('input', (e) => {
    filterTerm = e.target.value.toLowerCase();
    currentPage = 1;
    renderTable(jsonUrl, true);
});
