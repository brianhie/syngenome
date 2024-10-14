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

function isItemAllowableUnderURLParam(item) {
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
}

let filteredData = data.filter(item => isItemAllowableUnderURLParam(item));

function renderTable() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);

    tableBody.innerHTML = '';

    pageData.forEach(item => {
        const row = document.createElement('tr');
        Object.entries(item).forEach(([key, value], index) => {
            const cell = document.createElement('td');
            if (key === 'go_id') {
                if (Array.isArray(value)) {
                    value.forEach(go_id => {
                        const link = document.createElement('a');
		        link.href = `/go_entry.html?go_id=${encodeURIComponent(go_id)}`;
                        link.textContent = go_id;
                        cell.appendChild(link);
                    });
                } else {
                    const link = document.createElement('a');
		    link.href = `/go_entry.html?go_id=${encodeURIComponent(value)}`;
                    link.textContent = value;
                    cell.appendChild(link);
                }
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

    /*if (pageData.length === 1) {
        const firstItem = pageData[0];
        const [firstKey, firstValue] = Object.entries(firstItem)[0];
	const redirectUrl = `/${newPage}.html?id=${encodeURIComponent(firstValue)}`;
        window.location.href = redirectUrl;
    }*/
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
        const searchMatch = item[key].toLowerCase().includes(searchTerm);
        return searchMatch && isItemAllowableUnderURLParam(item);
    });
    currentPage = 1;
    renderTable();
});
