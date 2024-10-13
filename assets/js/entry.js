const csvUrl = 'https://gist.githubusercontent.com/brianhie/64bbb0402ba0e0a86f1cc978b0be9723/raw/ae9510b8026641814ddeff606f3537b33d4e9a7c/syngenome_test_chunk.csv';

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

function generatePage(uniprotCID) {
    showLoading();
    fetchAndParseCSV(csvUrl)
        .then(data => {
            const filteredData = data.filter(row => row.UniProt_CID === uniprotCID);

            if (filteredData.length === 0) {
                document.getElementById('content').innerHTML = `
                    <p class="entry-not-found">Could not find ${uniprotCID}</p>
                    <p class="entry-not-found"><a href="/">Return to search.</a></p>
                `;
                return;
            }

            const uniquePrompts = new Set(filteredData.map(row => row.Prompt));
            const uniqueGeneratedSeqs = new Set(filteredData.map(row => row.Generated_Seq));

            const summaryTable = `
                <h2>UniProt accession: ${uniprotCID}</h2>
                <table class="entry-table">
                    <tr><th>Unique Prompts</th><th>Unique Generated Sequences</th></tr>
                    <tr><td>${uniquePrompts.size}</td><td>${uniqueGeneratedSeqs.size}</td></tr>
                </table>
            `;

            const promptMap = new Map();
            filteredData.forEach(row => {
                if (!promptMap.has(row.Prompt)) {
                    promptMap.set(row.Prompt, { type: row.Type, sequences: [] });
                }
                promptMap.get(row.Prompt).sequences.push(row.Generated_Seq);
            });

            let hierarchicalDisplay = '';
            promptMap.forEach((value, prompt) => {
                hierarchicalDisplay += `
                            <div class="prompt-section">
                                <h3>Prompt: ${prompt}</h3>
                                <p>Type: ${value.type}</p>
                                <h4>Generated Sequences:</h4>
                                ${value.sequences.map(seq => `<div class="generated-seq">${seq}</div>`).join('')}
                            </div>
                        `;
            });

            document.getElementById('content').innerHTML = summaryTable + hierarchicalDisplay;
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('content').innerHTML = '<p>Error loading data. Please try again later.</p>';
        })
        .finally(() => {
            hideLoading();
        });
}

// Read UniProt CID from URL parameter and call generatePage
document.addEventListener('DOMContentLoaded', (event) => {
    const urlParams = new URLSearchParams(window.location.search);
    let uniprotCID = urlParams.get('id');
    if (uniprotCID) {
        uniprotCID = decodeURIComponent(uniprotCID);
        generatePage(uniprotCID);
    } else {
        document.getElementById('content').innerHTML = '<p>No entry found! Please check the URL.</p>';
    }
});
