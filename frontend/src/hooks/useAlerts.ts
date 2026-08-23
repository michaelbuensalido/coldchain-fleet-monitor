import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = 'http://localhost:3000';

interface Alert {
  id: string;
  vehicleId: string;
  vehicle: { id: string; name: string };
  severity: 'info' | 'warning' | 'critical';
  type: 'status_change' | 'temperature_excursion' | 'connectivity_loss';
  message: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  createdAt: string;
}

async function fetchAlerts(token: string): Promise<Alert[]> {
  const response = await fetch(`${API_BASE}/alerts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch alerts');
  return response.json();
}

async function fetchUnacknowledgedAlerts(token: string): Promise<Alert[]> {
  const response = await fetch(`${API_BASE}/alerts/unacknowledged`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch unacknowledged alerts');
  return response.json();
}

async function acknowledgeAlert(token: string, alertId: string, acknowledgedBy: string): Promise<Alert> {
  const response = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ acknowledgedBy }),
  });
  if (!response.ok) throw new Error('Failed to acknowledge alert');
  return response.json();
}

export function useAlerts() {
  const token = localStorage.getItem('token') || '';
  return useQuery({
    queryKey: ['alerts'],
    queryFn: () => fetchAlerts(token),
    enabled: !!token,
    refetchInterval: 5000,
  });
}

export function useUnacknowledgedAlerts() {
  const token = localStorage.getItem('token') || '';
  return useQuery({
    queryKey: ['alerts', 'unacknowledged'],
    queryFn: () => fetchUnacknowledgedAlerts(token),
    enabled: !!token,
    refetchInterval: 5000,
  });
}

function markAcknowledged(alert: Alert): Alert {
  return {
    ...alert,
    acknowledged: true,
    acknowledgedAt: new Date().toISOString(),
    acknowledgedBy: 'admin',
  };
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token') || '';

  return useMutation({
    mutationFn: (alertId: string) => acknowledgeAlert(token, alertId, 'admin'),
    onMutate: async (alertId) => {
      await queryClient.cancelQueries({ queryKey: ['alerts'] });
      const previous = queryClient.getQueryData<Alert[]>(['alerts']);
      const previousUnacked = queryClient.getQueryData<Alert[]>(['alerts', 'unacknowledged']);
      queryClient.setQueryData<Alert[]>(['alerts'], (current) =>
        (current || []).map((alert) => (alert.id === alertId ? markAcknowledged(alert) : alert)),
      );
      queryClient.setQueryData<Alert[]>(['alerts', 'unacknowledged'], (current) =>
        (current || []).filter((alert) => alert.id !== alertId),
      );
      return { previous, previousUnacked };
    },
    onError: (_err, _alertId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['alerts'], context.previous);
      }
      if (context?.previousUnacked) {
        queryClient.setQueryData(['alerts', 'unacknowledged'], context.previousUnacked);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts', 'unacknowledged'] });
    },
  });
}

async function acknowledgeAllAlerts(token: string, acknowledgedBy: string): Promise<void> {
  const response = await fetch(`${API_BASE}/alerts/acknowledge-all`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ acknowledgedBy }),
  });
  if (!response.ok) throw new Error('Failed to acknowledge alerts');
}

export function useAcknowledgeAllAlerts() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token') || '';

  return useMutation({
    mutationFn: () => acknowledgeAllAlerts(token, 'admin'),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['alerts'] });
      const previous = queryClient.getQueryData<Alert[]>(['alerts']);
      const previousUnacked = queryClient.getQueryData<Alert[]>(['alerts', 'unacknowledged']);
      queryClient.setQueryData<Alert[]>(['alerts'], (current) =>
        (current || []).map(markAcknowledged),
      );
      queryClient.setQueryData<Alert[]>(['alerts', 'unacknowledged'], []);
      return { previous, previousUnacked };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['alerts'], context.previous);
      }
      if (context?.previousUnacked) {
        queryClient.setQueryData(['alerts', 'unacknowledged'], context.previousUnacked);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts', 'unacknowledged'] });
    },
  });
}
