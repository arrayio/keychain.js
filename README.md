

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
  // import library
  import { bitcoin, Keychain } from 'web3override';

  // tx - bitcoin.TransactionBuilder instance with inputs & outputs
  const keyInstance = await Keychain.create();
  const data = await keyInstance.selectKey();
  const publicKey = data.result;
  tx.inputs.forEach((input, index) => {
    tx.prepareTx(index,  publicKey)
  });
  const txRawHex = await tx.buildTxKeychain(keyInstance, publicKey);

```

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
