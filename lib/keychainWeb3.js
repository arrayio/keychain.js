const EthereumTx = require('ethereumjs-tx');
const pubToAddress = require('ethereumjs-util').pubToAddress;

class KeychainWeb3 {
  constructor(keychain, web3) {
    this.keychain = keychain;
    this.web3 = web3;
  }

  static rsv (signature, chainId) {
    const ret = {};
    ret.r = `0x${signature.slice(0, 64)}`;
    ret.s = `0x${signature.slice(64, 128)}`;
    const recovery = parseInt(signature.slice(128, 130), 16);
    let tmpV = recovery + 27;
    if (chainId > 0) {
      tmpV += chainId * 2 + 8;
    }
    let hexString = tmpV.toString(16);
    if (hexString.length % 2) {
      hexString = '0' + hexString;
    }
    ret.v = `0x${hexString}`;
    return ret;
  };

  async sign(data, publicKey) {
    const prefix = "\x19Ethereum Signed Message:\n" + data.length;
    const messageHash = this.web3.utils.sha3(prefix + data).substr(2);

    const signature = await this.keychain.signHash(messageHash, publicKey);
    const ret = KeychainWeb3.rsv(signature, 0);
    const signatureAdapted = signature.slice(0, -2) + ret.v.slice(2); // replace the last two chars with v to get the same result as web3 returns
    return {
      message: data,
      messageHash: '0x' + messageHash,
      v: ret.v,
      r: ret.r,
      s: ret.s,
      signature: '0x' + signatureAdapted
    };
  }

  async signTransaction(txParams, publicKey) {
    if (!txParams.chainId) {
      txParams.chainId = await this.web3.eth.net.getId();
    }
    if (!txParams.nonce) {
      const address = '0x' + pubToAddress('0x' + publicKey).toString('hex');
      txParams.nonce = await this.web3.eth.getTransactionCount(address);
    }
    if (!txParams.gasPrice) {
      txParams.gasPrice = await this.web3.eth.getGasPrice();
    }
    txParams.value = Number(txParams.value);
    txParams.gasPrice = Number(txParams.gasPrice);

    const buildTxSinature = async (txParams) => {
      const rsv = {r: '0x00', s: '0x00', v: txParams.chainId};
      const tx = Object.assign({}, txParams, rsv); // {...txParams, ...rsv};
      const ethTx = new EthereumTx(tx);
      const buffer = ethTx.serialize();
      const rawTransaction = buffer.toString('hex');
      const messageHash = ethTx.hash().toString('hex');
      return { hex: rawTransaction,  messageHash } ;
    };

    const buildRawTransaction = async (txParams) => {
      const tx = new EthereumTx(txParams);
      const buffer = tx.serialize();
      return buffer.toString('hex');
    };

    const result = await buildTxSinature(txParams);
    const rawHex = result.hex;
    const messageHash = '0x' + result.messageHash;
    const signedTrx = await this.keychain.signTrx(rawHex, publicKey, 'ethereum');
    const ret = KeychainWeb3.rsv(signedTrx, txParams.chainId);
    let rawParams = Object.assign({}, txParams, ret);

    const raw = await buildRawTransaction(rawParams);
    const rawTransaction = `0x${raw}`;

    return {
      messageHash,
      v: ret.v,
      r: ret.r,
      s: ret.s,
      rawTransaction
    };
  }
}

module.exports = KeychainWeb3;
