const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
chai.use(require('chai-as-promised'));

exports.testKeychain = function(keychain) {
  let selectedKey;

  it('Select key', async() => {
    selectedKey = await keychain.selectKey();
    should.exist(selectedKey);
  });

  it('Should unlock a key', async () => {
    await keychain.unlock(selectedKey, 45);
    const signResult = await keychain.signTrx(  'eb0885098bca5a00825208948ec6977b1255854169e5f9f8f163f371bcf1ffd287038d7ea4c6800080038080',
      selectedKey,
      'ethereum'
    );
    should.exist(signResult);
  });

  it('Should lock all keys', async () => {
    await keychain.lock();
    const signResult = await keychain.signTrx(  'eb0885098bca5a00825208948ec6977b1255854169e5f9f8f163f371bcf1ffd287038d7ea4c6800080038080',
      selectedKey,
      'ethereum'
    );
    should.exist(signResult);
  });

  it('Should run about method', async () => {
    const about = await keychain.about();
    should.exist(about);
  });

  it('Should run version method', async () => {
    const version = await keychain.version();
    should.exist(version);
  });

  it('Checks if an unknown command throws an error', async () => {
    await expect(keychain.method({command: 'unknownCommand'})).to.be.rejected;
  });
};
