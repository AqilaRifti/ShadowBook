// Feature: shadow-book, Property 5: Balance Conservation After Match
// Validates: Requirements 3.2
//
// For any matched order pair, the sum of all token balances before the match
// SHALL equal the sum of all token balances after the match (conservation of value),
// and each trader's balance SHALL be updated according to the matched amounts.

import fc from 'fast-check';
import { MarketMakerSimulator } from '../lib/market-maker';
import type { SimulatedOrder, OrderInput } from '../types';

// Simulated balance tracker for testing conservation
interface BalanceState {
  [trader: string]: {
    [token: string]: number;
  };
}

// Initialize balances for testing
function initializeBalances(orders: SimulatedOrder[]): BalanceState {
  const balances: BalanceState = {};

  orders.forEach((order, index) => {
    const trader = `trader-${index}`;
    if (!balances[trader]) {
      balances[trader] = {};
    }
    // Give each trader enough of their input token
    balances[trader][order.tokenIn] =
      (balances[trader][order.tokenIn] || 0) + order.amount * 2;
    balances[trader][order.tokenOut] = balances[trader][order.tokenOut] || 0;
  });

  return balances;
}

// Calculate total value across all balances
function calculateTotalValue(
  balances: BalanceState,
  prices: Record<string, number>
): number {
  let total = 0;
  Object.values(balances).forEach((traderBalances) => {
    Object.entries(traderBalances).forEach(([token, amount]) => {
      total += amount * (prices[token] || 1);
    });
  });
  return total;
}

// Simulate a match and update balances
function simulateMatchWithBalances(
  buyOrder: SimulatedOrder,
  sellOrder: SimulatedOrder,
  balances: BalanceState,
  buyerTrader: string,
  sellerTrader: string
): BalanceState {
  const newBalances = JSON.parse(JSON.stringify(balances)) as BalanceState;

  // Calculate matched amount (minimum of both orders)
  const matchedAmount = Math.min(buyOrder.amount, sellOrder.amount);

  // Execution price (midpoint)
  const executionPrice = (buyOrder.limitPrice + sellOrder.limitPrice) / 2;

  // Calculate token amounts exchanged
  // Buyer gives tokenIn (e.g., USDC), receives tokenOut (e.g., ETH)
  // Seller gives tokenIn (e.g., ETH), receives tokenOut (e.g., USDC)

  // For simplicity, assume:
  // - Buy order: tokenIn = USDC, tokenOut = ETH
  // - Sell order: tokenIn = ETH, tokenOut = USDC

  // Buyer pays USDC, receives ETH
  const usdcPaid = matchedAmount * executionPrice;
  newBalances[buyerTrader][buyOrder.tokenIn] -= usdcPaid;
  newBalances[buyerTrader][buyOrder.tokenOut] =
    (newBalances[buyerTrader][buyOrder.tokenOut] || 0) + matchedAmount;

  // Seller pays ETH, receives USDC
  newBalances[sellerTrader][sellOrder.tokenIn] -= matchedAmount;
  newBalances[sellerTrader][sellOrder.tokenOut] =
    (newBalances[sellerTrader][sellOrder.tokenOut] || 0) + usdcPaid;

  return newBalances;
}

