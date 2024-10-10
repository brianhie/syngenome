const itemsPerPage = 5;
let currentPage = 1;
let newPage = 'search';

const tableBody = document.querySelector('#dataTable tbody');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const searchInput = document.getElementById('searchInput');

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

let filteredData = data.filter(item => {
    if (filterKey && filterValue) {
        const searchValues = filterKey.toLowerCase() === "text" 
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
});

function renderTable() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);

    tableBody.innerHTML = '';

    pageData.forEach(item => {
        const row = document.createElement('tr');
        Object.entries(item).forEach(([key, value], index) => {
            const cell = document.createElement('td');
            if (index === 0) {
                // Create a link for the first cell.
                const link = document.createElement('a');
                link.href = `/${newPage}.html?${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
                link.textContent = value;
                cell.appendChild(link);
            } else {
                cell.textContent = value;
            }
            row.appendChild(cell);
        });
        tableBody.appendChild(row);
    });

    updatePaginationButtons();

    return pageData;
}

function renderTableBrowse() {
    newPage = 'search';
    renderTable();
}

function renderTableSearch() {
    newPage = 'entry';
    pageData = renderTable();

    if (pageData.length === 1) {
        const firstItem = pageData[0];
        const [firstKey, firstValue] = Object.entries(firstItem)[0];
        const redirectUrl = `/${newPage}.html?${encodeURIComponent(firstKey)}=${encodeURIComponent(firstValue)}`;
        window.location.href = redirectUrl;
    }
}

function updatePaginationButtons() {
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === Math.ceil(filteredData.length / itemsPerPage);
}

prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
});

nextButton.addEventListener('click', () => {
    if (currentPage < Math.ceil(filteredData.length / itemsPerPage)) {
        currentPage++;
        renderTable();
    }
});

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filteredData = data.filter(item => {
	const key = Object.entries(item)[0][0];
        const speciesMatch = item[key].toLowerCase().includes(searchTerm);

        // If we have a filter from URL parameters, apply it
        if (filterKey && filterValue) {
            const searchValues = filterKey.toLowerCase() === "text" 
                  ? Object.values(item) 
                  : [item[filterKey]];

            const urlFilterMatch = searchValues.some(value => {
                const searchArray = Array.isArray(value) ? value : [value];
                return searchArray.some(element =>
                    String(element).toLowerCase().includes(filterValue)
                );
            });

            return speciesMatch && urlFilterMatch;
        }

        // If no URL filter, just use the species filter
        return speciesMatch;
    });
    currentPage = 1;
    renderTable();
});
