function generatePageGO(go_id, jsonUrl) {
    showLoading();
    fetchAndParseJSON(jsonUrl)
        .then(data => {
            const filteredData = data.filter(row => ((row.go_id === go_id) || row.go_term === go_id));

            if (filteredData.length === 0) {
                document.getElementById('content').innerHTML = `
                    <p class="entry-not-found">Could not find ${go_id}</p>
                    <p class="entry-not-found"><a href="/">Return to search.</a></p>
                `;
                return;
            }

            const row = filteredData[0];

            const summaryTable = `
                <h2>${row.go_term}</h2>
                <h3>${row.go_id} | ${row.go_type}</h3>

                <table class="entry-table">
                    <tr><th>Number of prompts</th><td>${row.n_prompts}</td></tr>
                    <tr><th>Number of generated DNA sequences</th><td>${row.n_seqs_dna}</td></tr>
                    <tr><th>Number of generated protein sequences</th><td>${row.n_seqs_prot}</td></tr>
                </table>

                <form id="downloadForm" class="download-form">
          	  <div class="download-buttons">
          	    <button id="download-button" class="download-button">Download prompts and generations</button>
          	  </div>
                </form>

                <div class="line"></div>
            `;

            document.getElementById('content').innerHTML = summaryTable;

            const downloadButton = document.getElementById('download-button');
            downloadButton.addEventListener('click', (e) => {
                e.preventDefault();
                showLoading();
                downloadFile('https://gist.githubusercontent.com/brianhie/64bbb0402ba0e0a86f1cc978b0be9723/raw/ae9510b8026641814ddeff606f3537b33d4e9a7c/syngenome_test_chunk.csv', 'syngenome_download.csv');
                hideLoading();
            });
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('content').innerHTML = '<p>Error loading data. Please refresh and try again.</p>';
        })
        .finally(() => {
            hideLoading();
        });
}

function generatePageDomain(domain_id, jsonUrl) {
    showLoading();
    fetchAndParseJSON(jsonUrl)
        .then(data => {
            const filteredData = data.filter(row => (row.domain_id === domain_id));

            if (filteredData.length === 0) {
                document.getElementById('content').innerHTML = `
                    <p class="entry-not-found">Could not find ${domain_id}</p>
                    <p class="entry-not-found"><a href="/">Return to search.</a></p>
                `;
                return;
            }

            const row = filteredData[0];

            const summaryTable = `
                <h2>${row.domain_id}</h2>
                <h3>${row.domain_name}</h3>

                <table class="entry-table">
                    <tr><th>Number of prompts</th><td>${row.n_prompts}</td></tr>
                    <tr><th>Number of generated DNA sequences</th><td>${row.n_seqs_dna}</td></tr>
                    <tr><th>Number of generated protein sequences</th><td>${row.n_seqs_prot}</td></tr>
                </table>

                <form id="downloadForm" class="download-form">
          	  <div class="download-buttons">
          	    <button id="download-button" class="download-button">Download prompts and generations</button>
          	  </div>
                </form>

                <div class="line"></div>
            `;

            document.getElementById('content').innerHTML = summaryTable;

            const downloadButton = document.getElementById('download-button');
            downloadButton.addEventListener('click', (e) => {
                e.preventDefault();
                showLoading();
                downloadFile('https://gist.githubusercontent.com/brianhie/64bbb0402ba0e0a86f1cc978b0be9723/raw/ae9510b8026641814ddeff606f3537b33d4e9a7c/syngenome_test_chunk.csv', 'syngenome_download.csv');
                hideLoading();
            });
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('content').innerHTML = '<p>Error loading data. Please refresh and try again.</p>';
        })
        .finally(() => {
            hideLoading();
        });
}

