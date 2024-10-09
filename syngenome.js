const exampleQueries = [
    'toxin sequestering activity',
    'GO:0097351',
    'P22995',
    'PF09386',
    'E. coli'
];

const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const exampleQueriesContainer = document.getElementById('exampleQueries');

// Populate example queries
exampleQueries.forEach(query => {
    const button = document.createElement('button');
    button.textContent = query;
    button.className = 'example-query';
    button.type = 'button';
    button.addEventListener('click', () => {
        searchInput.value = query;
    });
    exampleQueriesContainer.appendChild(button);
});

// Handle form submission
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const searchQuery = searchInput.value.trim();
    if (searchQuery) {
        console.log('Searching for:', searchQuery);
        // Here you would typically call your search function
        alert(`Searching for: ${searchQuery}`);
    }
});
