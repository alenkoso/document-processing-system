document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const clearButton = document.getElementById('clearButton');
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');

    async function performSearch() {
        const query = searchInput.value.trim();
        if (!query) return;

        loadingDiv.style.display = 'block';
        resultDiv.style.display = 'none';

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: query }),
            });

            const data = await response.json();
            
            if (response.ok) {
                resultDiv.textContent = JSON.stringify(data, null, 2);
                resultDiv.style.display = 'block';
            } else {
                resultDiv.textContent = `Error: ${data.error}\n${data.details || ''}`;
                resultDiv.style.display = 'block';
            }
        } catch (error) {
            resultDiv.textContent = `Error: ${error.message}`;
            resultDiv.style.display = 'block';
        } finally {
            loadingDiv.style.display = 'none';
        }
    }

    function clearSearch() {
        searchInput.value = '';
        resultDiv.style.display = 'none';
        loadingDiv.style.display = 'none';
    }

    searchButton.addEventListener('click', performSearch);
    clearButton.addEventListener('click', clearSearch);
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}); 