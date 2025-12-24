# Why Arbitrum Stylus?

## The Core Innovation

Stylus allows smart contracts written in **Rust, C, and C++** to run on Arbitrum alongside Solidity contracts. This isn't just a language preference — it unlocks entirely new categories of on-chain applications.

## Shadow-Book: A Stylus-Native Application

Shadow-Book is **impossible to build in Solidity**. Here's why:

### The Matching Engine Problem

A limit order book DEX needs to:
1. Store all open orders
2. When a new order arrives, scan existing orders for matches
3. Execute matches atomically

In Solidity:
```solidity
// This loop would cost ~$500+ in gas for 100 orders
// Often exceeds block gas limit entirely
for (uint i = 0; i < orders.length; i++) {
    if (orders[i].price <= newOrder.price) {
        executeMatch(orders[i], newOrder);
        break;
    }
}
```

In Stylus (Rust):
```rust
// Same logic, <$0.01 gas
for order in self.orders.iter() {
    if order.price <= new_order.price {
        self.execute_match(order, new_order);
        break;
    }
}
```

### Why the 500x Difference?

| Factor | Solidity/EVM | Stylus/WASM |
|--------|--------------|-------------|
| Execution | Interpreted opcodes | Compiled WASM |
| Memory | 32-byte word slots | Native allocation |
| Loops | ~200 gas per iteration | ~0.1 gas per iteration |
| Storage | ~2,100 gas per SLOAD | ~100 gas equivalent |

## What This Enables

### Before Stylus
- DEXs forced to use AMMs (Uniswap model)
- Or off-chain orderbooks (centralization risk)
- Complex matching = off-chain relayers
- MEV extraction unavoidable

### After Stylus
- **On-chain limit order books** — economically viable
- **Dark pools** — orders hidden until execution
- **Complex matching algorithms** — price-time priority, pro-rata, etc.
- **MEV resistance** — no public mempool exposure

## Shadow-Book's Stylus Advantages

### 1. Vec<Order> Storage
We store orders in a Rust `Vec`, enabling O(n) iteration. In Solidity, you'd need a mapping (no iteration) or pay prohibitive gas for array operations.

### 2. In-Memory Matching
The matching engine runs entirely in contract memory during a single transaction. No external calls, no MEV windows.

### 3. Rust Safety
Rust's ownership model prevents common smart contract bugs:
- No reentrancy (borrow checker)
- No integer overflow (checked by default)
- No null pointer issues

### 4. Future Optimizations
Rust ecosystem enables:
- Custom data structures (B-trees, heaps)
- SIMD operations for batch processing
- Zero-copy serialization

## Code Comparison

### Solidity (Impossible)
```solidity
contract OrderBook {
    Order[] public orders; // Gas bomb
    
    function matchOrders() external {
        // This function would cost thousands of dollars
        // and likely exceed block gas limit
        for (uint i = 0; i < orders.length; i++) {
            for (uint j = i + 1; j < orders.length; j++) {
                if (canMatch(orders[i], orders[j])) {
                    executeSwap(i, j);
                }
            }
        }
    }
}
```

### Stylus/Rust (Shadow-Book)
```rust
#[external]
impl ShadowBook {
    pub fn execute_match(&mut self) -> Vec<MatchResult> {
        let mut results = Vec::new();
        
        // O(n²) is fine in Stylus!
        for i in 0..self.orders.len() {
            for j in (i + 1)..self.orders.len() {
                if self.orders[i].matches(&self.orders[j]) {
                    results.push(self.swap(i, j));
                }
            }
        }
        
        results
    }
}
```

## Conclusion

Shadow-Book isn't just "a DEX written in Rust." It's a **new primitive** that Stylus makes possible:

- **Dark pool trading** — previously only available to institutions with private infrastructure
- **On-chain matching** — no trusted relayers or off-chain components  
- **MEV elimination** — orders never touch public mempool

This is what Stylus is for: applications that were architecturally impossible before, now running trustlessly on-chain.
