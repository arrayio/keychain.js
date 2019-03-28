const should = require('chai').should();
const expect = require('chai').expect;

const Web3 = require('web3');

const API_KEY = 'https://ropsten.infura.io/v3/046804e3dd3240b09834531326f310cf';

let web3 = new Web3(new Web3.providers.HttpProvider(API_KEY));

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
  const Module = require('../lib/index');
  const { sign, signTransaction } = Module.web3Override(web3);
  const Keychain = Module.Keychain;

  it('Select key', async() => {
    const keychain = await Keychain.create();
    const data = await keychain.selectKey();
    selectedKey = data.result;
    console.log('selectedKey: ', selectedKey);
    should.exist(selectedKey);
  });

  it('Sign with web3', async () => {
    signResWeb3 = await web3.eth.accounts.sign(message, privateKey);
    console.log('signResWeb3: ', signResWeb3);
    expect(signResWeb3).to.have.property('message');
  });

  it('Sign transaction with web3', async () => {
    resWeb3 = await web3.eth.accounts.signTransaction(transactionParams, privateKey);
    expect(resWeb3).to.have.property('rawTransaction');
  });

  it('Sign with overridden web3', async () => {
    web3.eth.accounts.sign = sign;
    web3.eth.accounts.signTransaction = signTransaction;
    signResKch = await web3.eth.accounts.sign(message, selectedKey);
    expect(signResKch).to.have.property('signature');
  });

  it('Sign transaction with overridden web3', async () => {
    resKch = await web3.eth.accounts.signTransaction(transactionParams, selectedKey);
    expect(resKch).to.have.property('rawTransaction');
  });

  it('Overridden web3 signTransaction valid', async () => {
    expect(resKch).to.deep.equal(resWeb3);
  });

  it('Overriden web3 sign valid', async () => {
    expect(signResKch).to.deep.equal(signResWeb3);
  });

});

