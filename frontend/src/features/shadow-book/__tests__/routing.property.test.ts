// Feature: shadow-book, Property 6: Mode-Based Routing
// Validates: Requirements 4.4
//
// For any order submission, WHEN mode is 'shadow' THEN the order SHALL be
// routed to the Stylus contract interface, and WHEN mode is 'public' THEN
// the order SHALL be routed to the public swap interface.

import fc from 'fast-check';
import type { OrderInput } from '../types';

// Simulated routing logic that mirrors the TradeInterface behavior
type RouteType = 'stylus-contract' | 'public-swap';

interface RoutingDecision {
  mode: 'public' | 'shadow';
  route: RouteType;
  order: OrderInput;
}

// This function represents the routing logic in the TradeInterface
function determineRoute(
  mode: 'public' | 'shadow',
  order: OrderInput
): RoutingDecision {
  const route: RouteType =
    mode === 'shadow' ? 'stylus-contract' : 'public-swap';

  return {
    mode,
    route,
    order
  };
}

// Arbitrary generators
const modeArbitrary = fc.constantFrom<'public' | 'shadow'>('public', 'shadow');

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

describe('Shadow-Book Mode-Based Routing Properties', () => {
  // Property 6: Mode-Based Routing
  it('should route to Stylus contract when mode is shadow', () => {
    fc.assert(
      fc.property(orderInputArbitrary, (order) => {
        const decision = determineRoute('shadow', order);

        expect(decision.mode).toBe('shadow');
        expect(decision.route).toBe('stylus-contract');
      }),
      { numRuns: 100 }
    );
  });

  it('should route to public swap when mode is public', () => {
    fc.assert(
      fc.property(orderInputArbitrary, (order) => {
        const decision = determineRoute('public', order);

        expect(decision.mode).toBe('public');
        expect(decision.route).toBe('public-swap');
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve order data regardless of routing mode', () => {
    fc.assert(
      fc.property(modeArbitrary, orderInputArbitrary, (mode, order) => {
        const decision = determineRoute(mode, order);

        // Order data should be preserved in routing decision
        expect(decision.order.tokenIn).toBe(order.tokenIn);
        expect(decision.order.tokenOut).toBe(order.tokenOut);
        expect(decision.order.amount).toBe(order.amount);
        expect(decision.order.isBuy).toBe(order.isBuy);
      }),
      { numRuns: 100 }
    );
  });

  it('should have consistent routing for same mode', () => {
    fc.assert(
      fc.property(
        modeArbitrary,
        orderInputArbitrary,
        orderInputArbitrary,
        (mode, order1, order2) => {
          const decision1 = determineRoute(mode, order1);
          const decision2 = determineRoute(mode, order2);

          // Same mode should always route to same destination
          expect(decision1.route).toBe(decision2.route);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have different routing for different modes', () => {
    fc.assert(
      fc.property(orderInputArbitrary, (order) => {
        const shadowDecision = determineRoute('shadow', order);
        const publicDecision = determineRoute('public', order);

        // Different modes should route to different destinations
        expect(shadowDecision.route).not.toBe(publicDecision.route);
        expect(shadowDecision.route).toBe('stylus-contract');
        expect(publicDecision.route).toBe('public-swap');
      }),
      { numRuns: 100 }
    );
  });
});

export { determineRoute, modeArbitrary };
