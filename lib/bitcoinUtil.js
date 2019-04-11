const compressPublicKey = publicKey => {
  const lastByte = publicKey.readInt8(publicKey.length-1);
  const odd = (lastByte & 1) === 1;
  const buf = publicKey.slice(0, 32);
  buf.writeInt8(odd ? 3 : 2, 0);
  return buf;
};

module.exports.compressPublicKey = compressPublicKey;

