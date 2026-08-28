import { useQuery } from '@tanstack/react-query';
import { API_BASE, getAuthToken } from '../config';

interface StatusEvent {
  id: string;
  vehicleId: string;
  fromStatus: string;
  toStatus: string;
  timestamp: string;
}

async function fetchStatusEvents(vehicleId: string, token: string): Promise<StatusEvent[]> {
  const response = await fetch(`${API_BASE}/vehicles/${vehicleId}/status-events`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch status events');
  return response.json();
}

export function useDegradedDuration(vehicleId: string | null, currentStatus: string) {
  const token = getAuthToken();

  return useQuery({
    queryKey: ['status-events', vehicleId],
    queryFn: () => fetchStatusEvents(vehicleId || '', token),
    enabled: !!vehicleId && !!token && currentStatus === 'degraded',
    refetchInterval: 1000, // Update every second for live countdown
  });
}

export function getDegradedDurationSeconds(events: StatusEvent[]): number | null {
  if (!events || events.length === 0) return null;

  // Find the most recent transition to degraded
  const degradedEvent = events
    .filter((e) => e.toStatus === 'degraded')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  if (!degradedEvent) return null;

  return Math.floor((Date.now() - new Date(degradedEvent.timestamp).getTime()) / 1000);
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return 'N/A';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}
