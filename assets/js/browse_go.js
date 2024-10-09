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
let filteredData = [...data];

const tableBody = document.querySelector('#dataTable tbody');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const searchInput = document.getElementById('searchInput');

function renderTable() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);

    tableBody.innerHTML = '';
    pageData.forEach(item => {
        const row = document.createElement('tr');
        Object.values(item).forEach(value => {
            const cell = document.createElement('td');
            cell.textContent = value;
            row.appendChild(cell);
        });
        tableBody.appendChild(row);
    });

    updatePaginationButtons();
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
    filteredData = data.filter(item => 
        item.Species.toLowerCase().includes(searchTerm)
    );
    currentPage = 1;
    renderTable();
});

renderTable();
