import axios from 'axios';
import { fork, ChildProcess } from 'child_process';
import * as path from 'path';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const VEHICLE_COUNT = parseInt(process.env.VEHICLE_COUNT || '20', 10); // default to 20 vehicles (5 initial + 15 added)

const processes: ChildProcess[] = [];

async function startFleet() {
  console.log(`Initializing fleet of ${VEHICLE_COUNT} simulated vehicles against ${BACKEND_URL}`);

  try {
    // 1. Log in admin to provision vehicles and config profiles
    console.log('Logging in admin...');
    const loginRes = await axios.post(`${BACKEND_URL}/auth/login`, {
      email: 'admin@coldchain.com',
      password: 'adminpassword',
    });
    const token = loginRes.data.access_token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Create config profile
    console.log('Creating default config profile...');
    const configRes = await axios.post(
      `${BACKEND_URL}/configs`,
      {
        name: 'Pharma standard (2-8C)',
        tempMin: 2.0,
        tempMax: 8.0,
        heartbeatIntervalSecs: 10, // 10 seconds heartbeat interval
      },
      { headers: authHeaders },
    );
    const profile = configRes.data;
    console.log(`Created Config Profile: ${profile.id}`);

    // 3. Register vehicles and start their processes
    for (let i = 1; i <= VEHICLE_COUNT; i++) {
      const name = `Truck-${String(i).padStart(3, '0')}`;
      console.log(`Registering vehicle: ${name}...`);

      const vRes = await axios.post(
        `${BACKEND_URL}/vehicles`,
        { name, currentRoute: `Route-SG${String(i).padStart(2, '0')}` },
        { headers: authHeaders },
      );

      const { vehicle, apiKey } = vRes.data;
      console.log(`Registered vehicle ${vehicle.id}. API key generated.`);

      // Assign config profile to vehicle
      await axios.post(
        `${BACKEND_URL}/configs/assign`,
        { vehicleId: vehicle.id, configProfileId: profile.id },
        { headers: authHeaders },
      );
      console.log(`Assigned config profile to vehicle ${vehicle.id}`);

      // Stagger spawn (300ms delay per vehicle)
      await new Promise((resolve) => setTimeout(resolve, 300));

      const child = fork(
        path.join(__dirname, '..', 'dist', 'vehicle.js'),
        [
          vehicle.id,
          apiKey,
          BACKEND_URL,
          String(profile.heartbeatIntervalSecs),
          String(profile.tempMin),
          String(profile.tempMax),
        ],
      );

      processes.push(child);
      console.log(`Spawned simulator process for vehicle ${vehicle.id}`);
    }

    console.log('All fleet instances spawned successfully.');
  } catch (err: any) {
    console.error('Failed to boot simulator fleet:', err.response?.data || err.message);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.log('Stopping fleet simulator...');
  for (const proc of processes) {
    proc.kill();
  }
  process.exit(0);
});

startFleet();
