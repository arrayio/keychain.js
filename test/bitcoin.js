const assert = require('assert');
const bitcoin = require('bitcoinjs-lib');
const fetch = require('node-fetch');
const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'));
const { Keychain } = require('../lib');
const bitcoinUtil = require('../lib/bitcoinUtil');
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

const keychain = new Keychain('ws://localhost:16385/');

describe('bitcoinjs-lib (transactions)', function () {
  it('checks bitcoinjs and KeyChain signed transactions are equal', async () => {
    const publicKey = '08d6770d8219923fe25a4d6aeb2c171253d5de3bc225f09dbfb2cb93ed837be1a80fdd3af5046b8f1f5412e5b321dcc3c25be9f4dd285250421ea55071794277';

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

    it('can create a 1-to-1 Transaction', async () => {
      const publicKey = '9f50f51d63b345039a290c94bffd3180c99ed659ff6ea6b1242bca47eb93b59f36a13e1e9d3e9bad0187bf307ccf24b1273419a8fa011c9191b8b5eae8674c00';
      const getTransactionBuilder = () => {
        const txb = new bitcoin.TransactionBuilder();
        txb.setVersion(1);
        txb.addInput('61d520ccb74288c96bc1a2b20ea1c0d5a704776dd0164a396efec3ea7040349d', 0); // Alice's previous transaction output, has 15000 satoshis
        txb.addOutput('1cMh228HTCiwS8ZsaakH8A8wze1JR5ZsP', 12000);
        // (in)15000 - (out)12000 = (fee)3000, this is the miner fee
        return txb;
      };

      const alice = bitcoin.ECPair.fromWIF('L1uyy5qTuGrVXrmrsvHWHgVzW9kKdrp27wBC7Vs6nZDTF2BRUVwy');
      const txbBitcoinJS = getTransactionBuilder();
      txbBitcoinJS.sign(0, alice);

      const expected = '01000000019d344070eac3fe6e394a16d06d7704a7d5c0a10eb2a2c16bc98842b7cc20d561000000006b48304502210088828c0bdfcdca68d8ae0caeb6ec62cd3fd5f9b2191848edae33feb533df35d302202e0beadd35e17e7f83a733f5277028a9b453d525553e3f5d2d7a7aa8010a81d60121029f50f51d63b345039a290c94bffd3180c99ed659ff6ea6b1242bca47eb93b59fffffffff01e02e0000000000001976a91406afd46bcdfd22ef94ac122aa11f241244a37ecc88ac00000000';
      assert.strictEqual(txbBitcoinJS.build().toHex(), expected);

      const txbKeychain = getTransactionBuilder();
      const txRaw = txbKeychain.buildIncomplete();
      txRaw.ins[0].script = bitcoinUtil.getDefaultScript(Buffer.from(publicKey, 'hex'));
      const rawHex = await keychain.signTrx(txRaw.toHex(), publicKey, 'bitcoin');
      console.log('rawHex: ', rawHex);
      console.log('rawHex: ', expected);
    })
});
