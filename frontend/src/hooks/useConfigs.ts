import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = 'http://localhost:3000';

interface ConfigProfile {
  id: string;
  name: string;
  tempMin: number;
  tempMax: number;
  heartbeatIntervalSecs: number;
}

async function fetchConfigs(token: string): Promise<ConfigProfile[]> {
  const response = await fetch(`${API_BASE}/configs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch configs');
  return response.json();
}

async function createConfig(token: string, data: Omit<ConfigProfile, 'id'>): Promise<ConfigProfile> {
  const response = await fetch(`${API_BASE}/configs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create config');
  return response.json();
}

async function assignConfig(token: string, vehicleId: string, configProfileId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/configs/assign`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ vehicleId, configProfileId }),
  });
  if (!response.ok) throw new Error('Failed to assign config');
}

export function useConfigs() {
  const token = localStorage.getItem('token') || '';
  return useQuery({
    queryKey: ['configs'],
    queryFn: () => fetchConfigs(token),
    enabled: !!token,
  });
}

export function useCreateConfig() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token') || '';

  return useMutation({
    mutationFn: (data: Omit<ConfigProfile, 'id'>) => createConfig(token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
    },
  });
}

export function useAssignConfig() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token') || '';

  return useMutation({
    mutationFn: ({ vehicleId, configProfileId }: { vehicleId: string; configProfileId: string }) =>
      assignConfig(token, vehicleId, configProfileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}
