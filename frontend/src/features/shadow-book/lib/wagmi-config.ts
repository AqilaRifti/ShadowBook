// Wagmi Configuration for Arbitrum Stylus Testnet
// Requirements: 8.1, 8.2, 8.3

import { http, createConfig, createStorage } from 'wagmi';
import { arbitrumSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Arbitrum Stylus Testnet (uses Arbitrum Sepolia)
export const arbitrumStylusTestnet = {
  ...arbitrumSepolia,
  id: 421614,
  name: 'Arbitrum Stylus Testnet',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia-rollup.arbitrum.io/rpc']
    },
    public: {
      http: ['https://sepolia-rollup.arbitrum.io/rpc']
    }
  },
  blockExplorers: {
    default: {
      name: 'Arbiscan',
      url: 'https://sepolia.arbiscan.io'
    }
  },
  testnet: true
} as const;

// Shadow-Book Contract Address (placeholder - update after deployment)
export const SHADOW_BOOK_ADDRESS =
  '0x0000000000000000000000000000000000000000' as const;

// Contract ABI for Shadow-Book
export const SHADOW_BOOK_ABI = [
  {
    name: 'submit_order',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token_in', type: 'address' },
      { name: 'token_out', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'limit_price', type: 'uint256' },
      { name: 'is_buy', type: 'bool' }
    ],
    outputs: [{ name: 'order_id', type: 'uint64' }]
  },
  {
    name: 'execute_match',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [
      {
        name: 'matches',
        type: 'tuple[]',
        components: [
          { name: 'buy_order_id', type: 'uint64' },
          { name: 'sell_order_id', type: 'uint64' },
          { name: 'execution_price', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
          { name: 'gas_used', type: 'uint256' }
        ]
      }
    ]
  },
  {
    name: 'cancel_order',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'order_id', type: 'uint64' }],
    outputs: []
  },
  {
    name: 'get_orders',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: 'orders',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint64' },
          { name: 'trader', type: 'address' },
          { name: 'token_in', type: 'address' },
          { name: 'token_out', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'limit_price', type: 'uint256' },
          { name: 'is_buy', type: 'bool' },
          { name: 'timestamp', type: 'uint64' }
        ]
      }
    ]
  }
] as const;

// Create Wagmi config
export const wagmiConfig = createConfig({
  chains: [arbitrumStylusTestnet],
  connectors: [injected()],
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }),
  transports: {
    [arbitrumStylusTestnet.id]: http()
  }
});

// Check if contract is deployed (for demo mode fallback)
export const isContractDeployed = (): boolean => {
  return SHADOW_BOOK_ADDRESS !== '0x0000000000000000000000000000000000000000';
};
