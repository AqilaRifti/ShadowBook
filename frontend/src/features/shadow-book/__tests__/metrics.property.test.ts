// Feature: shadow-book, Property 8: Execution Metrics Structure
// Validates: Requirements 6.3
//
// For any execution result returned by the Market Maker Simulator,
// it SHALL contain ordersScanned (positive integer), executionTimeMs (positive number),
// and gasUsed (valid gas string), demonstrating realistic Stylus performance metrics.

import fc from 'fast-check';
import { MarketMakerSimulator } from '../lib/market-maker';
import type { OrderInput, ExecutionResult } from '../types';

// Arbitrary generator for order inputs
const orderInputArbitrary: fc.Arbitrary<OrderInput> = fc.record({
  tokenIn: fc.constantFrom('ETH', 'USDC', 'WBTC'),
  tokenOut: fc.constantFrom('ETH', 'USDC', 'WBTC'),
  amount: fc
    .double({ min: 0.01, max: 100, noNaN: true })
    .map((n) => n.toString()),
  limitPrice: fc.option(
    fc.double({ min: 1, max: 10000, noNaN: true }).map((n) => n.toString()),
    { nil: undefined }
  ),
  isBuy: fc.boolean()
});

// Helper to validate execution result structure
function isValidExecutionResult(result: ExecutionResult): boolean {
  // Must have success boolean
  if (typeof result.success !== 'boolean') return false;

  // Must have ordersScanned as positive integer
  if (
    typeof result.ordersScanned !== 'number' ||
    result.ordersScanned < 0 ||
    !Number.isInteger(result.ordersScanned)
  ) {
    return false;
  }

  // Must have executionTimeMs as positive number
  if (
    typeof result.executionTimeMs !== 'number' ||
    result.executionTimeMs < 0
  ) {
    return false;
  }

  // Must have gasUsed as valid string with ETH suffix
  if (typeof result.gasUsed !== 'string' || !result.gasUsed.includes('ETH')) {
    return false;
  }

  // Gas value should be parseable and small (Stylus is cheap)
  const gasValue = parseFloat(result.gasUsed);
  if (isNaN(gasValue) || gasValue < 0 || gasValue > 1) {
    return false;
  }

  return true;
}

describe('Shadow-Book Execution Metrics Properties', () => {
  // Property 8: Execution Metrics Structure
  it('should return valid execution metrics for any order', () => {
    fc.assert(
      fc.property(orderInputArbitrary, (orderInput) => {
        const simulator = new MarketMakerSimulator();
        simulator.generateRestingOrders(10);

        const match = simulator.findMatch(orderInput);
        const result = simulator.simulateExecution(orderInput, match);

        expect(isValidExecutionResult(result)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should have ordersScanned >= number of resting orders', () => {
    fc.assert(
      fc.property(
        orderInputArbitrary,
        fc.integer({ min: 1, max: 20 }),
        (orderInput, orderCount) => {
          const simulator = new MarketMakerSimulator();
          simulator.generateRestingOrders(orderCount);

          const match = simulator.findMatch(orderInput);
          const result = simulator.simulateExecution(orderInput, match);

          // Should scan at least as many orders as exist in the book
          expect(result.ordersScanned).toBeGreaterThanOrEqual(orderCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have realistic execution time (< 100ms for Stylus)', () => {
    fc.assert(
      fc.property(orderInputArbitrary, (orderInput) => {
        const simulator = new MarketMakerSimulator();
        simulator.generateRestingOrders(10);

        const match = simulator.findMatch(orderInput);
        const result = simulator.simulateExecution(orderInput, match);

        // Stylus execution should be very fast
        expect(result.executionTimeMs).toBeLessThan(100);
        expect(result.executionTimeMs).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should have negligible gas cost (< 0.01 ETH for Stylus)', () => {
    fc.assert(
      fc.property(orderInputArbitrary, (orderInput) => {
        const simulator = new MarketMakerSimulator();
        simulator.generateRestingOrders(10);

        const match = simulator.findMatch(orderInput);
        const result = simulator.simulateExecution(orderInput, match);

        const gasValue = parseFloat(result.gasUsed);

        // Stylus gas should be negligible compared to Solidity
        expect(gasValue).toBeLessThan(0.01);
        expect(gasValue).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should include match details when a match is found', () => {
    const simulator = new MarketMakerSimulator();
    simulator.clearOrders();

    // Create a guaranteed match scenario
    simulator.addRestingOrder({
      id: 'test-sell',
      tokenIn: 'ETH',
      tokenOut: 'USDC',
      amount: 1.0,
      limitPrice: 2000,
      isBuy: false
    });

    const userOrder: OrderInput = {
      tokenIn: 'USDC',
      tokenOut: 'ETH',
      amount: '1.0',
      limitPrice: '2100', // Higher than sell price
      isBuy: true
    };

    const match = simulator.findMatch(userOrder);
    const result = simulator.simulateExecution(userOrder, match);

    expect(result.success).toBe(true);
    expect(result.matchedOrderId).toBe('test-sell');
    expect(result.executionPrice).toBeDefined();
    expect(result.amount).toBeDefined();
  });

  it('should not include match details when no match is found', () => {
    const simulator = new MarketMakerSimulator();
    simulator.clearOrders();

    // No resting orders, so no match possible
    const userOrder: OrderInput = {
      tokenIn: 'USDC',
      tokenOut: 'ETH',
      amount: '1.0',
      limitPrice: '2000',
      isBuy: true
    };

    const match = simulator.findMatch(userOrder);
    const result = simulator.simulateExecution(userOrder, match);

    expect(result.success).toBe(true);
    expect(result.matchedOrderId).toBeUndefined();
  });
});

export { orderInputArbitrary, isValidExecutionResult };
