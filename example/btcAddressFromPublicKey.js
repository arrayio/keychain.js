const bitcoin = require ('bitcoinjs-lib');
const publicKey = '08d6770d8219923fe25a4d6aeb2c171253d5de3bc225f09dbfb2cb93ed837be1a80fdd3af5046b8f1f5412e5b321dcc3c25be9f4dd285250421ea55071794277'; // 08d6770d8219923fe25a4d6aeb2c171253d5de3bc225f09dbfb2cb93ed837be1a80fdd3af5046b8f1f5412e5b321dcc3c25be9f4dd285250421ea55071794277
const publicKeyCompressed = Buffer.from(`03${publicKey.substr(0, 64)}`, 'hex');
const keyPair = bitcoin.ECPair.fromPublicKeyBuffer(publicKeyCompressed, bitcoin.networks.testnet);
const address = keyPair.getAddress();
console.log('address: ', address);
