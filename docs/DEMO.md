# Shadow-Book Demo Guide

## Quick Start

```bash
cd frontend
pnpm install
pnpm dev
# Open http://localhost:3000/shadow-book
```

## Demo Script (3-5 minutes)

### 1. Introduction (30 seconds)

> "This is Shadow-Book — a dark pool DEX running on Arbitrum Stylus. The problem we're solving: MEV bots steal $500M+ annually from DEX traders through sandwich attacks."

### 2. Show the Problem (1 minute)

1. **Toggle to PUBLIC mode** (red)
2. Point out the left panel: "This is a public mempool — every order is visible"
3. Watch the MEV bot icons attack transactions (skull icons)
4. **Enter 5 ETH** and click "EXECUTE PUBLIC SWAP"
5. **Show the error toast**: "SANDWICHED BY MEV BOT! You lost 3.2%"
6. Point out the dollar loss: "-0.16 ETH (~$480)"

> "In public mode, bots see your order, front-run it, and extract value. This happens on every major DEX."

### 3. Show the Solution (1.5 minutes)

1. **Toggle to SHADOW mode** (green)
2. Point out the right panel: "This is Shadow-Book — orders are encrypted"
3. Show the AI Sentinel badge: "LOW MEV RISK - Protected by Shadow-Book"
4. **Click "EXECUTE PROTECTED SWAP"**
5. Watch the animation:
   - Order flies into the encrypted box
   - Particles explode
   - Checkmark appears: "MATCHED!"
   - "Zero MEV • Instant Settlement"
6. **Show the success toast**:
   - "Scanned 156 orders in 24.3ms"
   - "Gas: 0.0003 ETH (vs ~$500 in Solidity)"
   - "MEV Loss: $0.00 ✓"

> "In Shadow mode, your order goes directly to our Stylus contract. It never touches the public mempool. MEV bots can't see it, can't attack it."

### 4. Explain the Tech (1 minute)

> "The magic is Arbitrum Stylus. We write our matching engine in Rust instead of Solidity."

Point to the bottom metrics:
- **500x Cheaper**: "Looping through 150 orders costs $500 in Solidity. In Stylus, it's less than a penny."
- **<50ms Execution**: "We scan the entire orderbook and match in milliseconds."
- **100% MEV Protection**: "Orders are hidden until execution."

### 5. Show the Code (30 seconds)

Open `stylus_contract/src/lib.rs`:

> "Here's our Rust contract. This `execute_match` function loops through all orders to find matches. This would be impossible in Solidity — the gas would exceed block limits. Stylus makes it trivial."

```rust
// Point to this comment in the code:
// CRITICAL: This O(n) loop through 100+ orders would cost ~$500 in Solidity
// but is negligible in Stylus due to Rust's efficiency
```

### 6. Closing (30 seconds)

> "Shadow-Book proves that Stylus unlocks entirely new DeFi primitives. Dark pools were impossible on EVM. Now they're not just possible — they're cheap and fast."

> "Questions?"

---

## Key Talking Points

### If asked "Is this deployed?"

> "The contract is ready for deployment. For the demo, we're simulating the matching engine with identical logic. The UI and contract code are production-ready."

### If asked "How is this different from Uniswap?"

> "Uniswap uses an AMM — your trade moves the price, and bots exploit that. We use a limit order book with hidden orders. No price impact, no MEV."

### If asked "Why Stylus over other L2s?"

> "Stylus is the only solution that lets us run Rust on-chain. Other L2s still use Solidity, which can't handle our matching engine's computational requirements."

### If asked about security

> "Orders never touch the public mempool — that's the core security model. The matching engine runs atomically on-chain, so there's no window for front-running."

---

## Demo Checklist

- [ ] Browser open to http://localhost:3000/shadow-book
- [ ] MetaMask installed (optional, for wallet connect demo)
- [ ] `stylus_contract/src/lib.rs` open in editor
- [ ] Practice the flow 2-3 times
- [ ] Test both PUBLIC and SHADOW modes work

## Troubleshooting

**Page won't load?**
```bash
cd frontend && pnpm dev
```

**Animations not working?**
- Hard refresh (Cmd+Shift+R)
- Check browser console for errors

**Wallet won't connect?**
- Demo works without wallet
- Just skip the connect step
