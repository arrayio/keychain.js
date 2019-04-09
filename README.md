

[![npm version](https://badge.fury.io/js/keychain.js.svg)](https://badge.fury.io/js/keychain.js)

* `keychain.js` - Keychain class for working with the KeyChain WebSocket
* `keychainWeb3.js` - KeychainWeb3 class with methods `sign` and `singTransaction` for substituting `web3.eth.accounts.sign` and `web3.eth.accounts.signTransaction` methods

**Usage**

* Sign ethereum transaction 
```javascript
const { Keychain, KeychainWeb3 } = require('keychain.js');
const Web3 = require('web3');
const web3 = new Web3('YOUR_API_URL'); // https://ropsten.infura.io/v3/046804e3dd3240b09834531326f310cf
const tx = {
  to: '0xE8899BA12578d60e4D0683a596EDaCbC85eC18CC',
  value: 100,
  gas: 21000
};
const keychain = new Keychain();
const keychainWeb3 = new KeychainWeb3(keychain, web3);
keychain.selectKey()
  .then(publicKey => keychainWeb3.signTransaction(tx, publicKey))
  .then(result => web3.eth.sendSignedTransaction(result.rawTransaction));
```

* Sign & build ready for broadcast bitcoin transaction 

```javascript
const { Keychain } = require('keychain.js');
const bitcoin = require ('bitcoinjs-lib');
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
// add input scripts to an unsigned transaction https://github.com/bitcoinjs/bitcoinjs-lib/issues/1011#issuecomment-368394185
unspents.forEach(({ scriptPubKey }, index) => txRaw.ins[index].script = Buffer.from(scriptPubKey, 'hex'));
const rawHex = await keychain.signTrx(
  txRaw.toHex(),
  publicKey,
  'bitcoin'
);
// broadcast rawHex transaction
```
Full example of signing and broadcasting bitcoin transaction can be found in [example/signBTC.js](example/signBTC.js)

**Run tests**

```
npm run test
```
Add key to your `key_data`:
```
keyname: test1@76de427d42c38be4
password: qwe
```

![alt image](https://raw.githubusercontent.com/cypherpunk99/web3override/master/screencast.gif)

*TODO bitcoin tests*
