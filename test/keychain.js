const shared = require('./sharedKeychain');
const { Keychain } = require('../lib/');

// to run KeyChain websocket with a custom port, from ~/Keychain/ folder, execute ./websocketd --port=16385 --passenv=HOME ./keychain --mode=test_run
describe('keychain.js methods', () => {
  shared.testKeychain(new Keychain('ws://localhost:16385/'));
});
