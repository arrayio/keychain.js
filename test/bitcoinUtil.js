const assert = require('assert');
const bitcoinUtil = require('../lib/bitcoinUtil');

describe('bitcoin util', () => {
  it('has first byte equal to 03', () => {
    const publicKey = Buffer.from('08d6770d8219923fe25a4d6aeb2c171253d5de3bc225f09dbfb2cb93ed837be1a80fdd3af5046b8f1f5412e5b321dcc3c25be9f4dd285250421ea55071794277', 'hex');
    const firstByte = bitcoinUtil.compressPublicKey(publicKey).readInt8(0);
    assert.strictEqual(firstByte, 3);
  });

  it('has first byte equal to 02', () => {
    const publicKey = Buffer.from('9f50f51d63b345039a290c94bffd3180c99ed659ff6ea6b1242bca47eb93b59f36a13e1e9d3e9bad0187bf307ccf24b1273419a8fa011c9191b8b5eae8674c00', 'hex');
    const firstByte = bitcoinUtil.compressPublicKey(publicKey).readInt8(0);
    assert.strictEqual(firstByte, 2);
  });
});
