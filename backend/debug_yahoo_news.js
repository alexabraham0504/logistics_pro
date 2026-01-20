const YahooFinance = require('yahoo-finance2').default;
const yf = new YahooFinance();

(async () => {
    try {
        console.log('Searching for news...');
        const result = await yf.search('logistics truck shipping', { newsCount: 5, quotesCount: 0 });
        console.log('News found:', result.news ? result.news.length : 0);
        if (result.news && result.news.length > 0) {
            console.log('Sample Article:', result.news[0]);
        }
    } catch (e) {
        console.error('Search failed:', e.message);
    }
})();
