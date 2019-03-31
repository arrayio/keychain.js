const { Keychain, keychainWeb3 } = require('../lib'); // require('keychain.js') if you run it outside of keychain.js repository
const Web3 = require('web3');
const API_URL = 'YOUR_API_URL'; // https://ropsten.infura.io/v3/046804e3dd3240b09834531326f310cf
const web3 = new Web3(new Web3.providers.HttpProvider(API_URL));
const transactionParams = {
  to: '0xE8899BA12578d60e4D0683a596EDaCbC85eC18CC',
  value: 100,
  gas: 21000
};
// now we are using web3 with keychain
web3.eth.accounts.signTransaction = keychainWeb3.signTransaction.bind(web3);
const keychain = new Keychain();
keychain.selectKey()
  .then(publicKey => web3.eth.accounts.signTransaction(transactionParams, publicKey))
  // uncomment to broadcast the transaction
  // .then(result =>
  //   web3.eth.sendSignedTransaction(result.rawTransaction)
  //     .on('transactionHash', (hash) => {
  //       const txId = `https://ropsten.etherscan.io/tx/${hash}`;
  //       console.log('tx', txId);
  //     })
  //     .on('error', (err) => {
  //       console.error(err)
  //     })
  // );
