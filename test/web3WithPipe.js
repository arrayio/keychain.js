const shared = require('./sharedWeb3');
const Keychain = require('../lib/pipe');

describe("Create and sign with pipe KeyChain", () => {
  shared.testKeychainWeb3(new Keychain(true));
});
