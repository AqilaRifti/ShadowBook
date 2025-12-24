// Shadow-Book Core Types
// Requirements: 1.1, 1.3

export interface Order {
  id: string;
  trader: `0x${string}`;
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  amount: bigint;
  limitPrice: bigint;
  isBuy: boolean;
  timestamp: number;
  status: OrderStatus;
}

export type OrderStatus = 'pending' | 'matched' | 'cancelled' | 'expired';

export interface OrderInput {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  limitPrice?: string;
  isBuy: boolean;
}

export interface ExecutionResult {
  success: boolean;
  ordersScanned: number;
  executionTimeMs: number;
  gasUsed: string;
  matchedOrderId?: string;
  buyOrderId?: string;
  sellOrderId?: string;
  executionPrice?: bigint;
  amount?: bigint;
  mevLossPercent?: number;
}

export interface MatchResult {
  buyOrderId: string;
  sellOrderId: string;
  executionPrice: bigint;
  amount: bigint;
  gasUsed: bigint;
}

export interface RiskAssessment {
  mevProbability: 'low' | 'medium' | 'high';
  recommendation: string;
  factors: string[];
}

export interface Transaction {
  id: string;
  type: 'user' | 'bot';
  status: 'pending' | 'executed' | 'attacked';
  amount: string;
  token: string;
}

export interface TradeFormState {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  mode: 'public' | 'shadow';
  isSubmitting: boolean;
}

export interface VisualizationState {
  publicTransactions: Transaction[];
  shadowOrders: SimulatedOrder[];
  activeAnimation: 'idle' | 'submitting' | 'matching' | 'attacked';
  lastMatchResult: ExecutionResult | null;
}

export interface SimulatedOrder {
  id: string;
  tokenIn: string;
  tokenOut: string;
  amount: number;
  limitPrice: number;
  isBuy: boolean;
}

// Token definitions for the demo
export const TOKENS = {
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    decimals: 18
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`,
    decimals: 6
  },
  WBTC: {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' as `0x${string}`,
    decimals: 8
  }
} as const;

export type TokenSymbol = keyof typeof TOKENS;
