const pkg = require('yahoo-finance2');
console.log('Type:', typeof pkg);
console.log('Keys:', Object.keys(pkg));
if (pkg.default) {
    console.log('Default Usage:', typeof pkg.default);
    console.log('Default Keys:', Object.keys(pkg.default));
}
