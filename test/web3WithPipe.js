const shared = require('./shared');
const PipeKeychain = require('../lib/pipe');

describe("Create and sign with pipe KeyChain", () => {
  shared.testKeychainWeb3(new PipeKeychain());
});
