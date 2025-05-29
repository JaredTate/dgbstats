# Server-Side RPC Error Debugging Guide

## Error: getrawtransaction Request failed with status code 500

### Problem
The server is getting a 500 error when calling `getrawtransaction` for transaction:
`48e685d7e8905ec0bc7542d5d1df9923adb2577550a084c580573d852c2e54d3`

### Possible Causes and Solutions

#### 1. Transaction Not in Mempool
If the transaction has been confirmed in a block, `getrawtransaction` will fail unless:
- The DigiByte node is running with `-txindex=1` flag
- OR you provide the blockhash parameter

**Solution**: Check if transaction is in mempool first:
```javascript
try {
  // First try to get from mempool
  const rawTx = await rpc.command('getrawtransaction', [txid, true]);
  return rawTx;
} catch (error) {
  // If not in mempool, try to find which block it's in
  try {
    // This requires -txindex=1
    const txInfo = await rpc.command('gettransaction', [txid]);
    if (txInfo.blockhash) {
      // Now get the raw transaction with blockhash
      const rawTx = await rpc.command('getrawtransaction', [txid, true, txInfo.blockhash]);
      return rawTx;
    }
  } catch (e) {
    console.error('Transaction not found:', txid);
    throw e;
  }
}
```

#### 2. Incorrect RPC Parameters
Make sure the RPC call includes the correct parameters:

```javascript
// For mempool transactions (returns raw hex by default)
const rawHex = await rpc.command('getrawtransaction', [txid]);

// For decoded transaction data (what you probably want)
const decodedTx = await rpc.command('getrawtransaction', [txid, true]);

// For confirmed transactions (with blockhash)
const decodedTx = await rpc.command('getrawtransaction', [txid, true, blockhash]);
```

#### 3. Node Configuration Issues
The DigiByte node might not have transaction indexing enabled.

**Check node configuration**:
```bash
# In digibyte.conf
txindex=1
```

**Or start node with**:
```bash
digibyted -txindex=1
```

Note: If you enable txindex on an existing node, you'll need to reindex:
```bash
digibyted -reindex -txindex=1
```

### Recommended Implementation

```javascript
async function getTransaction(txid) {
  try {
    // Try to get transaction with full details
    const tx = await rpc.command('getrawtransaction', [txid, true]);
    return tx;
  } catch (error) {
    if (error.code === -5) {
      // Transaction not in mempool, might be confirmed
      console.log(`Transaction ${txid} not in mempool, checking if confirmed...`);
      
      // Option 1: If you have txindex enabled
      throw new Error('Transaction not found. Enable txindex on your node.');
      
      // Option 2: Return null and handle differently
      return null;
    }
    throw error;
  }
}

// For mempool monitoring, only get transactions actually in mempool
async function getMempoolTransactions() {
  try {
    // Get all mempool tx ids
    const mempoolTxIds = await rpc.command('getrawmempool', [false]);
    
    // Get details for each transaction
    const transactions = [];
    for (const txid of mempoolTxIds) {
      try {
        const tx = await rpc.command('getrawtransaction', [txid, true]);
        transactions.push(tx);
      } catch (e) {
        console.error(`Failed to get transaction ${txid}:`, e.message);
        // Skip this transaction
      }
    }
    
    return transactions;
  } catch (error) {
    console.error('Failed to get mempool:', error);
    throw error;
  }
}
```

### Testing the RPC Call

You can test directly with the DigiByte CLI:

```bash
# Test if transaction is in mempool
digibyte-cli getrawmempool | grep 48e685d7e8905ec0bc7542d5d1df9923adb2577550a084c580573d852c2e54d3

# Get raw transaction (hex)
digibyte-cli getrawtransaction 48e685d7e8905ec0bc7542d5d1df9923adb2577550a084c580573d852c2e54d3

# Get decoded transaction
digibyte-cli getrawtransaction 48e685d7e8905ec0bc7542d5d1df9923adb2577550a084c580573d852c2e54d3 true

# If you know the blockhash
digibyte-cli getrawtransaction 48e685d7e8905ec0bc7542d5d1df9923adb2577550a084c580573d852c2e54d3 true <blockhash>
```

### Error Codes Reference

- `-5`: Transaction not in mempool (might be confirmed or doesn't exist)
- `-8`: Invalid parameter
- `-32700`: Parse error
- `500`: Internal server error (check RPC connection)

### Logging for Debugging

Add detailed logging to help debug:

```javascript
console.log('Attempting to fetch transaction:', txid);
console.log('RPC method: getrawtransaction');
console.log('Parameters:', [txid, true]);

try {
  const result = await rpc.command('getrawtransaction', [txid, true]);
  console.log('Transaction found successfully');
  return result;
} catch (error) {
  console.error('RPC Error Details:');
  console.error('- Code:', error.code);
  console.error('- Message:', error.message);
  console.error('- Full error:', error);
  throw error;
}
```