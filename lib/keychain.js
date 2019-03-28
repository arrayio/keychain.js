const WebSocket = require('websocket').w3cwebsocket;

class Keychain {
  constructor(url) {
    if (!url) {
      url = 'ws://localhost:16384/';
    }
    this.ws = new WebSocket(url);
    const parent = this;
    this.ws.onmessage = function(response) {
      try {
        const res = JSON.parse(response.data);
        parent.queue.shift()(res);
      } catch (e) {
        console.log('response.data: ', response.data);
        console.log('Error: ', e);
      }
    };
    this.queue = [];
  }

  waitForSocketConnection(socket, callback) {
    const parent = this;
    setTimeout(function () {
        if (socket.readyState === 1) {
          return callback();
        }
        parent.waitForSocketConnection(socket, callback);
      }, 5);
  }

  sendCommand(request, callback) {
    this.ws.send(JSON.stringify(request));
    this.queue.push(callback);
  };

  command(request, callback) {
    const parent = this;
    if (this.ws.readyState === 0) {
      this.waitForSocketConnection(this.ws, function() {
        parent.sendCommand(request, callback);
      });
    } else {
      this.sendCommand(request, callback);
    }
  };

  /** Promise implementation of 'command' method */
  method(request) {
    const _parent = this;
    return new Promise(function(resolve, reject) {
      _parent.command(request, function(response) {
        if (response.error) {
          reject(response.error);
        }
        resolve(response.result);
      });
    });
  };

  signTrx(rawTransactionHex, publicKey, blockchainType) {
    return this.method({
      command: 'sign_trx',
      params: {
        transaction: rawTransactionHex,
        blockchain_type: blockchainType,
        public_key: publicKey
      }
    });
  }

  signHash(hash, publicKey) {
    return this.method({
      command: 'sign_hash',
      params: {
        hash,
        public_key: publicKey
      }
    });
  }

  selectKey() {
    return this.method({ command: 'select_key' });
  }

  unlock(publicKey, unlockTime) {
    return this.method({
      command: "unlock",
      params: {
        public_key: publicKey,
        unlock_time: unlockTime
      }
    });
  }

  lock() {
    return this.method({command: "lock"});
  }

  version() {
    return this.method({command: "version"});
  }

  about() {
    return this.method({command: "about"});
  }

}

module.exports = Keychain;
