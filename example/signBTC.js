const bitcoin = require ('bitcoinjs-lib');
const fetch = require('node-fetch');
const { Keychain } = require('../lib'); // require('keychain.js') if you run it outside of keychain.js repository
const API_URL = 'https://test-insight.bitpay.com/api';

const fetchUnspents = (address) =>
  fetch(`${API_URL}/addr/${address}/utxo`).then( data => data.json() );

const broadcastTx = (txRaw) =>
  fetch(`${API_URL}/tx/send`, {method: 'post',
    body:    JSON.stringify({rawtx: txRaw}),
    headers: { 'Content-Type': 'application/json' }}
  )
    .then(response => {
      if(response.ok) {
        return response.json();
      }
      throw response.statusText;
    });

const addressFromPublicKey = (publicKey) => {
  const pubkey = Buffer.from(`03${publicKey.substr(0, 64)}`, 'hex');
  const keyPair = bitcoin.ECPair.fromPublicKeyBuffer(pubkey, bitcoin.networks.testnet);
  return keyPair.getAddress();
};

async function main() {
  const keychain = new Keychain();
  const publicKey = await keychain.selectKey();

  const tx = {
    from: addressFromPublicKey(publicKey),
    to: 'mqkrYyihgXVUZisi452KQ4tpTsaE8Tk8uj',
    amount: 20000,
    feeValue: 226
  };

  const txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
  const unspents = await fetchUnspents(tx.from);
  const totalUnspent = unspents.reduce((summ, { satoshis }) => summ + satoshis, 0);
  const changeAmount = totalUnspent - tx.amount - tx.feeValue;

  unspents.forEach(({ txid, vout }) => txb.addInput(txid, vout, 0xfffffffe));
  txb.addOutput(tx.to, tx.amount);
  if (changeAmount > 546) {
    txb.addOutput(tx.from, changeAmount);
  }

  const txRaw = txb.buildIncomplete();
  // add input scripts to unsigned transaction https://github.com/bitcoinjs/bitcoinjs-lib/issues/1011#issuecomment-368394185
  unspents.forEach(({ scriptPubKey }, index) => txRaw.ins[index].script = Buffer.from(scriptPubKey, 'hex'));
  const rawHex = await keychain.signTrx(
    txRaw.toHex(),
    publicKey,
    'bitcoin'
  );
  console.log('rawHex: ', rawHex);
  // uncomment to broadcast the transaction
  // try {
  //   const broadcastResult = await broadcastTx(rawHex);
  //   console.log('broadcastResult: ', broadcastResult);
  //   console.log('broadcastResult: ', `https://test-insight.bitpay.com/tx/${broadcastResult.txid}`);
  // } catch (error) {
  //   console.log('Cannot broadcast a transaction: ', error);
  // }
}

main();
