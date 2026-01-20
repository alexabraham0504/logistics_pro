const pkg = require('yahoo-finance2');
const YF = pkg.default;

try {
    console.log('Trying new YF()...');
    const yfInstance = new YF();
    console.log('Instance keys:', Object.keys(yfInstance));
    console.log('Has chart?', !!yfInstance.chart);
    console.log('Has suppressNotices?', !!yfInstance.suppressNotices);
} catch (e) {
    console.error('Instantiation failed:', e.message);
}

console.log('Checking static chart...');
if (YF.chart) {
    console.log('Static chart exists.');
    // Try calling it
    YF.chart('FDX', { period1: '2021-01-01' }).then(() => console.log('Static call success')).catch(e => console.log('Static call error:', e.message));
}
