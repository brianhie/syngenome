const data = [
    {"Species": "Escherichia coli", "Number of generated DNA seqs": 59274, "Number of generated protein seqs": 99, "Number of Pred. TA loci": 59175},
    {"Species": "Klebsiella pneumoniae", "Number of generated DNA seqs": 22177, "Number of generated protein seqs": 4, "Number of Pred. TA loci": 22173},
    {"Species": "Mycobacterium tuberculosis", "Number of generated DNA seqs": 21102, "Number of generated protein seqs": 59, "Number of Pred. TA loci": 21043},
    {"Species": "Staphylococcus aureus", "Number of generated DNA seqs": 10907, "Number of generated protein seqs": 34, "Number of Pred. TA loci": 10873},
    {"Species": "Salmonella enterica", "Number of generated DNA seqs": 7580, "Number of generated protein seqs": 12, "Number of Pred. TA loci": 7568},
    {"Species": "Pseudomonas aeruginosa", "Number of generated DNA seqs": 4295, "Number of generated protein seqs": 9, "Number of Pred. TA loci": 4286},
    {"Species": "Enterococcus faecalis", "Number of generated DNA seqs": 2721, "Number of generated protein seqs": 14, "Number of Pred. TA loci": 2707},
    {"Species": "Enterobacter hormaechei", "Number of generated DNA seqs": 2709, "Number of generated protein seqs": 0, "Number of Pred. TA loci": 2709},
    {"Species": "Vibrio cholerae", "Number of generated DNA seqs": 1873, "Number of generated protein seqs": 19, "Number of Pred. TA loci": 1854},
    {"Species": "Acinetobacter baumannii", "Number of generated DNA seqs": 1651, "Number of generated protein seqs": 6, "Number of Pred. TA loci": 1645}
];

const itemsPerPage = 5;
let currentPage = 1;

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
        const itemValue = item[filterKey];
        if (Array.isArray(itemValue)) {
            return itemValue.some(element => 
                String(element).toLowerCase().includes(filterValue)
            );
        } else {
            return String(itemValue).toLowerCase().includes(filterValue);
        }
    }
    return true; // If no URL filter, include all items.
});

function renderTable(newPage) {
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
}

function renderTableBrowse() {
    renderTable('search');
}

function renderTableSearch() {
    renderTable('prompt');
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
        const speciesMatch = item["Species"].toLowerCase().includes(searchTerm);
        
        // If we have a filter from URL parameters, apply it.
        if (filterKey && filterValue) {
            const itemValue = item[filterKey];
            
            if (Array.isArray(itemValue)) {
                // If itemValue is an array, check if any element includes filterValue.
                const arrayMatch = itemValue.some(element => 
                    String(element).toLowerCase().includes(filterValue)
                );
                return speciesMatch && arrayMatch;
            } else {
                // If itemValue is not an array, proceed as before.
                const stringMatch = String(itemValue).toLowerCase().includes(filterValue);
                return speciesMatch && stringMatch;
            }
        }
        
        // If no URL filter, just use the species filter
        return speciesMatch;
    });
    currentPage = 1;
    renderTable();
});
