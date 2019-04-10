const shared = require('./sharedKeychain');
const { Keychain } = require('../lib/');

describe('keychain.js methods', () => {
  shared.testKeychain(new Keychain());
});

