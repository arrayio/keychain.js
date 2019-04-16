const bitcoin = require('bitcoinjs-lib');

const compressPublicKey = publicKey => {
  const lastByte = publicKey.readInt8(publicKey.length-1);
  const odd = (lastByte & 1) === 1;
  const buf = publicKey.slice(0, 32);
  const firstByte = odd ? 3 : 2;
  return Buffer.concat([Buffer.from([firstByte]), buf], 33);
};

const getDefaultScript = publicKey => {
  const publicKeyBuffer = compressPublicKey(publicKey);
  const pubKeyHash = bitcoin.crypto.hash160(publicKeyBuffer);
  return bitcoin.script.compile([
    bitcoin.opcodes.OP_DUP,
    bitcoin.opcodes.OP_HASH160,
    pubKeyHash,
    bitcoin.opcodes.OP_EQUALVERIFY,
    bitcoin.opcodes.OP_CHECKSIG
  ]);
};

module.exports = { compressPublicKey, getDefaultScript } ;

