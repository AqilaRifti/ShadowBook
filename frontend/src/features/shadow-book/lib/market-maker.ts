// Market Maker Simulator for Shadow-Book Demo
// Requirements: 6.1, 6.2, 6.3
//
// Generates simulated market activity and finds matching orders
// for demonstration purposes when the Stylus contract is not deployed.

import type { SimulatedOrder, OrderInput, ExecutionResult } from '../types';
import { TOKENS } from '../types';

// Price ranges for realistic simulation (in USD)
const PRICE_RANGES = {
  ETH: { min: 2000, max: 4000 },
  USDC: { min: 0.99, max: 1.01 },
  WBTC: { min: 40000, max: 80000 }
};

// Generate a random number between min and max
function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Generate a random ID
function generateId(): string {
  return `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export class MarketMakerSimulator {
  private restingOrders: SimulatedOrder[] = [];

  /**
   * Generate initial resting orders for the order book
   * Creates a balanced mix of buy and sell orders at various price levels
   */
  generateRestingOrders(count: number = 10): SimulatedOrder[] {
    this.restingOrders = [];

    for (let i = 0; i < count; i++) {
      const isBuy = Math.random() > 0.5;
      const tokenPair = this.getRandomTokenPair();

      // Generate price with some spread from mid-market
      const midPrice = this.getMidPrice(tokenPair.tokenIn, tokenPair.tokenOut);
      const spreadPercent = randomBetween(0.001, 0.02); // 0.1% to 2% spread
      const limitPrice = isBuy
        ? midPrice * (1 - spreadPercent) // Buy orders below mid
        : midPrice * (1 + spreadPercent); // Sell orders above mid

      const order: SimulatedOrder = {
        id: generateId(),
        tokenIn: tokenPair.tokenIn,
        tokenOut: tokenPair.tokenOut,
        amount: randomBetween(0.1, 10),
        limitPrice: Number(limitPrice.toFixed(6)),
        isBuy
      };

      this.restingOrders.push(order);
    }

    return this.restingOrders;
  }

  /**
   * Find a matching order for the user's trade
   * Matches based on token pair and price crossing
   */
  findMatch(userOrder: OrderInput): SimulatedOrder | null {
    const userIsBuy = this.determineOrderSide(userOrder);
    const userPrice = userOrder.limitPrice
      ? parseFloat(userOrder.limitPrice)
      : this.getMidPrice(userOrder.tokenIn, userOrder.tokenOut);

    // Find matching orders (opposite side with crossing prices)
    const matchingOrders = this.restingOrders.filter((order) => {
      // Must be opposite side
      if (order.isBuy === userIsBuy) return false;

      // Must be matching token pair (reversed)
      const tokensMatch =
        (order.tokenIn === userOrder.tokenOut &&
          order.tokenOut === userOrder.tokenIn) ||
        (order.tokenIn === userOrder.tokenIn &&
          order.tokenOut === userOrder.tokenOut &&
          order.isBuy !== userIsBuy);

      if (!tokensMatch) return false;

      // Price must cross
      if (userIsBuy) {
        // User buying: their price must be >= sell order price
        return userPrice >= order.limitPrice;
      } else {
        // User selling: their price must be <= buy order price
        return userPrice <= order.limitPrice;
      }
    });

    if (matchingOrders.length === 0) return null;

    // Return best match (best price for user)
    return matchingOrders.sort((a, b) => {
      if (userIsBuy) {
        return a.limitPrice - b.limitPrice; // Lowest sell price first
      } else {
        return b.limitPrice - a.limitPrice; // Highest buy price first
      }
    })[0];
  }

  /**
   * Simulate order execution with realistic Stylus metrics
   * Returns execution result with performance data
   */
  simulateExecution(
    userOrder: OrderInput,
    match: SimulatedOrder | null
  ): ExecutionResult {
    const startTime = performance.now();

    // Simulate the matching engine scanning orders
    // In real Stylus, this would be O(n) iteration through the order book
    const ordersScanned =
      this.restingOrders.length + Math.floor(Math.random() * 100);

    // Simulate execution delay (very fast in Stylus)
    const executionTimeMs = randomBetween(10, 50);

    // Simulate gas usage (negligible in Stylus compared to Solidity)
    const gasUsed = `${randomBetween(0.0001, 0.001).toFixed(6)} ETH`;

    if (match) {
      // Remove matched order from resting orders
      this.restingOrders = this.restingOrders.filter((o) => o.id !== match.id);

      return {
        success: true,
        ordersScanned,
        executionTimeMs,
        gasUsed,
        matchedOrderId: match.id,
        buyOrderId: match.isBuy ? match.id : generateId(),
        sellOrderId: match.isBuy ? generateId() : match.id,
        executionPrice: BigInt(Math.floor(match.limitPrice * 1e18)),
        amount: BigInt(
          Math.floor(
            Math.min(parseFloat(userOrder.amount), match.amount) * 1e18
          )
        )
      };
    }

    // No match found - order added to book
    return {
      success: true,
      ordersScanned,
      executionTimeMs,
      gasUsed,
      matchedOrderId: undefined
    };
  }

  /**
   * Get current resting orders
   */
  getRestingOrders(): SimulatedOrder[] {
    return [...this.restingOrders];
  }

  /**
   * Add a new resting order (when user order doesn't match)
   */
  addRestingOrder(order: SimulatedOrder): void {
    this.restingOrders.push(order);
  }

  /**
   * Clear all resting orders
   */
  clearOrders(): void {
    this.restingOrders = [];
  }

  // Private helper methods

  private getRandomTokenPair(): { tokenIn: string; tokenOut: string } {
    const tokens = Object.keys(TOKENS);
    const tokenIn = tokens[Math.floor(Math.random() * tokens.length)];
    let tokenOut = tokens[Math.floor(Math.random() * tokens.length)];

    // Ensure different tokens
    while (tokenOut === tokenIn) {
      tokenOut = tokens[Math.floor(Math.random() * tokens.length)];
    }

    return { tokenIn, tokenOut };
  }

  private getMidPrice(tokenIn: string, tokenOut: string): number {
    const inPrice =
      PRICE_RANGES[tokenIn as keyof typeof PRICE_RANGES]?.min || 1;
    const outPrice =
      PRICE_RANGES[tokenOut as keyof typeof PRICE_RANGES]?.min || 1;

    return outPrice / inPrice;
  }

  private determineOrderSide(order: OrderInput): boolean {
    // If selling ETH for USDC, it's a sell order
    // If buying ETH with USDC, it's a buy order
    return order.isBuy;
  }
}

// Singleton instance for the demo
let simulatorInstance: MarketMakerSimulator | null = null;

export function getMarketMakerSimulator(): MarketMakerSimulator {
  if (!simulatorInstance) {
    simulatorInstance = new MarketMakerSimulator();
    simulatorInstance.generateRestingOrders(10);
  }
  return simulatorInstance;
}

// Helper function to simulate a complete trade flow
export async function simulateTrade(
  order: OrderInput,
  mode: 'public' | 'shadow' = 'shadow'
): Promise<ExecutionResult> {
  const simulator = getMarketMakerSimulator();

  // Simulate network delay (longer for dramatic effect)
  await new Promise((resolve) => setTimeout(resolve, randomBetween(1500, 2000)));

  // For demo: always return a successful match with impressive metrics
  const ordersScanned = 100 + Math.floor(Math.random() * 100); // 100-200 orders
  const executionTimeMs = randomBetween(15, 35); // Fast execution
  const gasUsed = `${randomBetween(0.0001, 0.0005).toFixed(6)} ETH`;

  // Calculate MEV loss for public swaps (2-5% loss)
  const mevLossPercent = mode === 'public' ? randomBetween(2, 5) : 0;

  return {
    success: true,
    ordersScanned,
    executionTimeMs,
    gasUsed,
    matchedOrderId: generateId(),
    buyOrderId: generateId(),
    sellOrderId: generateId(),
    executionPrice: BigInt(Math.floor(3000 * 1e18)), // ~$3000 ETH price
    amount: BigInt(Math.floor(parseFloat(order.amount) * 1e18)),
    mevLossPercent
  };
}
