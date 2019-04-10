const { spawn } = require('child_process');
const path = require('path');

class Keychain {
  constructor() {
    this.keychain = spawn(path.join(__dirname, 'keychain'), ['test_run']);
    const parent = this;
    this.keychain.stdout.on('data', data => {
      try {
        const res = JSON.parse(data);
        parent.queue.shift()(res);
      } catch (e) {
        console.log('response.data: ', response.data);
        console.log('Error: ', e);
      }
    });
    this.queue = [];
  }

  sendCommand(request, callback) {
    this.keychain.stdin.write(JSON.stringify(request));
    this.queue.push(callback)
  };

  command(request, callback) {
      this.sendCommand(request, callback);
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
