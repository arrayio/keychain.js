

[![npm version](https://badge.fury.io/js/web3override.svg)](https://badge.fury.io/js/web3override)

* `bitcoin.js` - extend `bitcoinjs-lib` with keychain related methods `prepareTx`, `buildTxKeychain`
* `keychain.js` - Keychain class with ws connection initialization
* `index.js` - override `web3.eth.accounts.signTransaction` method 
* `test.js` - example usage together (`keychain` + `web3`) 

**Usage**

* Sign ethereum transaction 
```javascript

  import { web3Override, Keychain } from 'web3override'

  // create new key in Keychain
  const keyInstance = await Keychain.create();
   
  const data = await keyInstance.selectKey();
  const key = data.result;
  await keyInstance.term();
  web3.eth.accounts.signTransaction = web3Override(web3).signTransaction;

  // now we use web3 with keychain
  await web3.eth.accounts.signTransaction(transactionParams, key); // overriden web3 function usage
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