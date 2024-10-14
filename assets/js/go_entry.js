const csvUrl = 'https://gist.githubusercontent.com/brianhie/ccb5d20b6a62933ae77b274c5309636f/raw/375e7d23b045fd9022d56b1285496e0dfee55321/syngenome_test_go.csv';

function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function fetchAndParseCSV(url) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            header: true,
            complete: (results) => resolve(results.data),
            error: (error) => reject(error)
        });
    });
}

function generatePage(go_id) {
    showLoading();
    fetchAndParseCSV(csvUrl)
        .then(data => {
            const filteredData = data.filter(row => row.go_id === go_id);

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
                    <tr><th>Number of prompts</th><th>${row.n_prompts}</th></tr>
                    <tr><th>Number of DNA sequences</th><th>${row.n_seqs_dna}</th></tr>
                    <tr><th>Number of protein sequences</th><th>${row.n_seqs_prot}</th></tr>
                </table>
            `;

            document.getElementById('content').innerHTML = summaryTable;
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('content').innerHTML = '<p>Error loading data. Please refresh and try again.</p>';
        })
        .finally(() => {
            hideLoading();
        });
}

// Read UniProt CID from URL parameter and call generatePage
document.addEventListener('DOMContentLoaded', (event) => {
    const urlParams = new URLSearchParams(window.location.search);
    let go_id = urlParams.get('go_id');
    if (go_id) {
        go_id = decodeURIComponent(go_id);
        generatePage(go_id);
    } else {
        document.getElementById('content').innerHTML = '<p>No entry found! Please check the URL.</p>';
    }
});
