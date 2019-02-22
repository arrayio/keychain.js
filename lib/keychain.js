const W3CWebSocket = require('websocket').w3cwebsocket;
const WebSocketAsPromised = require('websocket-as-promised');

class Keychain {
  constructor() {
    this.wsp = new WebSocketAsPromised('ws://localhost:16384/', {
      createWebSocket: url => new W3CWebSocket(url)
    });
    this.wsp.onMessage.addListener((response) => {
      const call = this.queue.shift();
      call(JSON.parse(response));
    });
    this.queue = [];
  }

  async initialize() {
    await this.wsp.open();
  }

  async term() {
    await this.wsp.close();
  }

  static async create() {
    const keychainInstance = new Keychain();
    await keychainInstance.initialize();
    return keychainInstance;
  }

  method(request) {
    return new Promise((resolve, reject) => {
      this.queue.push(resolve);
      this.wsp.send(JSON.stringify(request));
    });
  };

  signHex(data, publicKey, blockchainType) {
    const params = {
      transaction: data,
      blockchain_type: blockchainType,
      public_key: publicKey
    };
    return this.method({
      command: 'sign_hex',
      params
    });
  }

  signHash(hash, publicKey) {
    const params = {
      hash,
      public_key: publicKey
    };
    return this.method({
      command: 'sign_hash',
      params
    });
  }

  selectKey() {
    return this.method({ command: 'select_key' });
  }

}

module.exports = Keychain;
