const shared = require('./sharedKeychain');
const Keychain = require('../lib/pipe');

describe('keychain.js methods with pipe', () => {
  shared.testKeychain(new Keychain(true));
});

