function zip(...arrays) {
    const minLength = Math.min(...arrays.map(arr => arr.length));
    return Array.from({ length: minLength }, (_, i) => arrays.map(arr => arr[i]));
}

function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function fetchAndParseJSON(url) {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            return data;
        })
        .catch(error => {
            console.error('Error fetching or parsing JSON:', error);
        });
}

function downloadFile(url, fileName) {
    // Create a temporary anchor element and programmatically click it.
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'download'; // If fileName is not provided, the original filename will be used.
    link.target = '_blank'; // Open link in new page.
    link.rel = 'noopener noreferrer';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function capitalize(str) {
    if (typeof str !== 'string' || !str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}
