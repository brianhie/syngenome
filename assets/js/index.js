const exampleQueries = [
    'toxin sequestering activity',
    'GO:0097351',
    'P22995',
    'PF09386',
    'Escherichia coli'
];

const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const exampleQueriesContainer = document.getElementById('exampleQueries');
const browseForm = document.getElementById('browseForm');

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
	window.location.href = `/search.html?text=${encodeURIComponent(searchQuery)}`;
    }
});

// Get references to the buttons
const goTermButton = document.getElementById('go-term-button');
const domainButton = document.getElementById('domain-button');
const speciesButton = document.getElementById('species-button');

// Add click event listeners to each button
goTermButton.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = '/browse_go.html';
});

domainButton.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = '/browse_domain.html';
});

speciesButton.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = '/browse_species.html';
});