function generatePageSpecies(species_id, jsonUrl) {
    showLoading();
    fetchAndParseJSON(jsonUrl)
        .then(data => {
            const filteredData = data.filter(row => (row.species_id === species_id));

            if (filteredData.length === 0) {
                document.getElementById('content').innerHTML = `
                    <p class="entry-not-found">Could not find ${species_id}</p>
                    <p class="entry-not-found"><a href="/">Return to search.</a></p>
                `;
                return;
            }

            const row = filteredData[0];

            const summaryTable = `
                <h2>${row.species_id}</h2>
                <h3>Species</h3>

                <table class="entry-table">
                    <tr><th>Number of prompts</th><td>${row.n_prompts}</td></tr>
                    <tr><th>Number of generated DNA sequences</th><td>${row.n_seqs_dna}</td></tr>
                    <tr><th>Number of generated protein sequences</th><td>${row.n_seqs_prot}</td></tr>
                </table>

                <form id="downloadForm" class="download-form">
          	  <div class="download-buttons">
          	    <button id="download-button" class="download-button">Download prompts and generations</button>
          	  </div>
                </form>

                <div class="line"></div>
            `;

            document.getElementById('content').innerHTML = summaryTable;

            const downloadButton = document.getElementById('download-button');
            downloadButton.addEventListener('click', (e) => {
                e.preventDefault();
                showLoading();
                downloadFile('https://gist.githubusercontent.com/brianhie/64bbb0402ba0e0a86f1cc978b0be9723/raw/ae9510b8026641814ddeff606f3537b33d4e9a7c/syngenome_test_chunk.csv', 'syngenome_download.csv');
                hideLoading();
            });
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('content').innerHTML = '<p>Error loading data. Please refresh and try again.</p>';
        })
        .finally(() => {
            hideLoading();
        });
}

function generatePageUniProt(uniprot_id, jsonUrl) {
    showLoading();
    fetchAndParseJSON(jsonUrl)
        .then(data => {
            const filteredData = data.filter(row => row.uniprot_id === uniprot_id);

            if (filteredData.length === 0) {
                document.getElementById('content').innerHTML = `
                    <p class="entry-not-found">Could not find ${uniprot_id}</p>
                    <p class="entry-not-found"><a href="/">Return to search.</a></p>
                `;
                return;
            }

            const row = filteredData[0];

            const species_content = `<a href="/species.html?id=${row.species_id}">${row.species_id}</a>`;
            const domain_content = row.domain_ids.map(domain => {
                return `<a href="/domain.html?id=${domain}">${domain}</a>`;
            }).join(', ');
            const go_content = zip(row.go_ids, row.go_terms).map(([go_id, go_term]) => {
                return `<a href="/go.html?id=${go_id}">${go_term} (${go_id})</a>`;
            }).join(', ');

            const summaryTable = `
                <h2>${row.uniprot_id}</h2>
                <h3>${row.uniprot_name}</h3>

                <table class="entry-table">
                    <tr><th>Species</th><td>${species_content}</td></tr>
                    <tr><th>Domains</th><td>${domain_content}</td></tr>
                    <tr><th>GO terms</th><td>${go_content}</td></tr>
                    <tr><th>Number of prompts</th><td>${row.n_prompts}</td></tr>
                    <tr><th>Number of generated DNA sequences</th><td>${row.n_seqs_dna}</td></tr>
                    <tr><th>Number of generated protein sequences</th><td>${row.n_seqs_prot}</td></tr>
                </table>

                <form id="downloadForm" class="download-form">
          	  <div class="download-buttons">
          	    <button id="download-button" class="download-button">Download prompts and generations</button>
          	  </div>
                </form>
            `;

            document.getElementById('content').innerHTML = summaryTable;

            const downloadButton = document.getElementById('download-button');
            downloadButton.addEventListener('click', (e) => {
                e.preventDefault();
                showLoading();
                downloadFile('https://gist.githubusercontent.com/brianhie/64bbb0402ba0e0a86f1cc978b0be9723/raw/ae9510b8026641814ddeff606f3537b33d4e9a7c/syngenome_test_chunk.csv', 'syngenome_download.csv');
                hideLoading();
            });
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('content').innerHTML = '<p>Error loading data. Please refresh and try again.</p>';
        })
        .finally(() => {
            hideLoading();
        });
}

function generatePage(entryType, jsonUrl) {
    let generatePageFunc = null;
    if (entryType === 'go') {
        generatePageFunc = generatePageGO;
    } else if (entryType === 'domain') {
        generatePageFunc = generatePageDomain;
    } else if (entryType === 'species') {
        generatePageFunc = generatePageSpecies;
    } else if (entryType === 'uniprot') {
         generatePageFunc = generatePageUniProt;
    }
    
    document.addEventListener('DOMContentLoaded', (event) => {
        const urlParams = new URLSearchParams(window.location.search);
        let id = urlParams.get('id');
        if (id) {
            id = decodeURIComponent(id);
            generatePageFunc(id, jsonUrl);

            // TODO: ADD DOWNLOAD LOGIC HERE.
        } else {
            document.getElementById('content').innerHTML = '<p>No entry found! Please check the URL.</p>';
        }
    });
}
