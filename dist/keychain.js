(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{"websocket":3}],2:[function(require,module,exports){
window.Keychain = require('../keychain.js');

},{"../keychain.js":1}],3:[function(require,module,exports){
var _global = (function() { return this; })();
var NativeWebSocket = _global.WebSocket || _global.MozWebSocket;
var websocket_version = require('./version');


/**
 * Expose a W3C WebSocket class with just one or two arguments.
 */
function W3CWebSocket(uri, protocols) {
	var native_instance;

	if (protocols) {
		native_instance = new NativeWebSocket(uri, protocols);
	}
	else {
		native_instance = new NativeWebSocket(uri);
	}

	/**
	 * 'native_instance' is an instance of nativeWebSocket (the browser's WebSocket
	 * class). Since it is an Object it will be returned as it is when creating an
	 * instance of W3CWebSocket via 'new W3CWebSocket()'.
	 *
	 * ECMAScript 5: http://bclary.com/2004/11/07/#a-13.2.2
	 */
	return native_instance;
}
if (NativeWebSocket) {
	['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'].forEach(function(prop) {
		Object.defineProperty(W3CWebSocket, prop, {
			get: function() { return NativeWebSocket[prop]; }
		});
	});
}

/**
 * Module exports.
 */
module.exports = {
    'w3cwebsocket' : NativeWebSocket ? W3CWebSocket : null,
    'version'      : websocket_version
};

},{"./version":4}],4:[function(require,module,exports){
module.exports = require('../package.json').version;

},{"../package.json":5}],5:[function(require,module,exports){
module.exports={
  "_from": "websocket@^1.0.28",
  "_id": "websocket@1.0.28",
  "_inBundle": false,
  "_integrity": "sha512-00y/20/80P7H4bCYkzuuvvfDvh+dgtXi5kzDf3UcZwN6boTYaKvsrtZ5lIYm1Gsg48siMErd9M4zjSYfYFHTrA==",
  "_location": "/websocket",
  "_phantomChildren": {},
  "_requested": {
    "type": "range",
    "registry": true,
    "raw": "websocket@^1.0.28",
    "name": "websocket",
    "escapedName": "websocket",
    "rawSpec": "^1.0.28",
    "saveSpec": null,
    "fetchSpec": "^1.0.28"
  },
  "_requiredBy": [
    "/"
  ],
  "_resolved": "https://registry.npmjs.org/websocket/-/websocket-1.0.28.tgz",
  "_shasum": "9e5f6fdc8a3fe01d4422647ef93abdd8d45a78d3",
  "_spec": "websocket@^1.0.28",
  "_where": "/Users/pidgin/projects/keychain.js",
  "author": {
    "name": "Brian McKelvey",
    "email": "theturtle32@gmail.com",
    "url": "https://github.com/theturtle32"
  },
  "browser": "lib/browser.js",
  "bugs": {
    "url": "https://github.com/theturtle32/WebSocket-Node/issues"
  },
  "bundleDependencies": false,
  "config": {
    "verbose": false
  },
  "contributors": [
    {
      "name": "Iñaki Baz Castillo",
      "email": "ibc@aliax.net",
      "url": "http://dev.sipdoc.net"
    }
  ],
  "dependencies": {
    "debug": "^2.2.0",
    "nan": "^2.11.0",
    "typedarray-to-buffer": "^3.1.5",
    "yaeti": "^0.0.6"
  },
  "deprecated": false,
  "description": "Websocket Client & Server Library implementing the WebSocket protocol as specified in RFC 6455.",
  "devDependencies": {
    "buffer-equal": "^1.0.0",
    "faucet": "^0.0.1",
    "gulp": "git+https://github.com/gulpjs/gulp.git#4.0",
    "gulp-jshint": "^2.0.4",
    "jshint": "^2.0.0",
    "jshint-stylish": "^2.2.1",
    "tape": "^4.9.1"
  },
  "directories": {
    "lib": "./lib"
  },
  "engines": {
    "node": ">=0.10.0"
  },
  "homepage": "https://github.com/theturtle32/WebSocket-Node",
  "keywords": [
    "websocket",
    "websockets",
    "socket",
    "networking",
    "comet",
    "push",
    "RFC-6455",
    "realtime",
    "server",
    "client"
  ],
  "license": "Apache-2.0",
  "main": "index",
  "name": "websocket",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/theturtle32/WebSocket-Node.git"
  },
  "scripts": {
    "gulp": "gulp",
    "install": "(node-gyp rebuild 2> builderror.log) || (exit 0)",
    "test": "faucet test/unit"
  },
  "version": "1.0.28"
}

},{}]},{},[2]);
