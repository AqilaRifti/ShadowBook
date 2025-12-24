// Feature: shadow-book, Property 4: Matching Correctness
// Validates: Requirements 3.1, 6.2
//
// For any order book containing a buy order B and sell order S where
// B.tokenIn == S.tokenOut AND B.tokenOut == S.tokenIn AND B.limitPrice >= S.limitPrice,
// the matching engine SHALL identify and return this pair as a valid match.

import fc from 'fast-check';
import { MarketMakerSimulator } from '../lib/market-maker';
import type { SimulatedOrder, OrderInput } from '../types';

// Arbitrary generators
const tokenArbitrary = fc.constantFrom('ETH', 'USDC', 'WBTC');

const simulatedOrderArbitrary = (
  tokenIn: string,
  tokenOut: string,
  isBuy: boolean,
  priceRange: { min: number; max: number }
): fc.Arbitrary<SimulatedOrder> =>
  fc.record({
    id: fc.uuid(),
    tokenIn: fc.constant(tokenIn),
    tokenOut: fc.constant(tokenOut),
    amount: fc.double({ min: 0.1, max: 10, noNaN: true }),
    limitPrice: fc.double({
      min: priceRange.min,
      max: priceRange.max,
      noNaN: true
    }),
    isBuy: fc.constant(isBuy)
  });

describe('Shadow-Book Matching Correctness Properties', () => {
  // Property 4: Matching Correctness
  it('should find a match when buy price >= sell price for same token pair', () => {
    fc.assert(
      fc.property(
        // Generate a price where buy >= sell (crossing prices)
        fc.double({ min: 100, max: 1000, noNaN: true }),
        fc.double({ min: 0, max: 0.1, noNaN: true }), // spread
        (basePrice, spread) => {
          const simulator = new MarketMakerSimulator();
          simulator.clearOrders();

          const sellPrice = basePrice;
          const buyPrice = basePrice + spread * basePrice; // Buy price >= sell price

          // Create a sell order (someone selling ETH for USDC)
          const sellOrder: SimulatedOrder = {
            id: 'sell-order-1',
            tokenIn: 'ETH',
            tokenOut: 'USDC',
            amount: 1.0,
            limitPrice: sellPrice,
            isBuy: false
          };

          simulator.addRestingOrder(sellOrder);

          // User wants to buy ETH with USDC at a price >= sell price
          const userOrder: OrderInput = {
            tokenIn: 'USDC',
            tokenOut: 'ETH',
            amount: '1.0',
            limitPrice: buyPrice.toString(),
            isBuy: true
          };

          const match = simulator.findMatch(userOrder);

          // Should find a match since buy price >= sell price
          expect(match).not.toBeNull();
          if (match) {
            expect(match.id).toBe('sell-order-1');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should NOT find a match when buy price < sell price', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 100, max: 1000, noNaN: true }),
        fc.double({ min: 0.01, max: 0.1, noNaN: true }), // spread
        (basePrice, spread) => {
          const simulator = new MarketMakerSimulator();
          simulator.clearOrders();

          const sellPrice = basePrice;
          const buyPrice = basePrice - spread * basePrice; // Buy price < sell price

          // Create a sell order
          const sellOrder: SimulatedOrder = {
            id: 'sell-order-1',
            tokenIn: 'ETH',
            tokenOut: 'USDC',
            amount: 1.0,
            limitPrice: sellPrice,
            isBuy: false
          };

          simulator.addRestingOrder(sellOrder);

          // User wants to buy at a price < sell price (no match)
          const userOrder: OrderInput = {
            tokenIn: 'USDC',
            tokenOut: 'ETH',
            amount: '1.0',
            limitPrice: buyPrice.toString(),
            isBuy: true
          };

          const match = simulator.findMatch(userOrder);

          // Should NOT find a match since buy price < sell price
          expect(match).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should match the best price for the user (lowest sell for buyer)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 100, max: 500, noNaN: true }),
        fc.double({ min: 0.01, max: 0.05, noNaN: true }),
        fc.double({ min: 0.06, max: 0.1, noNaN: true }),
        (basePrice, spread1, spread2) => {
          const simulator = new MarketMakerSimulator();
          simulator.clearOrders();

          const lowSellPrice = basePrice;
          const highSellPrice = basePrice * (1 + spread2);
          const buyPrice = basePrice * (1 + spread1 + spread2); // High enough to match both

          // Create two sell orders at different prices
          const lowSellOrder: SimulatedOrder = {
            id: 'low-sell',
            tokenIn: 'ETH',
            tokenOut: 'USDC',
            amount: 1.0,
            limitPrice: lowSellPrice,
            isBuy: false
          };

          const highSellOrder: SimulatedOrder = {
            id: 'high-sell',
            tokenIn: 'ETH',
            tokenOut: 'USDC',
            amount: 1.0,
            limitPrice: highSellPrice,
            isBuy: false
          };

          simulator.addRestingOrder(highSellOrder);
          simulator.addRestingOrder(lowSellOrder);

          // User wants to buy
          const userOrder: OrderInput = {
            tokenIn: 'USDC',
            tokenOut: 'ETH',
            amount: '1.0',
            limitPrice: buyPrice.toString(),
            isBuy: true
          };

          const match = simulator.findMatch(userOrder);

          // Should match the lowest sell price (best for buyer)
          expect(match).not.toBeNull();
          if (match) {
            expect(match.id).toBe('low-sell');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not match orders with same side (buy vs buy)', () => {
    fc.assert(
      fc.property(fc.double({ min: 100, max: 1000, noNaN: true }), (price) => {
        const simulator = new MarketMakerSimulator();
        simulator.clearOrders();

        // Create a buy order in the book
        const restingBuyOrder: SimulatedOrder = {
          id: 'resting-buy',
          tokenIn: 'USDC',
          tokenOut: 'ETH',
          amount: 1.0,
          limitPrice: price,
          isBuy: true
        };

        simulator.addRestingOrder(restingBuyOrder);

        // User also wants to buy (same side)
        const userOrder: OrderInput = {
          tokenIn: 'USDC',
          tokenOut: 'ETH',
          amount: '1.0',
          limitPrice: (price * 1.1).toString(),
          isBuy: true
        };

        const match = simulator.findMatch(userOrder);

        // Should NOT match same-side orders
        expect(match).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});

export { simulatedOrderArbitrary, tokenArbitrary };
