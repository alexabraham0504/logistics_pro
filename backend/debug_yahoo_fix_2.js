const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

(async () => {
    try {
        console.log('Fetching chart on instance WITHOUT suppression...');
        const result = await yahooFinance.chart('FDX', { period1: '2021-01-01', interval: '1mo' });
        console.log('Success! Quotes:', result.quotes.length);
    } catch (e) {
        console.error('Failed:', e.message);
    }
})();
