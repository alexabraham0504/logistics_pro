const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

(async () => {
    try {
        console.log('Suppressing notices on instance...');
        yahooFinance.suppressNotices(['yahooSurvey', 'nonsensical']);

        console.log('Fetching chart...');
        const result = await yahooFinance.chart('FDX', { period1: '2021-01-01', interval: '1mo' });
        console.log('Success! Quotes:', result.quotes.length);
    } catch (e) {
        console.error('Failed:', e.message);
    }
})();
