const shared = require('./sharedWeb3');
const PipeKeychain = require('../lib/pipe');

describe("Create and sign with pipe KeyChain", () => {
  shared.testKeychainWeb3(new PipeKeychain());
});
