// Feature: shadow-book, Property 3: Order Book Invariant
// Validates: Requirements 2.1
//
// For any valid order submitted to the system, the order book length SHALL
// increase by exactly one, and the submitted order SHALL be retrievable
// from the order book with all fields preserved.

import fc from 'fast-check';
import { MarketMakerSimulator } from '../lib/market-maker';
import type { SimulatedOrder } from '../types';

// Arbitrary generator for simulated orders
const simulatedOrderArbitrary: fc.Arbitrary<SimulatedOrder> = fc.record({
  id: fc.uuid(),
  tokenIn: fc.constantFrom('ETH', 'USDC', 'WBTC'),
  tokenOut: fc.constantFrom('ETH', 'USDC', 'WBTC'),
  amount: fc.double({ min: 0.01, max: 100, noNaN: true }),
  limitPrice: fc.double({ min: 1, max: 10000, noNaN: true }),
  isBuy: fc.boolean()
});

describe('Shadow-Book Order Book Invariant Properties', () => {
  // Property 3: Order Book Invariant
  it('should increase order book length by exactly one when adding an order', () => {
    fc.assert(
      fc.property(simulatedOrderArbitrary, (order) => {
        const simulator = new MarketMakerSimulator();
        simulator.clearOrders();

        const initialLength = simulator.getRestingOrders().length;
        expect(initialLength).toBe(0);

        simulator.addRestingOrder(order);

        const newLength = simulator.getRestingOrders().length;
        expect(newLength).toBe(initialLength + 1);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve all order fields when adding to the book', () => {
    fc.assert(
      fc.property(simulatedOrderArbitrary, (order) => {
        const simulator = new MarketMakerSimulator();
        simulator.clearOrders();

        simulator.addRestingOrder(order);

        const orders = simulator.getRestingOrders();
        const retrievedOrder = orders.find((o) => o.id === order.id);

        expect(retrievedOrder).toBeDefined();
        if (retrievedOrder) {
          expect(retrievedOrder.id).toBe(order.id);
          expect(retrievedOrder.tokenIn).toBe(order.tokenIn);
          expect(retrievedOrder.tokenOut).toBe(order.tokenOut);
          expect(retrievedOrder.amount).toBe(order.amount);
          expect(retrievedOrder.limitPrice).toBe(order.limitPrice);
          expect(retrievedOrder.isBuy).toBe(order.isBuy);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain order book integrity across multiple additions', () => {
    fc.assert(
      fc.property(
        fc.array(simulatedOrderArbitrary, { minLength: 1, maxLength: 20 }),
        (orders) => {
          const simulator = new MarketMakerSimulator();
          simulator.clearOrders();

          // Add all orders
          orders.forEach((order) => simulator.addRestingOrder(order));

          // Verify count
          const finalOrders = simulator.getRestingOrders();
          expect(finalOrders.length).toBe(orders.length);

          // Verify all orders are present
          orders.forEach((order) => {
            const found = finalOrders.find((o) => o.id === order.id);
            expect(found).toBeDefined();
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should not modify existing orders when adding new ones', () => {
    fc.assert(
      fc.property(
        simulatedOrderArbitrary,
        simulatedOrderArbitrary,
        (order1, order2) => {
          // Ensure different IDs
          if (order1.id === order2.id) {
            order2 = { ...order2, id: order2.id + '-2' };
          }

          const simulator = new MarketMakerSimulator();
          simulator.clearOrders();

          // Add first order
          simulator.addRestingOrder(order1);
          const afterFirst = simulator.getRestingOrders();
          const firstOrderSnapshot = { ...afterFirst[0] };

          // Add second order
          simulator.addRestingOrder(order2);
          const afterSecond = simulator.getRestingOrders();

          // First order should be unchanged
          const firstOrderAfter = afterSecond.find((o) => o.id === order1.id);
          expect(firstOrderAfter).toBeDefined();
          if (firstOrderAfter) {
            expect(firstOrderAfter.id).toBe(firstOrderSnapshot.id);
            expect(firstOrderAfter.tokenIn).toBe(firstOrderSnapshot.tokenIn);
            expect(firstOrderAfter.tokenOut).toBe(firstOrderSnapshot.tokenOut);
            expect(firstOrderAfter.amount).toBe(firstOrderSnapshot.amount);
            expect(firstOrderAfter.limitPrice).toBe(
              firstOrderSnapshot.limitPrice
            );
            expect(firstOrderAfter.isBuy).toBe(firstOrderSnapshot.isBuy);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clear all orders when clearOrders is called', () => {
    fc.assert(
      fc.property(
        fc.array(simulatedOrderArbitrary, { minLength: 1, maxLength: 10 }),
        (orders) => {
          const simulator = new MarketMakerSimulator();

          // Add orders
          orders.forEach((order) => simulator.addRestingOrder(order));
          expect(simulator.getRestingOrders().length).toBeGreaterThan(0);

          // Clear
          simulator.clearOrders();
          expect(simulator.getRestingOrders().length).toBe(0);
        }
      ),
      { numRuns: 50 }
    );
  });
});

export { simulatedOrderArbitrary };
