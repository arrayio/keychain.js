const bitcoin = require('bitcoinjs-lib');
const fetch = require('node-fetch');
const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'));
const { Keychain } = require('../lib');
const API_URL = 'https://test-insight.bitpay.com/api';

const fetchUnspents = (address) =>
  fetch(`${API_URL}/addr/${address}/utxo`).then( data => data.json() );

const addressFromPublicKey = (publicKey) => {
  const pubkey = Buffer.from(`03${publicKey.substr(0, 64)}`, 'hex');
  const keyPair = bitcoin.ECPair.fromPublicKeyBuffer(pubkey, bitcoin.networks.testnet);
  return keyPair.getAddress();
};

const getTransactionBuilder = async (tx, unspents) => {
  const txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
  const totalUnspent = unspents.reduce((summ, { satoshis }) => summ + satoshis, 0);
  const changeAmount = totalUnspent - tx.amount - tx.feeValue;

  unspents.forEach(({ txid, vout }) => txb.addInput(txid, vout, 0xfffffffe));
  txb.addOutput(tx.to, tx.amount);
  if (changeAmount > 546) {
    txb.addOutput(tx.from, changeAmount);
  }
  return txb;
};

describe('bitcoinjs-lib (transactions)', function () {
  it('checks bitcoinjs and KeyChain signed transactions are equal', async () => {
    const keychain = new Keychain();
    const publicKey = await keychain.selectKey();

    const tx = {
      from: addressFromPublicKey(publicKey),
      to: 'mqkrYyihgXVUZisi452KQ4tpTsaE8Tk8uj',
      amount: 20000,
      feeValue: 226
    };

    const unspents = await fetchUnspents(tx.from);

    const txbKeychain = await getTransactionBuilder(tx, unspents);
    const txRaw = txbKeychain.buildIncomplete();
    // add input scripts to unsigned transaction https://github.com/bitcoinjs/bitcoinjs-lib/issues/1011#issuecomment-368394185
    unspents.forEach(({ scriptPubKey }, index) => txRaw.ins[index].script = Buffer.from(scriptPubKey, 'hex'));
    const rawHex = await keychain.signTrx(
      txRaw.toHex(),
      publicKey,
      'bitcoin'
    );

    const txbBitcoinJS = await getTransactionBuilder(tx, unspents);
    // wif for privateKey 920bca893ca29df824858d2e333a159a4d98d1f3c5b5ce76fe236ceb09ae273e
    // and publicKey 08d6770d8219923fe25a4d6aeb2c171253d5de3bc225f09dbfb2cb93ed837be1a80fdd3af5046b8f1f5412e5b321dcc3c25be9f4dd285250421ea55071794277
    const wif = 'cSUbXWxEBWT1nAt7crU5S4J6k14BK2xNijyE9FQxineBd8CijvVF';
    const keyPair = bitcoin.ECPair.fromWIF(wif, bitcoin.networks.testnet);
    txbBitcoinJS.inputs.forEach((input, index) => {
      txbBitcoinJS.sign(index, keyPair)
    });
    const txRawBitcoinJS = txbBitcoinJS.buildIncomplete();

    expect(rawHex).to.equal(txRawBitcoinJS.toHex());
  })
});
