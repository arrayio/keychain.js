const shared = require('./sharedBitcoin');

describe('bitcoinjs-lib (transactions)', function () {
  shared.test(require('bitcoinjs-lib-3-3-2'));
  shared.test(require('bitcoinjs-lib-4-0-3'));
});
