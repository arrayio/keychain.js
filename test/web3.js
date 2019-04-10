const shared = require('./shared');
const { Keychain } = require('../lib/');

describe("Create and sign with WebSocket KeyChain", () => {
  shared.testKeychainWeb3(new Keychain());
});
