const should = require('chai').should();
const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'))

const Web3 = require('web3');
const API_KEY = 'https://ropsten.infura.io/v3/046804e3dd3240b09834531326f310cf';
const web3 = new Web3(new Web3.providers.HttpProvider(API_KEY));

const to = '0xE8899BA12578d60e4D0683a596EDaCbC85eC18CC';
const value = 100;
const data = '';
const gas = 21000;
const nonce = 0;
const gasPrice = 100;
const chainId = 3;

const transactionParams = {
  // nonce,
  // gasPrice,
  to,
  value,
  data,
  gas,
  chainId
};

describe("Create and sign", () => {
  let signResKch, signResWeb3, resKch, resWeb3;
  let selectedKey;
  const privateKey = '0x920bca893ca29df824858d2e333a159a4d98d1f3c5b5ce76fe236ceb09ae273e';
  const message = '12345';
  const { Keychain, keychainWeb3 } = require('../lib/index');

  it('Select key', async() => {
    const keychain = new Keychain();
    selectedKey = await keychain.selectKey();
    should.exist(selectedKey);
  });

  it('Sign transaction with web3', async () => {
    resWeb3 = await web3.eth.accounts.signTransaction(transactionParams, privateKey);
    expect(resWeb3).to.have.property('rawTransaction');
  });

  it('Sign transaction with overridden web3', async () => {
    web3.eth.accounts.signTransaction = keychainWeb3.signTransaction;
    resKch = await web3.eth.accounts.signTransaction(transactionParams, selectedKey);
    expect(resKch).to.have.property('rawTransaction');
    expect(resKch).to.deep.equal(resWeb3);
  });

  it('Sign transaction with binded web3', async () => {
    resKch = await keychainWeb3.signTransaction.bind(web3)(transactionParams, selectedKey);
    expect(resKch).to.have.property('rawTransaction');
    expect(resKch).to.deep.equal(resWeb3);
  });

  it('Sign with web3', async () => {
    signResWeb3 = await web3.eth.accounts.sign(message, privateKey);
    expect(signResWeb3).to.have.property('message');
  });

  it('Sign with overridden web3', async () => {
    web3.eth.accounts.sign = keychainWeb3.sign;
    signResKch = await web3.eth.accounts.sign(message, selectedKey);
    expect(signResKch).to.have.property('signature');
    expect(signResKch).to.deep.equal(signResWeb3);
  });

  it('Sign with binded web3', async () => {
    signResKch = await keychainWeb3.sign.bind(web3)(message, selectedKey);
    expect(signResKch).to.have.property('signature');
    expect(signResKch).to.deep.equal(signResWeb3);
  });

  it('Should unlock a key', async () => {
    const keychain = new Keychain();
    await keychain.unlock(selectedKey, 45);
    const signResult = await keychain.signTrx(  "eb0885098bca5a00825208948ec6977b1255854169e5f9f8f163f371bcf1ffd287038d7ea4c6800080038080",
        selectedKey,
      "ethereum"
    );
    should.exist(signResult);
  });

  it('Should lock all keys', async () => {
    const keychain = new Keychain();
    await keychain.lock();
    const signResult = await keychain.signTrx(  "eb0885098bca5a00825208948ec6977b1255854169e5f9f8f163f371bcf1ffd287038d7ea4c6800080038080",
      selectedKey,
      "ethereum"
    );
    should.exist(signResult);
  });

  it('Should run about method', async () => {
    const keychain = new Keychain();
    const about = await keychain.about();
    should.exist(about);
  });

  it('Should run version method', async () => {
    const keychain = new Keychain();
    const version = await keychain.version();
    should.exist(version);
  });

  it('Checks if an unknown command throws an error', async () => {
    const keychain = new Keychain();
    await expect(keychain.method({command: 'unknownCommand'})).to.be.rejected;
  });

});

