const yahooFinance = require('yahoo-finance2').default;

(async () => {
    try {
        console.log('Testing Yahoo Finance fetch for FDX...');
        // Match the query used in the app
        const queryOptions = { period1: '2021-01-01', interval: '1mo' };

        // Try without suppression first to see error
        try {
            const result = await yahooFinance.chart('FDX', queryOptions);
            console.log('SUCCESS! Result quotes:', result.quotes ? result.quotes.length : 0);
        } catch (e) {
            console.error('FAILED without suppression:', e.message);

            // Try WITH suppression
            console.log('Retrying with suppression...');
            yahooFinance.suppressNotices(['yahooSurvey', 'nonsensical']);
            const result2 = await yahooFinance.chart('FDX', queryOptions);
            console.log('SUCCESS with suppression! Result quotes:', result2.quotes ? result2.quotes.length : 0);
        }
    } catch (err) {
        console.error('CRITICAL FAILURE:', err);
    }
})();
