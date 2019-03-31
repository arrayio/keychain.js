const bitcoin = require ('bitcoinjs-lib');
const fetch = require('node-fetch');
const { BigNumber } = require('bignumber.js');
const { Keychain } = require('../lib'); // require('keychain.js') if you run it outside of keychain.js repository
const API_URL = 'https://test-insight.bitpay.com/api';

const txParams = {
  from: 'myLrbwvwJN59quivKSxCxgiqLdCw8m7aDf',
  to: 'mqkrYyihgXVUZisi452KQ4tpTsaE8Tk8uj',
  amount: 0.0002,
  feeValue: 226,
  speed: 'fast'
};

const fetchUnspents = (address) =>
  fetch(`${API_URL}/addr/${address}/utxo`).then( data => data.json() );

const broadcastTx = (txRaw) =>
  fetch(`${API_URL}/tx/send`, {method: 'post',
    body:    JSON.stringify({rawtx: txRaw}),
    headers: { 'Content-Type': 'application/json' }}
  ).then(data => data.json());

async function main() {
  const keychain = new Keychain();
  const selectedKey = await keychain.selectKey();

  const tx = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
  const unspents = await fetchUnspents(txParams.from);

  const fundValue = new BigNumber(String(txParams.amount)).multipliedBy(1e8).integerValue().toNumber();
  const totalUnspent = unspents.reduce((summ, { satoshis }) => summ + satoshis, 0);
  const skipValue = totalUnspent - fundValue - txParams.feeValue;

  unspents.forEach(({ txid, vout }) => tx.addInput(txid, vout, 0xfffffffe));
  tx.addOutput(txParams.to, fundValue);

  if (skipValue > 546) {
    tx.addOutput(txParams.from, skipValue)
  }

  const txRaw = tx.buildIncomplete();
  unspents.forEach(({ scriptPubKey }, index) => txRaw.ins[index].script = Buffer.from(scriptPubKey, 'hex'));
  const rawHex = await keychain.signTrx(
    txRaw.toHex(),
    selectedKey,
    'bitcoin'
  );
  console.log('rawHex: ', rawHex);
  // uncomment to broadcast the transaction
  // const broadcastResult = await broadcastTx(rawHex);
  // console.log('broadcastResult: ', broadcastResult);
  // console.log('broadcastResult: ', `https://test-insight.bitpay.com/tx/${broadcastResult.txid}`);
}

main();
