var bitcoin = require('bitcoinjs-lib');
const Keychain = require('./keychain');
var Buffer = require('safe-buffer').Buffer

var EMPTY_SCRIPT = Buffer.allocUnsafe(0)

var scriptTypes = {
  MULTISIG: 'multisig',
  NONSTANDARD: 'nonstandard',
  NULLDATA: 'nulldata',
  P2PK: 'pubkey',
  P2PKH: 'pubkeyhash',
  P2SH: 'scripthash',
  P2WPKH: 'witnesspubkeyhash',
  P2WSH: 'witnessscripthash',
  WITNESS_COMMITMENT: 'witnesscommitment'
}

function canSign (input) {
  return input.prevOutScript !== undefined &&
    input.signScript !== undefined &&
    input.pubKeys !== undefined &&
    input.signatures !== undefined &&
    input.signatures.length === input.pubKeys.length &&
    input.pubKeys.length > 0 &&
    (
      input.witness === false ||
      (input.witness === true && input.value !== undefined)
    )
}


function prepareInput (input, kpPubKey, redeemScript, witnessValue, witnessScript) {
  // console.log('prepareInput input ', input, kpPubKey, redeemScript, witnessValue, witnessScript);
  var expanded
  var prevOutType
  var prevOutScript

  var p2sh = false
  var p2shType
  var redeemScriptHash

  var witness = false
  var p2wsh = false
  var witnessType
  var witnessScriptHash

  var signType
  var signScript

  if (redeemScript && witnessScript) {
    redeemScriptHash = bitcoin.crypto.hash160(redeemScript)
    witnessScriptHash = bitcoin.crypto.sha256(witnessScript)
    checkP2SHInput(input, redeemScriptHash)

    if (!redeemScript.equals(bitcoin.templates.witnessScriptHash.output.encode(witnessScriptHash))) throw new Error('Witness script inconsistent with redeem script')

    expanded = expandOutput(witnessScript, undefined, kpPubKey)
    if (!expanded.pubKeys) throw new Error('WitnessScript not supported "' + bitcoin.script.toASM(redeemScript) + '"')

    prevOutType = bitcoin.templates.types.P2SH
    prevOutScript = bitcoin.templates.scriptHash.output.encode(redeemScriptHash)
    p2sh = witness = p2wsh = true
    p2shType = bitcoin.templates.types.P2WSH
    signType = witnessType = expanded.scriptType
    signScript = witnessScript
  } else if (redeemScript) {
    redeemScriptHash = bitcoin.crypto.hash160(redeemScript)
    checkP2SHInput(input, redeemScriptHash)

    expanded = expandOutput(redeemScript, undefined, kpPubKey)
    if (!expanded.pubKeys) throw new Error('RedeemScript not supported "' + bitcoin.script.toASM(redeemScript) + '"')

    prevOutType = bitcoin.templates.types.P2SH
    prevOutScript = bitcoin.templates.scriptHash.output.encode(redeemScriptHash)
    p2sh = true
    signType = p2shType = expanded.scriptType
    signScript = redeemScript
    witness = signType === bitcoin.templates.types.P2WPKH
  } else if (witnessScript) {
    witnessScriptHash = bitcoin.crypto.sha256(witnessScript) // first sha256
    checkP2WSHInput(input, witnessScriptHash)

    expanded = expandOutput(witnessScript, undefined, kpPubKey)
    if (!expanded.pubKeys) throw new Error('WitnessScript not supported "' + bitcoin.script.toASM(redeemScript) + '"')

    prevOutType = bitcoin.templates.types.P2WSH
    prevOutScript = bitcoin.templates.witnessScriptHash.output.encode(witnessScriptHash)
    witness = p2wsh = true
    signType = witnessType = expanded.scriptType
    signScript = witnessScript
  } else if (input.prevOutType) {
    
    // embedded scripts are not possible without a redeemScript
    if (input.prevOutType === scriptTypes.P2SH ||
      input.prevOutType === scriptTypes.P2WSH) {
      throw new Error('PrevOutScript is ' + input.prevOutType + ', requires redeemScript')
    }

    prevOutType = input.prevOutType
    prevOutScript = input.prevOutScript
    expanded = expandOutput(input.prevOutScript, input.prevOutType, kpPubKey)
    if (!expanded.pubKeys) return

    witness = (input.prevOutType === scriptTypes.P2WPKH)
    signType = prevOutType
    signScript = prevOutScript
  } else {
    // console.log('kpPubKey ', kpPubKey);
    // prevOutScript = bitcoin.templates.pubKeyHash.output.encode(bcrypto.hash160(kpPubKey))
    prevOutScript = bitcoin.script.compile([
      bitcoin.opcodes.OP_DUP,
      bitcoin.opcodes.OP_HASH160,
      bitcoin.crypto.hash160(kpPubKey),
      bitcoin.opcodes.OP_EQUALVERIFY,
      bitcoin.opcodes.OP_CHECKSIG
    ])
  
    // console.log('else prevOutScript> ', Buffer.from(prevOutScript).toString('hex'))
    expanded = expandOutput(prevOutScript, scriptTypes.P2PKH, kpPubKey)

    prevOutType = scriptTypes.P2PKH
    witness = false
    signType = prevOutType
    signScript = prevOutScript
  }

  if (signType === scriptTypes.P2WPKH) {
    // signScript = bitcoin.templates.pubKeyHash.output.encode(bitcoin.templates.witnessPubKeyHash.output.decode(signScript))

    signScript = bitcoin.script.compile([
      bitcoin.opcodes.OP_DUP,
      bitcoin.opcodes.OP_HASH160,
      signScript.slice(2),
      bitcoin.opcodes.OP_EQUALVERIFY,
      bitcoin.opcodes.OP_CHECKSIG
    ])

  }

  if (p2sh) {
    input.redeemScript = redeemScript
    input.redeemScriptType = p2shType
  }

  if (p2wsh) {
    input.witnessScript = witnessScript
    input.witnessScriptType = witnessType
  }

  input.pubKeys = expanded.pubKeys
  input.signatures = expanded.signatures
  input.signScript = signScript
  input.signType = signType
  input.prevOutScript = prevOutScript
  input.prevOutType = prevOutType
  input.witness = witness

  // console.log('prepareInput ', input);
}

