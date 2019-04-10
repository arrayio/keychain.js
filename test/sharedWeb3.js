const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'));
const { KeychainWeb3 } = require('../lib/index');

const Web3 = require('web3');
const API_KEY = 'https://ropsten.infura.io/v3/046804e3dd3240b09834531326f310cf';

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

exports.testKeychainWeb3 = function(keychain) {

  let signResKch, signResWeb3, resKch, resWeb3;
  const publicKey = '08d6770d8219923fe25a4d6aeb2c171253d5de3bc225f09dbfb2cb93ed837be1a80fdd3af5046b8f1f5412e5b321dcc3c25be9f4dd285250421ea55071794277';
  const privateKey = '0x920bca893ca29df824858d2e333a159a4d98d1f3c5b5ce76fe236ceb09ae273e';
  const message = '12345';
  const web3 = new Web3(API_KEY);
  const keychainWeb3 = new KeychainWeb3(keychain, web3);

  it('Sign transaction with web3', async () => {
    resWeb3 = await web3.eth.accounts.signTransaction(transactionParams, privateKey);
    expect(resWeb3).to.have.property('rawTransaction');
  });

  it('Sign transaction with overridden web3', async () => {
    web3.eth.accounts.signTransaction = keychainWeb3.signTransaction.bind(keychainWeb3);
    resKch = await web3.eth.accounts.signTransaction(transactionParams, publicKey);
    expect(resKch).to.have.property('rawTransaction');
    expect(resKch).to.deep.equal(resWeb3);
  });

  it('Sign transaction without overriding web3', async () => {
    resKch = await keychainWeb3.signTransaction(transactionParams, publicKey);
    expect(resKch).to.have.property('rawTransaction');
    expect(resKch).to.deep.equal(resWeb3);
  });

  it('Sign with web3', async () => {
    signResWeb3 = await web3.eth.accounts.sign(message, privateKey);
    expect(signResWeb3).to.have.property('message');
  });

  it('Sign with overridden web3', async () => {
    web3.eth.accounts.sign = keychainWeb3.sign.bind(keychainWeb3);
    signResKch = await web3.eth.accounts.sign(message, publicKey);
    expect(signResKch).to.have.property('signature');
    expect(signResKch).to.deep.equal(signResWeb3);
  });

  it('Sign without overriding web3', async () => {
    signResKch = await keychainWeb3.sign(message, publicKey);
    expect(signResKch).to.have.property('signature');
    expect(signResKch).to.deep.equal(signResWeb3);
  });
};
