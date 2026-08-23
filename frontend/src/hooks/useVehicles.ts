import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = 'http://localhost:3000';

interface Vehicle {
  id: string;
  name: string;
  status: string;
  currentRoute: string | null;
  configProfileId: string | null;
  active: boolean;
  createdAt: string;
}

interface CreateVehicleResponse {
  vehicle: Vehicle;
  apiKey: string;
}

async function fetchVehicles(token: string): Promise<Vehicle[]> {
  const response = await fetch(`${API_BASE}/vehicles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch vehicles');
  return response.json();
}

async function createVehicle(token: string, data: { name: string; currentRoute?: string }): Promise<CreateVehicleResponse> {
  const response = await fetch(`${API_BASE}/vehicles`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create vehicle');
  return response.json();
}

async function updateVehicle(token: string, id: string, data: { name?: string; currentRoute?: string; active?: boolean }): Promise<Vehicle> {
  const response = await fetch(`${API_BASE}/vehicles/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update vehicle');
  return response.json();
}

export function useVehicles() {
  const token = localStorage.getItem('token') || '';
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: () => fetchVehicles(token),
    enabled: !!token,
    refetchInterval: 5000,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token') || '';

  return useMutation({
    mutationFn: (data: { name: string; currentRoute?: string }) => createVehicle(token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token') || '';

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; currentRoute?: string; active?: boolean } }) =>
      updateVehicle(token, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}
