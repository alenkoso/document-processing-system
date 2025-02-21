document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const clearButton = document.getElementById('clearButton');
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');

    function formatResult(data) {
        return `
            <div class="answer">${data.answer}</div>
            <div class="source-list">
                <h3>Sources:</h3>
                ${data.context.map(ctx => `
                    <div class="source-item">
                        📚 ${ctx.source.replace('.txt', '')} - Chunk ${ctx.index}
                    </div>
                `).join('')}
            </div>
        `;
    }

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
                resultDiv.innerHTML = formatResult(data);
                resultDiv.style.display = 'block';
            } else {
                resultDiv.innerHTML = `
                    <div class="error-message">
                        <h3>Error</h3>
                        <p>${data.error}</p>
                        <p class="error-details">${data.details || ''}</p>
                    </div>
                `;
                resultDiv.style.display = 'block';
            }
        } catch (error) {
            resultDiv.innerHTML = `
                <div class="error-message">
                    <h3>Error</h3>
                    <p>${error.message}</p>
                </div>
            `;
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