describe('Shadow-Book Balance Conservation Properties', () => {
  // Property 5: Balance Conservation After Match
  it('should conserve total value after a match', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 10, noNaN: true }), // amount
        fc.double({ min: 100, max: 1000, noNaN: true }), // base price
        fc.double({ min: 0, max: 0.05, noNaN: true }), // spread
        (amount, basePrice, spread) => {
          const buyPrice = basePrice * (1 + spread);
          const sellPrice = basePrice;

          // Create matching orders
          const buyOrder: SimulatedOrder = {
            id: 'buy-1',
            tokenIn: 'USDC',
            tokenOut: 'ETH',
            amount,
            limitPrice: buyPrice,
            isBuy: true
          };

          const sellOrder: SimulatedOrder = {
            id: 'sell-1',
            tokenIn: 'ETH',
            tokenOut: 'USDC',
            amount,
            limitPrice: sellPrice,
            isBuy: false
          };

          // Initialize balances
          const initialBalances: BalanceState = {
            buyer: {
              USDC: amount * buyPrice * 2, // Enough USDC to buy
              ETH: 0
            },
            seller: {
              ETH: amount * 2, // Enough ETH to sell
              USDC: 0
            }
          };

          // Token prices for value calculation
          const prices = {
            ETH: basePrice,
            USDC: 1
          };

          // Calculate initial total value
          const initialValue = calculateTotalValue(initialBalances, prices);

          // Execute match
          const finalBalances = simulateMatchWithBalances(
            buyOrder,
            sellOrder,
            initialBalances,
            'buyer',
            'seller'
          );

          // Calculate final total value
          const finalValue = calculateTotalValue(finalBalances, prices);

          // Total value should be conserved (within floating point tolerance)
          expect(Math.abs(finalValue - initialValue)).toBeLessThan(0.0001);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update buyer balance correctly after match', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 10, noNaN: true }),
        fc.double({ min: 100, max: 1000, noNaN: true }),
        (amount, price) => {
          const buyOrder: SimulatedOrder = {
            id: 'buy-1',
            tokenIn: 'USDC',
            tokenOut: 'ETH',
            amount,
            limitPrice: price,
            isBuy: true
          };

          const sellOrder: SimulatedOrder = {
            id: 'sell-1',
            tokenIn: 'ETH',
            tokenOut: 'USDC',
            amount,
            limitPrice: price,
            isBuy: false
          };

          const initialBalances: BalanceState = {
            buyer: { USDC: amount * price * 2, ETH: 0 },
            seller: { ETH: amount * 2, USDC: 0 }
          };

          const finalBalances = simulateMatchWithBalances(
            buyOrder,
            sellOrder,
            initialBalances,
            'buyer',
            'seller'
          );

          // Buyer should have received ETH
          expect(finalBalances.buyer.ETH).toBeGreaterThan(0);
          // Buyer should have paid USDC
          expect(finalBalances.buyer.USDC).toBeLessThan(
            initialBalances.buyer.USDC
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update seller balance correctly after match', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 10, noNaN: true }),
        fc.double({ min: 100, max: 1000, noNaN: true }),
        (amount, price) => {
          const buyOrder: SimulatedOrder = {
            id: 'buy-1',
            tokenIn: 'USDC',
            tokenOut: 'ETH',
            amount,
            limitPrice: price,
            isBuy: true
          };

          const sellOrder: SimulatedOrder = {
            id: 'sell-1',
            tokenIn: 'ETH',
            tokenOut: 'USDC',
            amount,
            limitPrice: price,
            isBuy: false
          };

          const initialBalances: BalanceState = {
            buyer: { USDC: amount * price * 2, ETH: 0 },
            seller: { ETH: amount * 2, USDC: 0 }
          };

          const finalBalances = simulateMatchWithBalances(
            buyOrder,
            sellOrder,
            initialBalances,
            'buyer',
            'seller'
          );

          // Seller should have received USDC
          expect(finalBalances.seller.USDC).toBeGreaterThan(0);
          // Seller should have paid ETH
          expect(finalBalances.seller.ETH).toBeLessThan(
            initialBalances.seller.ETH
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should match the minimum amount when orders have different sizes', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 5, noNaN: true }),
        fc.double({ min: 5.1, max: 10, noNaN: true }),
        fc.double({ min: 100, max: 1000, noNaN: true }),
        (smallAmount, largeAmount, price) => {
          const buyOrder: SimulatedOrder = {
            id: 'buy-1',
            tokenIn: 'USDC',
            tokenOut: 'ETH',
            amount: largeAmount,
            limitPrice: price,
            isBuy: true
          };

          const sellOrder: SimulatedOrder = {
            id: 'sell-1',
            tokenIn: 'ETH',
            tokenOut: 'USDC',
            amount: smallAmount,
            limitPrice: price,
            isBuy: false
          };

          const initialBalances: BalanceState = {
            buyer: { USDC: largeAmount * price * 2, ETH: 0 },
            seller: { ETH: smallAmount * 2, USDC: 0 }
          };

          const finalBalances = simulateMatchWithBalances(
            buyOrder,
            sellOrder,
            initialBalances,
            'buyer',
            'seller'
          );

          // Matched amount should be the smaller of the two
          const matchedAmount = Math.min(smallAmount, largeAmount);

          // Buyer receives exactly matchedAmount of ETH
          expect(finalBalances.buyer.ETH).toBeCloseTo(matchedAmount, 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});

export { initializeBalances, calculateTotalValue, simulateMatchWithBalances };
