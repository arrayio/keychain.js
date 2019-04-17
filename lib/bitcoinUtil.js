const compressPublicKey = publicKey => {
  const lastByte = publicKey.readInt8(publicKey.length-1);
  const odd = (lastByte & 1) === 1;
  const buf = publicKey.slice(0, 32);
  const firstByte = odd ? 3 : 2;
  return Buffer.concat([Buffer.from([firstByte]), buf], 33);
};

module.exports = { compressPublicKey } ;

