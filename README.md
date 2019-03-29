

[![npm version](https://badge.fury.io/js/keychain.js.svg)](https://badge.fury.io/js/keychain.js)
[![](https://data.jsdelivr.com/v1/package/npm/keychain.js/badge)](https://www.jsdelivr.com/package/npm/keychain.js)

* `keychain.js` - Keychain class with ws connection initialization
* `index.js` - override `web3.eth.accounts.signTransaction` method 
* `test.js` - example usage together (`keychain` + `web3`) 

**Usage**

* Sign ethereum transaction 
```javascript
const { Keychain, keychainWeb3 } = require('keychain.js');
const Web3 = require('web3');
const API_KEY = 'https://ropsten.infura.io/v3/YOUR_ID';
const web3 = new Web3(new Web3.providers.HttpProvider(API_KEY));
const transactionParams = {
  to: '0xE8899BA12578d60e4D0683a596EDaCbC85eC18CC',
  value: 100,
  gas: 21000
};
// now we are using web3 with keychain
web3.eth.accounts.signTransaction = keychainWeb3.signTransaction.bind(web3);
const keychain = new Keychain();
keychain.selectKey()
  .then(publicKey => web3.eth.accounts.signTransaction(transactionParams, publicKey));
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
