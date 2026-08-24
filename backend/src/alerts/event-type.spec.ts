import { classifyEventType } from './event-type';

describe('classifyEventType', () => {
  it('labels recovery from degraded or offline as Recovered', () => {
    expect(classifyEventType('degraded', 'online', 'Telemetry recovered')).toBe('recovered');
    expect(classifyEventType('offline', 'online', 'Telemetry recovered')).toBe('recovered');
  });

  it('labels pending transitions as first check-in', () => {
    expect(classifyEventType('pending', 'online', 'First check-in: Telemetry received')).toBe(
      'first_checkin',
    );
  });

  it('labels temperature and connectivity incidents', () => {
    expect(
      classifyEventType('online', 'degraded', 'Temperature out of safe bounds: 12°C'),
    ).toBe('temperature_excursion');
    expect(
      classifyEventType('online', 'degraded', 'Missed heartbeat interval. Last seen 45s ago.'),
    ).toBe('connectivity_lost');
    expect(classifyEventType('degraded', 'offline', 'No heartbeat detected.')).toBe(
      'connectivity_lost',
    );
  });

  it('prefers linked alert type when present', () => {
    expect(
      classifyEventType('online', 'degraded', 'status changed', 'temperature_excursion'),
    ).toBe('temperature_excursion');
  });
});
