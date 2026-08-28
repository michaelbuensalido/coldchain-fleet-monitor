import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE, getAuthToken } from '../config';

export interface StatusEvent {
  id: string;
  vehicleId: string;
  vehicle: { name: string };
  fromStatus: string;
  toStatus: string;
  reason: string;
  timestamp: string;
  durationSeconds: number | null;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  minor: boolean;
  eventType?: string;
  eventLabel?: string;
}

export interface EventsResponse {
  events: StatusEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EventsFilters {
  vehicleId?: string;
  status?: string;
  from?: string;
  to?: string;
  acknowledged?: string;
  page: number;
  limit: number;
}

async function fetchEvents(token: string, filters: EventsFilters): Promise<EventsResponse> {
  const params = new URLSearchParams();
  if (filters.vehicleId && filters.vehicleId !== 'all') {
    params.append('vehicleId', filters.vehicleId);
  }
  if (filters.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }
  if (filters.from) {
    params.append('from', filters.from);
  }
  if (filters.to) {
    params.append('to', filters.to);
  }
  if (filters.acknowledged && filters.acknowledged !== 'all') {
    params.append('acknowledged', filters.acknowledged);
  }
  params.append('page', String(filters.page));
  params.append('limit', String(filters.limit));

  const response = await fetch(`${API_BASE}/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch historical events');
  return response.json();
}

async function acknowledgeEvent(token: string, eventId: string): Promise<StatusEvent> {
  const response = await fetch(`${API_BASE}/events/${eventId}/acknowledge`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to acknowledge status event');
  return response.json();
}

export function useEvents(filters: EventsFilters) {
  const token = getAuthToken();
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => fetchEvents(token, filters),
    enabled: !!token,
    refetchInterval: 15000,
  });
}

export function useAcknowledgeEvent() {
  const queryClient = useQueryClient();
  const token = getAuthToken();

  return useMutation({
    mutationFn: (eventId: string) => acknowledgeEvent(token, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
