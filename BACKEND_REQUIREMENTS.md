# Backend Requirements for Enhanced TxsPage

This document outlines the backend WebSocket server requirements needed to support the enhanced TxsPage.js transaction explorer.

## WebSocket Message Types

### 1. Enhanced Mempool Data (`type: 'mempool'`)

When the frontend sends `{ type: 'requestMempool' }`, the backend should respond with:

```javascript
{
  type: 'mempool',
  data: {
    stats: {
      size: 1234,              // Number of transactions in mempool
      bytes: 2450000,          // Total size in bytes
      usage: 3450000,          // Memory usage in bytes
      maxmempool: 300000000,   // Max mempool size in bytes
      minfee: 0.00001,         // Minimum fee in DGB
      avgfee: 0.0001,          // Average fee in DGB
      totalfee: 1.234,         // Total fees in mempool (DGB) - NEW
      feeDistribution: {       // NEW: Fee distribution for visualization
        '0-10': 123,           // Transactions with 0-10 sat/byte
        '10-50': 456,          // Transactions with 10-50 sat/byte
        '50-100': 234,         // Transactions with 50-100 sat/byte
        '100-500': 89,         // Transactions with 100-500 sat/byte
        '500+': 12             // Transactions with 500+ sat/byte
      }
    },
    transactions: [
      {
        txid: 'abc123...',
        size: 250,                    // Size in bytes
        vsize: 250,                   // Virtual size (for SegWit)
        fee: 0.0001,                  // Fee in DGB
        value: 123.45678901,          // NEW: Total value transferred
        time: 1622505600,             // Unix timestamp (seconds)
        inputs: [
          {
            address: 'DGB1...',
            amount: 100,
            txid: 'prev1...',         // NEW: Previous tx reference
            vout: 0                   // NEW: Output index
          }
        ],
        outputs: [
          {
            address: 'DGB2...',
            amount: 99.9999,
            type: 'pubkeyhash'        // NEW: Output type
          }
        ],
        fee_rate: 40,                 // Satoshis per byte
        priority: 'medium',           // high/medium/low
        confirmations: 0,             // NEW: Always 0 for mempool
        descendantcount: 0,           // NEW: Descendant tx count
        descendantsize: 0,            // NEW: Total descendant size
        ancestorcount: 0,             // NEW: Ancestor tx count
        ancestorsize: 0               // NEW: Total ancestor size
      }
    ]
  }
}
```

### 2. Recent Confirmed Transactions (`type: 'recentTransactions'`)

This is a NEW message type for displaying individual confirmed transactions:

```javascript
{
  type: 'recentTransactions',
  data: [
    {
      txid: 'def456...',
      blockhash: 'block123...',
      blockheight: 20123456,
      blocktime: 1622505600,
      confirmations: 6,
      size: 225,
      vsize: 225,
      fee: 0.00005,
      value: 50.12345678,            // Total value transferred
      inputs: [...],                  // Same format as mempool
      outputs: [...],                 // Same format as mempool
      fee_rate: 22
    }
  ]
}
```

### 3. Real-time New Transaction (`type: 'newTransaction'`)

When a new transaction enters the mempool:

```javascript
{
  type: 'newTransaction',
  data: {
    // Full transaction object with same format as mempool transactions
  }
}
```

### 4. Transaction Confirmed (`type: 'confirmedTransaction'`)

NEW message type when a transaction is confirmed in a block:

```javascript
{
  type: 'confirmedTransaction',
  data: {
    txid: 'abc123...',
    blockhash: 'block456...',
    blockheight: 20123457,
    confirmations: 1,
    // Include full transaction data if available
    size: 250,
    vsize: 250,
    fee: 0.0001,
    value: 123.45678901,
    inputs: [...],
    outputs: [...],
    fee_rate: 40
  }
}
```

## RPC Implementation Guide

### Required RPC Commands