function expandOutput (script, scriptType, ourPubKey) {
 

  var scriptChunks = bitcoin.script.decompile(script)
  if (!scriptType) {
    scriptType = bitcoin.templates.classifyOutput(script)
  }

  var pubKeys = []

  switch (scriptType) {
    // does our hash160(pubKey) match the output scripts?
    case scriptTypes.P2PKH:
      if (!ourPubKey) break

      var pkh1 = scriptChunks[2]
      var pkh2 = bitcoin.crypto.hash160(ourPubKey)
      if (pkh1.equals(pkh2)) pubKeys = [ourPubKey]
      break

    // does our hash160(pubKey) match the output scripts?
    case scriptTypes.P2WPKH:
      if (!ourPubKey) break

      var wpkh1 = scriptChunks[1]
      var wpkh2 = bitcoin.crypto.hash160(ourPubKey)
      if (wpkh1.equals(wpkh2)) pubKeys = [ourPubKey]
      break

    case scriptTypes.P2PK:
      pubKeys = scriptChunks.slice(0, 1)
      break

    case scriptTypes.MULTISIG:
      pubKeys = scriptChunks.slice(1, -2)
      break

    default: return { scriptType: scriptType }
  }

  return {
    pubKeys: pubKeys,
    scriptType: scriptType,
    signatures: pubKeys.map(function () { return undefined })
  }
}

