const util = require('ethereumjs-util');
const secp256k1 = require('secp256k1');
const privateKey = Buffer.from('9f50f51d63b345039a290c94bffd3180c99ed659ff6ea6b1242bca47eb93b59f', 'hex');
const publicKeyUtil = util.privateToPublic(privateKey).toString('hex');
console.log(publicKeyUtil);
const publicKey = secp256k1.publicKeyCreate(privateKey, false).slice(1).toString('hex');
console.log(publicKey);
