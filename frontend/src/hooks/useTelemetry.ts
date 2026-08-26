import { useQuery } from '@tanstack/react-query';
import { API_BASE } from '../config';

interface TelemetryReading {
  id: string;
  vehicleId: string;
  timestamp: string;
  temperature: number;
  latitude: number;
  longitude: number;
  doorOpen: boolean;
}

async function fetchTelemetryHistory(token: string, vehicleId: string, limit = 100): Promise<TelemetryReading[]> {
  const response = await fetch(`${API_BASE}/telemetry/history/${vehicleId}?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch telemetry');
  return response.json();
}

export function useTelemetryHistory(vehicleId: string, limit = 100) {
  const token = localStorage.getItem('token') || '';
  return useQuery({
    queryKey: ['telemetry', vehicleId, limit],
    queryFn: () => fetchTelemetryHistory(token, vehicleId, limit),
    enabled: !!vehicleId && !!token,
    refetchInterval: 5000,
  });
}
