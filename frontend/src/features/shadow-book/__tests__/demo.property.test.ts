// Feature: shadow-book, Property 7: Demo Mode Fallback
// Validates: Requirements 8.4
//
// For any order submission WHEN the contract is not deployed (demo mode),
// the system SHALL return a mocked ExecutionResult with valid structure
// containing ordersScanned, executionTimeMs, and gasUsed fields within realistic ranges.

import fc from 'fast-check';
import { isContractDeployed } from '../lib/wagmi-config';
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

// Helper to validate demo mode execution result
function isValidDemoResult(result: ExecutionResult): boolean {
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

  // Must have executionTimeMs as positive number within realistic range
  if (
    typeof result.executionTimeMs !== 'number' ||
    result.executionTimeMs < 0 ||
    result.executionTimeMs > 1000 // Should be fast in demo mode
  ) {
    return false;
  }

  // Must have gasUsed as valid string
  if (typeof result.gasUsed !== 'string' || result.gasUsed.length === 0) {
    return false;
  }

  return true;
}

// Synchronous simulation for testing (no network delay)
function simulateTradeSync(order: OrderInput): ExecutionResult {
  const simulator = new MarketMakerSimulator();
  simulator.generateRestingOrders(10);
  const match = simulator.findMatch(order);
  return simulator.simulateExecution(order, match);
}

describe('Shadow-Book Demo Mode Fallback Properties', () => {
  // Verify we're in demo mode (contract not deployed)
  it('should detect contract is not deployed (demo mode active)', () => {
    // The placeholder address indicates demo mode
    expect(isContractDeployed()).toBe(false);
  });

  // Property 7: Demo Mode Fallback
  it('should return valid ExecutionResult structure in demo mode', () => {
    fc.assert(
      fc.property(orderInputArbitrary, (order) => {
        const result = simulateTradeSync(order);
        expect(isValidDemoResult(result)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should have ordersScanned within realistic range', () => {
    fc.assert(
      fc.property(orderInputArbitrary, (order) => {
        const result = simulateTradeSync(order);

        // Should scan at least as many orders as generated
        expect(result.ordersScanned).toBeGreaterThanOrEqual(10);
        expect(result.ordersScanned).toBeLessThan(200);
      }),
      { numRuns: 100 }
    );
  });

  it('should have executionTimeMs within Stylus-realistic range', () => {
    fc.assert(
      fc.property(orderInputArbitrary, (order) => {
        const result = simulateTradeSync(order);

        // Stylus execution should be very fast (10-50ms simulated)
        expect(result.executionTimeMs).toBeGreaterThan(0);
        expect(result.executionTimeMs).toBeLessThan(100);
      }),
      { numRuns: 100 }
    );
  });

  it('should have gasUsed in ETH format with negligible value', () => {
    fc.assert(
      fc.property(orderInputArbitrary, (order) => {
        const result = simulateTradeSync(order);

        // Gas should be in ETH format
        expect(result.gasUsed).toContain('ETH');

        // Parse the gas value
        const gasValue = parseFloat(result.gasUsed);
        expect(gasValue).toBeGreaterThan(0);
        expect(gasValue).toBeLessThan(0.01); // Negligible gas in Stylus
      }),
      { numRuns: 100 }
    );
  });

  it('should always return success in demo mode', () => {
    fc.assert(
      fc.property(orderInputArbitrary, (order) => {
        const result = simulateTradeSync(order);

        // Demo mode should always succeed
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle various order sizes consistently', () => {
    const smallOrder: OrderInput = {
      tokenIn: 'ETH',
      tokenOut: 'USDC',
      amount: '0.01',
      isBuy: false
    };

    const largeOrder: OrderInput = {
      tokenIn: 'ETH',
      tokenOut: 'USDC',
      amount: '100',
      isBuy: false
    };

    const smallResult = simulateTradeSync(smallOrder);
    const largeResult = simulateTradeSync(largeOrder);

    // Both should return valid results
    expect(isValidDemoResult(smallResult)).toBe(true);
    expect(isValidDemoResult(largeResult)).toBe(true);

    // Both should succeed
    expect(smallResult.success).toBe(true);
    expect(largeResult.success).toBe(true);
  });
});

export { isValidDemoResult };
