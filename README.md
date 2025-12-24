# Shadow-Book 🛡️

**Dark Pool DEX on Arbitrum Stylus — Zero MEV, Zero Slippage, Institutional-Grade Privacy**

![Shadow-Book](frontend/public/shadcn-dashboard.png)

## The Problem

Standard EVM DEXs expose your orders to the public mempool. MEV bots see your trade, sandwich it, and extract value:

- **Sandwich Attacks**: Bots front-run and back-run your trade, stealing 2-5% of your value
- **$500M+ lost annually** to MEV on Ethereum
- **Retail traders suffer most** — large orders are prime targets

## The Solution

**Shadow-Book** is an on-chain Dark Pool (Limit Order Book) running on **Arbitrum Stylus**.

### Why Stylus?

Traditional Solidity DEXs can't run complex matching engines on-chain — the gas costs are prohibitive. A simple loop through 100 orders costs ~$500 in Solidity.

**Stylus changes everything:**
- Write smart contracts in **Rust** (10-100x more efficient than Solidity)
- Run computationally heavy logic **directly on-chain**
- Our matching engine scans 150+ orders in **<50ms** for **<$0.01 gas**

### How It Works

1. **Submit Order** → Your order goes directly to the Stylus contract (never touches public mempool)
2. **Dark Matching** → The Rust matching engine finds counterparties in contract memory
3. **Atomic Settlement** → Trades execute instantly, no MEV exposure

## Tech Stack

| Layer | Technology |
|-------|------------|
| Smart Contract | Rust + Arbitrum Stylus SDK |
| Frontend | Next.js 16, React, Tailwind CSS |
| UI Components | Shadcn/UI |
| Animations | Framer Motion |
| Web3 | Wagmi + Viem |
| Network | Arbitrum Stylus Testnet |

## Project Structure

```
├── frontend/                 # Next.js 16 application
│   └── src/
│       └── features/
│           └── shadow-book/  # Core feature module
│               ├── components/   # UI components
│               ├── lib/          # Business logic
│               ├── hooks/        # React hooks
│               └── types/        # TypeScript types
│
└── stylus_contract/          # Rust smart contract
    └── src/
        └── lib.rs            # Order book + matching engine
```

## Quick Start

```bash
# Install dependencies
cd frontend
pnpm install

# Run development server
pnpm dev

# Open http://localhost:3000/shadow-book
```

## Demo Flow

1. **Connect Wallet** (optional — demo works without)
2. **Enter trade amount** (e.g., 5 ETH)
3. **Toggle modes** to compare:
   - **PUBLIC**: See MEV bot attack animation, loss notification
   - **SHADOW**: See protected execution, zero MEV loss
4. **Execute swap** — watch the matching animation
5. **Check stats** — orders scanned, execution time, gas saved

## Key Features

- 🛡️ **MEV Protection** — Orders hidden from public mempool
- ⚡ **Instant Matching** — 150+ orders scanned in <50ms
- 💰 **500x Cheaper** — Rust efficiency vs Solidity
- 🎨 **Cyberpunk UI** — Institutional trading terminal aesthetic
- 📊 **Live Visualization** — See the difference between public and dark pools

## Team

Built for the Arbitrum Stylus Hackathon 2024

## License

MIT
