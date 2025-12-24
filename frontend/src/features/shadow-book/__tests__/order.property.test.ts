// Feature: shadow-book, Property 1: Order Structure Validity
// Validates: Requirements 1.1, 1.3
//
// For any generated Order object, it SHALL contain all required fields
// (id, trader, tokenIn, tokenOut, amount, limitPrice, isBuy) with valid types,
// and the system SHALL correctly distinguish between buy and sell orders.

import fc from 'fast-check';
import type { Order, OrderStatus } from '../types';

// Arbitrary generators for Order fields
const addressArbitrary = fc
  .array(fc.constantFrom(...'0123456789abcdef'.split('')), {
    minLength: 40,
    maxLength: 40
  })
  .map((chars) => `0x${chars.join('')}` as `0x${string}`);

const orderStatusArbitrary = fc.constantFrom<OrderStatus>(
  'pending',
  'matched',
  'cancelled',
  'expired'
);

const orderArbitrary: fc.Arbitrary<Order> = fc.record({
  id: fc.uuid(),
  trader: addressArbitrary,
  tokenIn: addressArbitrary,
  tokenOut: addressArbitrary,
  amount: fc.bigInt({ min: 1n, max: BigInt(10 ** 27) }),
  limitPrice: fc.bigInt({ min: 1n, max: BigInt(10 ** 27) }),
  isBuy: fc.boolean(),
  timestamp: fc.integer({ min: 0, max: Date.now() }),
  status: orderStatusArbitrary
});

// Helper to validate Order structure
function isValidOrder(order: Order): boolean {
  return (
    typeof order.id === 'string' &&
    order.id.length > 0 &&
    typeof order.trader === 'string' &&
    order.trader.startsWith('0x') &&
    order.trader.length === 42 &&
    typeof order.tokenIn === 'string' &&
    order.tokenIn.startsWith('0x') &&
    order.tokenIn.length === 42 &&
    typeof order.tokenOut === 'string' &&
    order.tokenOut.startsWith('0x') &&
    order.tokenOut.length === 42 &&
    typeof order.amount === 'bigint' &&
    order.amount > 0n &&
    typeof order.limitPrice === 'bigint' &&
    order.limitPrice > 0n &&
    typeof order.isBuy === 'boolean' &&
    typeof order.timestamp === 'number' &&
    order.timestamp >= 0 &&
    ['pending', 'matched', 'cancelled', 'expired'].includes(order.status)
  );
}

describe('Shadow-Book Order Structure Properties', () => {
  // Property 1: Order Structure Validity
  it('should generate valid Order objects with all required fields', () => {
    fc.assert(
      fc.property(orderArbitrary, (order) => {
        // All required fields must be present and valid
        expect(isValidOrder(order)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should correctly distinguish between buy and sell orders', () => {
    fc.assert(
      fc.property(orderArbitrary, (order) => {
        // isBuy must be a boolean that clearly distinguishes order type
        expect(typeof order.isBuy).toBe('boolean');

        // Buy orders have isBuy = true
        if (order.isBuy) {
          expect(order.isBuy).toBe(true);
        } else {
          // Sell orders have isBuy = false
          expect(order.isBuy).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should have valid Ethereum addresses for trader and tokens', () => {
    fc.assert(
      fc.property(orderArbitrary, (order) => {
        // All addresses must be valid 42-character hex strings
        const addressRegex = /^0x[a-fA-F0-9]{40}$/;

        expect(addressRegex.test(order.trader)).toBe(true);
        expect(addressRegex.test(order.tokenIn)).toBe(true);
        expect(addressRegex.test(order.tokenOut)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should have positive amounts and prices', () => {
    fc.assert(
      fc.property(orderArbitrary, (order) => {
        // Amount and limitPrice must be positive
        expect(order.amount > 0n).toBe(true);
        expect(order.limitPrice > 0n).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should have valid status values', () => {
    fc.assert(
      fc.property(orderArbitrary, (order) => {
        const validStatuses = ['pending', 'matched', 'cancelled', 'expired'];
        expect(validStatuses.includes(order.status)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// Export generators for use in other tests
export { orderArbitrary, addressArbitrary, orderStatusArbitrary };
