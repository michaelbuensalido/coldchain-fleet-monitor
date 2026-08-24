// Simple, type-safe XState setup or hand-coded behavior that matches XState structure.
// Let's implement the state machine logic cleanly since XState v5 types can be complex in NestJS tsconfig.
// Let's use simple logic or conform to XState v5 createMachine.
// In XState v5:
// - guards take an object containing { context, event }
// - interpret is replaced by createActor or we can construct a state machine evaluator to keep it robust and reliable without type issues.
// Let's implement a clean StateMachine class that acts as the required state machine but has zero compile/type issues.
// To satisfy "Do not replace XState with hand-rolled if/else status logic - the state machine is a required deliverable for the assignment"
// We will write the XState v5 compatible machine using its proper v5 syntax:

import { createMachine, createActor } from 'xstate';

export interface HealthContext {
  lastSeenDiffMs: number;
  heartbeatIntervalMs: number;
  temperature: number;
  tempMin: number;
  tempMax: number;
}

export type HealthEvent = { type: 'CHECK' };

export type VehicleHealthStatus = 'pending' | 'online' | 'degraded' | 'offline';

export function isVehicleHealthStatus(value: string): value is VehicleHealthStatus {
  return value === 'pending' || value === 'online' || value === 'degraded' || value === 'offline';
}

export function getNextHealthState(
  current: string,
  context: HealthContext,
): VehicleHealthStatus {
  const currentValue: VehicleHealthStatus = isVehicleHealthStatus(current) ? current : 'offline';
  const snapshot = vehicleHealthMachine.resolveState({
    value: currentValue,
    context,
  });
  const actor = createActor(vehicleHealthMachine, {
    input: context,
    snapshot,
  });
  actor.start();
  actor.send({ type: 'CHECK' });
  const next = actor.getSnapshot().value as VehicleHealthStatus;
  actor.stop();
  return next;
}

export const vehicleHealthMachine = createMachine({
  id: 'vehicleHealth',
  types: {} as {
    context: HealthContext;
    events: HealthEvent;
  },
  context: ({ input }) => input as HealthContext,
  initial: 'pending',
  states: {
    pending: {
      on: {
        CHECK: [
          { target: 'online' }
        ],
      },
    },
    online: {
      on: {
        CHECK: [
          { target: 'offline', guard: 'isOffline' },
          { target: 'degraded', guard: 'isDegraded' },
        ],
      },
    },
    degraded: {
      on: {
        CHECK: [
          { target: 'offline', guard: 'isOffline' },
          { target: 'online', guard: 'isOnline' },
        ],
      },
    },
    offline: {
      on: {
        CHECK: [
          { target: 'online', guard: 'isOnline' },
          { target: 'degraded', guard: 'isDegraded' },
        ],
      },
    },
  },
}, {
  guards: {
    isOffline: ({ context }) => {
      return context.lastSeenDiffMs > context.heartbeatIntervalMs * 3;
    },
    isDegraded: ({ context }) => {
      const tempOut = context.temperature < context.tempMin || context.temperature > context.tempMax;
      // Require two missed intervals so a 10s sweep does not flap a 5s heartbeat.
      const missingSomeHeartbeats =
        context.lastSeenDiffMs > context.heartbeatIntervalMs * 2 &&
        context.lastSeenDiffMs <= context.heartbeatIntervalMs * 3;
      return (tempOut || missingSomeHeartbeats) && context.lastSeenDiffMs <= context.heartbeatIntervalMs * 3;
    },
    isOnline: ({ context }) => {
      const tempIn = context.temperature >= context.tempMin && context.temperature <= context.tempMax;
      // Allow for sweep interval (10s) + one heartbeat interval to avoid false positives
      const healthyHeartbeat = context.lastSeenDiffMs <= context.heartbeatIntervalMs * 2;
      return tempIn && healthyHeartbeat;
    },
  }
});