```javascript
// 1. Get mempool information
const mempoolInfo = await rpc.command('getmempoolinfo');

// 2. Get raw mempool with verbose details
const rawMempool = await rpc.command('getrawmempool', [true]);

// 3. For each transaction in mempool
for (const [txid, info] of Object.entries(rawMempool)) {
  // Get full transaction details
  const rawTx = await rpc.command('getrawtransaction', [txid, true]);
  
  // Get additional mempool entry info
  const mempoolEntry = await rpc.command('getmempoolentry', [txid]);
  
  // Process and combine data
}
```

### Data Processing

```javascript
// Calculate total value from outputs
const calculateTotalValue = (outputs) => {
  return outputs.reduce((sum, out) => sum + out.value, 0);
};

// Determine priority based on fee rate
const calculatePriority = (feeRate) => {
  if (feeRate >= 100) return 'high';
  if (feeRate >= 50) return 'medium';
  return 'low';
};

// Process input data
const processInput = (vin) => {
  return {
    address: vin.address || 'Unknown',
    amount: vin.value || 0,
    txid: vin.txid,
    vout: vin.vout
  };
};

// Process output data
const processOutput = (vout) => {
  return {
    address: vout.scriptPubKey?.addresses?.[0] || 'Unknown',
    amount: vout.value,
    type: vout.scriptPubKey?.type
  };
};

// Calculate fee distribution
const calculateFeeDistribution = (transactions) => {
  const distribution = {
    '0-10': 0,
    '10-50': 0,
    '50-100': 0,
    '100-500': 0,
    '500+': 0
  };
  
  transactions.forEach(tx => {
    const feeRate = tx.fee_rate;
    if (feeRate < 10) distribution['0-10']++;
    else if (feeRate < 50) distribution['10-50']++;
    else if (feeRate < 100) distribution['50-100']++;
    else if (feeRate < 500) distribution['100-500']++;
    else distribution['500+']++;
  });
  
  return distribution;
};
```

### WebSocket Server Implementation

