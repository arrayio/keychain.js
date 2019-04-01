const { Keychain, KeychainWeb3 } = require('../lib'); // require('keychain.js') if you run it outside of keychain.js repository
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
  // uncomment to broadcast the transaction
//  .then(result => web3.eth.sendSignedTransaction(result.rawTransaction)
//     .on('transactionHash', (hash) => {
//       const txId = `https://ropsten.etherscan.io/tx/${hash}`;
//       console.log('tx', txId);
//     })
//     .on('error', (err) => {
//       console.error(err)
//     })
// );
