const VEHICLE_STATUSES = new Set(['online', 'degraded', 'offline', 'pending']);

export type EventType =
  | 'temperature_excursion'
  | 'connectivity_lost'
  | 'recovered'
  | 'first_checkin'
  | 'status_change';

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  temperature_excursion: 'Temperature excursion',
  connectivity_lost: 'Connectivity lost',
  recovered: 'Recovered',
  first_checkin: 'First check-in',
  status_change: 'Status change',
};

export function classifyEventType(
  fromStatus: string,
  toStatus: string,
  reason: string,
  alertType?: string | null,
): EventType {
  const isRecovery =
    toStatus === 'online' && (fromStatus === 'degraded' || fromStatus === 'offline');
  if (isRecovery) return 'recovered';
  if (fromStatus === 'pending') return 'first_checkin';

  if (alertType === 'temperature_excursion') return 'temperature_excursion';
  if (alertType === 'connectivity_loss') return 'connectivity_lost';

  const r = reason.toLowerCase();
  if (r.includes('temperature') || r.includes('temp')) return 'temperature_excursion';
  if (r.includes('heartbeat') || r.includes('connectivity') || toStatus === 'offline') {
    return 'connectivity_lost';
  }
  if (toStatus === 'degraded') return 'temperature_excursion';
  return 'status_change';
}

export function isVehicleStatus(value: string): boolean {
  return VEHICLE_STATUSES.has(value);
}