```javascript
// Handle mempool request
ws.on('message', async (message) => {
  const msg = JSON.parse(message);
  
  if (msg.type === 'requestMempool') {
    try {
      // Get mempool info
      const mempoolInfo = await rpc.command('getmempoolinfo');
      
      // Get all mempool transactions
      const rawMempool = await rpc.command('getrawmempool', [true]);
      
      // Process transactions
      const transactions = [];
      let totalFee = 0;
      
      for (const [txid, info] of Object.entries(rawMempool)) {
        const rawTx = await rpc.command('getrawtransaction', [txid, true]);
        const mempoolEntry = await rpc.command('getmempoolentry', [txid]);
        
        const value = calculateTotalValue(rawTx.vout);
        const fee = info.fee || mempoolEntry.fee;
        const feeRate = (fee * 100000000) / info.vsize;
        
        totalFee += fee;
        
        transactions.push({
          txid,
          size: info.size,
          vsize: info.vsize,
          fee: fee,
          value: value,
          time: info.time,
          fee_rate: Math.round(feeRate),
          priority: calculatePriority(feeRate),
          inputs: rawTx.vin.map(processInput),
          outputs: rawTx.vout.map(processOutput),
          confirmations: 0,
          descendantcount: mempoolEntry.descendantcount,
          descendantsize: mempoolEntry.descendantsize,
          ancestorcount: mempoolEntry.ancestorcount,
          ancestorsize: mempoolEntry.ancestorsize
        });
      }
      
      // Send response
      ws.send(JSON.stringify({
        type: 'mempool',
        data: {
          stats: {
            size: mempoolInfo.size,
            bytes: mempoolInfo.bytes,
            usage: mempoolInfo.usage,
            maxmempool: mempoolInfo.maxmempool,
            minfee: mempoolInfo.mempoolminfee,
            avgfee: totalFee / transactions.length,
            totalfee: totalFee,
            feeDistribution: calculateFeeDistribution(transactions)
          },
          transactions: transactions
        }
      }));
      
      // Also send recent confirmed transactions
      await sendRecentConfirmedTransactions(ws);
      
    } catch (error) {
      console.error('Error fetching mempool:', error);
    }
  }
});

// Send recent confirmed transactions
async function sendRecentConfirmedTransactions(ws) {
  try {
    // Get recent blocks
    const blockCount = await rpc.command('getblockcount');
    const recentTransactions = [];
    
    // Get last 5 blocks
    for (let height = blockCount; height > blockCount - 5 && height > 0; height--) {
      const blockHash = await rpc.command('getblockhash', [height]);
      const block = await rpc.command('getblock', [blockHash, 2]); // verbose=2 for tx details
      
      // Process each transaction in the block
      for (const tx of block.tx.slice(0, 10)) { // Limit to 10 txs per block
        if (tx.vin[0].coinbase) continue; // Skip coinbase
        
        const value = calculateTotalValue(tx.vout);
        const fee = calculateTransactionFee(tx); // Need to implement fee calculation
        
        recentTransactions.push({
          txid: tx.txid,
          blockhash: blockHash,
          blockheight: height,
          blocktime: block.time,
          confirmations: blockCount - height + 1,
          size: tx.size,
          vsize: tx.vsize || tx.size,
          fee: fee,
          value: value,
          inputs: tx.vin.map(processInput),
          outputs: tx.vout.map(processOutput),
          fee_rate: Math.round((fee * 100000000) / (tx.vsize || tx.size))
        });
      }
    }
    
    ws.send(JSON.stringify({
      type: 'recentTransactions',
      data: recentTransactions
    }));
    
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
  }
}

// Monitor for new transactions
async function monitorMempool(ws) {
  let knownTxids = new Set();
  
  setInterval(async () => {
    try {
      const rawMempool = await rpc.command('getrawmempool', [false]);
      
      // Check for new transactions
      for (const txid of rawMempool) {
        if (!knownTxids.has(txid)) {
          knownTxids.add(txid);
          
          // Get full transaction details
          const rawTx = await rpc.command('getrawtransaction', [txid, true]);
          const mempoolEntry = await rpc.command('getmempoolentry', [txid]);
          
          // Send new transaction notification
          ws.send(JSON.stringify({
            type: 'newTransaction',
            data: {
              // Full transaction object
            }
          }));
        }
      }
      
      // Check for removed transactions (confirmed)
      for (const txid of knownTxids) {
        if (!rawMempool.includes(txid)) {
          knownTxids.delete(txid);
          
          // Check if transaction was confirmed
          try {
            const tx = await rpc.command('getrawtransaction', [txid, true]);
            if (tx.blockhash) {
              // Transaction was confirmed
              ws.send(JSON.stringify({
                type: 'confirmedTransaction',
                data: {
                  txid: txid,
                  blockhash: tx.blockhash,
                  blockheight: tx.blockheight,
                  confirmations: tx.confirmations,
                  // Include full transaction data
                }
              }));
            }
          } catch (e) {
            // Transaction might have been removed for other reasons
          }
        }
      }
      
    } catch (error) {
      console.error('Error monitoring mempool:', error);
    }
  }, 5000); // Check every 5 seconds
}
```

## Performance Considerations

1. **Caching**: Cache transaction details to avoid repeated RPC calls
2. **Batch Processing**: Use batch RPC requests where possible
3. **Pagination**: Send transactions in pages rather than all at once
4. **Rate Limiting**: Implement rate limiting for WebSocket messages
5. **Connection Pooling**: Use RPC connection pooling for better performance

## Security Considerations

1. **Input Validation**: Validate all incoming WebSocket messages
2. **Rate Limiting**: Limit requests per connection
3. **Authentication**: Consider adding authentication for WebSocket connections
4. **Data Sanitization**: Sanitize all data before sending to frontend
5. **Error Handling**: Don't expose internal errors to frontend

## Testing

Test the implementation with:
- Empty mempool
- Large mempool (1000+ transactions)
- High fee variance
- Network congestion scenarios
- Connection drops and reconnections