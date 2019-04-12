const shared = require('./sharedWeb3');
const { Keychain } = require('../lib/');

// to run KeyChain websocket with a custom port, from ~/Keychain/ folder, execute ./websocketd --port=16385 --passenv=HOME ./keychain --mode=test_run
describe("Create and sign with WebSocket KeyChain", () => {
  shared.testKeychainWeb3(new Keychain('ws://localhost:16385/'));
});
