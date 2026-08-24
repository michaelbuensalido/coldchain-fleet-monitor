import {
  computeIncidentDurationSeconds,
  formatDuration,
  formatIncidentRange,
  isMinorSelfResolved,
  MINOR_SELF_RESOLVED_SECONDS,
} from './incident-duration';

describe('incident duration', () => {
  it('rounds duration from start to recovery timestamps', () => {
    const startedAt = new Date('2026-08-23T10:14:02.000Z');
    const endedAt = new Date('2026-08-23T10:20:32.000Z');
    expect(computeIncidentDurationSeconds(startedAt, endedAt)).toBe(6 * 60 + 30);
  });

  it('auto-acks recovered degraded incidents under the threshold', () => {
    expect(isMinorSelfResolved('degraded', 5)).toBe(true);
    expect(isMinorSelfResolved('degraded', MINOR_SELF_RESOLVED_SECONDS - 1)).toBe(true);
    expect(isMinorSelfResolved('degraded', MINOR_SELF_RESOLVED_SECONDS)).toBe(false);
    expect(isMinorSelfResolved('offline', 5)).toBe(false);
  });

  it('formats ranges the way the log displays them', () => {
    const startedAt = new Date('2026-08-23T10:14:02');
    const endedAt = new Date('2026-08-23T10:20:32');
    expect(formatDuration(390)).toBe('6m 30s');
    expect(formatIncidentRange('degraded', startedAt, endedAt, 390)).toBe(
      `Degraded ${startedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} → Recovered ${endedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} (6m 30s)`,
    );
  });
});
