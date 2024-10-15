let filteredData = null;
let jsonUrl = null;

const tableBody = document.querySelector('#dataTable tbody');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const searchInput = document.getElementById('searchInput');

const itemsPerPage = 5;
let currentPage = 1;

// Extract key and value from URL parameters.
const urlParams = new URLSearchParams(window.location.search);
let filterKey = null;
let filterValue = null;
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

function renderTable(url, filterTerm) {
    showLoading();

    jsonUrl = url;

    fetchAndParseJSON(jsonUrl)
        .then(data => {
            filteredData = data
                .filter(item => {
	            const key = Object.entries(item)[0][0];
                    if (filterTerm) {
                        const filterMatch = item[key].toLowerCase().includes(filterTerm);
                        return filterMatch && isItemAllowableUnderURLParam(item);
                    }
                    return isItemAllowableUnderURLParam(item);
                })
                .sort(item => -item.n_prompts);

            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const pageData = filteredData.slice(startIndex, endIndex);

            tableBody.innerHTML = '';

            pageData.forEach(item => {
                const row = document.createElement('tr');
                Object.entries(item).forEach(([key, value], index) => {
                    const cell = document.createElement('td');

                    if (key === 'go_id') {
                        const link = document.createElement('a');
		        link.href = `/go.html?id=${encodeURIComponent(value)}`;
                        link.textContent = value;
                        cell.appendChild(link);

                    } else if (key === 'go_ids') {
                        cell.innerHTML = value.map(go_id => {
                            return `<a href="/go.html?id=${encodeURIComponent(go_id)}">${go_id}</a>`;
                        }).join(', ');

                    } else if (key === 'go_term') {
                        const link = document.createElement('a');
		        link.href = `/go.html?id=${encodeURIComponent(value)}`;
                        link.textContent = value;
                        cell.appendChild(link);

                    } else if (key === 'go_terms') {
                        cell.innerHTML = value.map(go_term => {
                            return `<a href="/go.html?id=${encodeURIComponent(go_term)}">${go_term}</a>`;
                        }).join(', ');

                    } else if (key === 'domain_id') {
                        const link = document.createElement('a');
		        link.href = `/domain.html?id=${encodeURIComponent(value)}`;
                        link.textContent = value;
                        cell.appendChild(link);

                    } else if (key === 'domain_ids') {
                        cell.innerHTML = value.map(domain_id => {
                            return `<a href="/domain.html?id=${encodeURIComponent(domain_id)}">${domain_id}</a>`;
                        }).join(', ');

                    } else if (key === 'species_id') {
                        const link = document.createElement('a');
		        link.href = `/species.html?id=${encodeURIComponent(value)}`;
                        link.textContent = value;
                        cell.appendChild(link);

                    } else if (key === 'uniprot_id') {
                        const link = document.createElement('a');
		        link.href = `/uniprot.html?id=${encodeURIComponent(value)}`;
                        link.textContent = value;
                        cell.appendChild(link);

                    } else if (key === 'n_prompts' ||
                               key === 'n_seqs_dna' ||
                               key === 'n_seqs_prot' ||
                               key === 'go_type' ||
                               key === 'domain_name' ||
                               key === 'uniprot_name') {
                        cell.textContent = value;

                    } else {
                        /* If key is not registered, do not create entry in table. */
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
            hideLoading();
        })
}

prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderTable(jsonUrl);
    }
});

nextButton.addEventListener('click', () => {
    if (currentPage < Math.ceil(filteredData.length / itemsPerPage)) {
        currentPage++;
        renderTable(jsonUrl);
    }
});

searchInput.addEventListener('input', (e) => {
    const filterTerm = e.target.value.toLowerCase();
    currentPage = 1;
    renderTable(jsonUrl, filterTerm);
});