bitcoin.TransactionBuilder.prototype.prepareTx = function (vin, kpPubKey, redeemScript, hashType, witnessValue, witnessScript) {
  // transform

  kpPubKey = Buffer.from('03' + kpPubKey.slice(0, 64), 'hex');

  // console.log("---- sign ------");

  // TODO: remove keyPair.network matching in 4.0.0
  // if (keyPair.network && keyPair.network !== this.network) throw new TypeError('Inconsistent network')
  if (!this.inputs[vin]) throw new Error('No input at index: ' + vin)
  hashType = hashType || bitcoin.Transaction.SIGHASH_ALL

  var input = this.inputs[vin]

  // console.log('--->>> input before --< ', input);

  // if redeemScript was previously provided, enforce consistency
  if (input.redeemScript !== undefined &&
      redeemScript &&
      !input.redeemScript.equals(redeemScript)) {
    throw new Error('Inconsistent redeemScript')
  }

  // var kpPubKey = keyPair.publicKey || keyPair.getPublicKeyBuffer()
  if (!canSign(input)) {
    if (witnessValue !== undefined) {
      if (input.value !== undefined && input.value !== witnessValue) throw new Error('Input didn\'t match witnessValue')
      typeforce(types.Satoshi, witnessValue)
      input.value = witnessValue
    }

    if (!canSign(input)) prepareInput(input, kpPubKey, redeemScript, witnessValue, witnessScript) // first sha256 and got signScript
    if (!canSign(input)) throw Error(input.prevOutType + ' not supported')
  }
}


bitcoin.TransactionBuilder.prototype.buildTxKeychain = async function (keyInstance, publicKey) {
 
    // this.tx.prepareTxKeychain(this.inputs, bitcoin.Transaction.SIGHASH_ALL);
  var txTmp = this.tx.clone()
  const hashType = bitcoin.Transaction.SIGHASH_ALL;

  this.inputs.forEach((input, inIndex) => {
    const prevOutScript = input.signScript;
    
    //
    var ourScript = bitcoin.script.compile(bitcoin.script.decompile(prevOutScript).filter(function (x) {
      return x !== bitcoin.opcodes.OP_CODESEPARATOR
    }))

    // console.log('bitcoin ourScript>', ourScript)
    // console.log('prepareTxKeychain ', this)
    

    // SIGHASH_NONE: ignore all outputs? (wildcard payee)
    if ((hashType & 0x1f) === bitcoin.Transaction.SIGHASH_NONE) {
      txTmp.outs = []

      // ignore sequence numbers (except at inIndex)
      txTmp.ins.forEach(function (input, i) {
        if (i === inIndex) return

        input.sequence = 0
      })

    // SIGHASH_SINGLE: ignore all outputs, except at the same index?
    } else if ((hashType & 0x1f) === bitcoin.Transaction.SIGHASH_SINGLE) {
      // https://github.com/bitcoin/bitcoin/blob/master/src/test/sighash_tests.cpp#L60
      if (inIndex >= this.outs.length) return ONE

      // truncate outputs after
      txTmp.outs.length = inIndex + 1

      // "blank" outputs before
      for (var i = 0; i < inIndex; i++) {
        txTmp.outs[i] = BLANK_OUTPUT
      }

      // ignore sequence numbers (except at inIndex)
      txTmp.ins.forEach(function (input, y) {
        if (y === inIndex) return

        input.sequence = 0
      })
    }

    // SIGHASH_ANYONECANPAY: ignore inputs entirely?
    if (hashType & bitcoin.Transaction.SIGHASH_ANYONECANPAY) {
      txTmp.ins = [txTmp.ins[inIndex]]
      txTmp.ins[0].script = ourScript

    // SIGHASH_ALL: only ignore input scripts
    } else {
      // "blank" others input scripts
      txTmp.ins.forEach(function (input) { input.script = EMPTY_SCRIPT })
      txTmp.ins[inIndex].script = ourScript
    }

  })

  var buffer = Buffer.allocUnsafe(txTmp.__byteLength(false) + 4)
  buffer.writeInt32LE(hashType, buffer.length - 4)
  txTmp.__toBuffer(buffer, 0, false)



  const bufferHex = Buffer.from(buffer).toString('hex');
  // console.log('in bufferHex', bufferHex)
  const res = await keyInstance.signHex(bufferHex, publicKey, 'bitcoin');
   
  await keyInstance.term();
  return res.result;   
}

 
module.exports = bitcoin;

