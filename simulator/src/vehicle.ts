import axios from 'axios';

const VEHICLE_ID = process.argv[2];
const API_KEY = process.argv[3];
const BACKEND_URL = process.argv[4] || 'http://localhost:3000';
const HEARTBEAT_INTERVAL = parseInt(process.argv[5] || '60', 10);
const TEMP_MIN = parseFloat(process.argv[6] || '2.0');
const TEMP_MAX = parseFloat(process.argv[7] || '8.0');

if (!VEHICLE_ID || !API_KEY) {
  console.error('Usage: ts-node vehicle.ts <vehicleId> <apiKey> [backendUrl] [intervalSecs] [tempMin] [tempMax]');
  process.exit(1);
}

console.log(`Starting simulated vehicle ${VEHICLE_ID}`);
console.log(`Config: URL=${BACKEND_URL}, Interval=${HEARTBEAT_INTERVAL}s, TempRange=[${TEMP_MIN}, ${TEMP_MAX}]`);

// Initial coordinates (around Singapore area)
let latitude = 1.3521 + (Math.random() - 0.5) * 0.12;
let longitude = 103.8198 + (Math.random() - 0.5) * 0.2;

// Randomize initial temperature around center (e.g., between 3°C and 7°C)
let currentTemperature = (TEMP_MIN + TEMP_MAX) / 2 + (Math.random() - 0.5) * 2.5;
let doorOpen = Math.random() < 0.2;

// Flags for simulated scenarios
let disconnectCounter = 0;
let driftCounter = 0;

async function sendTelemetry() {
  // 1. Connectivity loss scenario simulation: 3% chance to simulate a disconnect of 2 heartbeats
  if (disconnectCounter > 0) {
    console.log(`[Vehicle ${VEHICLE_ID}] Simulated connectivity loss. Suppressing report.`);
    disconnectCounter--;
    scheduleNext();
    return;
  }
  if (Math.random() < 0.03) {
    console.log(`[Vehicle ${VEHICLE_ID}] Connection lost! Triggering disconnect simulation.`);
    disconnectCounter = 2;
    scheduleNext();
    return;
  }

  // 2. Temperature drift simulation
  let tempNoise = (Math.random() - 0.5) * 0.3;
  if (driftCounter > 0) {
    // Force drift outside bounds
    currentTemperature += 1.2;
    driftCounter--;
    console.log(`[Vehicle ${VEHICLE_ID}] Drifting temp: ${currentTemperature.toFixed(2)}°C`);
  } else {
    // Normal state or random drift trigger (3% chance per vehicle tick)
    if (Math.random() < 0.03) {
      console.log(`[Vehicle ${VEHICLE_ID}] Temperature excursion initiated!`);
      driftCounter = 3; // Drift for 3 ticks (~30s)
    }
    // Normal walk towards center point
    const target = (TEMP_MIN + TEMP_MAX) / 2;
    currentTemperature += (target - currentTemperature) * 0.15 + tempNoise;
  }

  // Ensure door fluctuates occasionally
  if (Math.random() < 0.08) {
    doorOpen = !doorOpen;
  }

  // GPS walk
  latitude += (Math.random() - 0.5) * 0.0015;
  longitude += (Math.random() - 0.5) * 0.0015;

  try {
    const payload = {
      temperature: parseFloat(currentTemperature.toFixed(2)),
      latitude: parseFloat(latitude.toFixed(6)),
      longitude: parseFloat(longitude.toFixed(6)),
      doorOpen,
    };

    console.log(`[Vehicle ${VEHICLE_ID}] Sending: Temp=${payload.temperature}°C, Door=${payload.doorOpen}, Pos=(${payload.latitude}, ${payload.longitude})`);
    
    await axios.post(`${BACKEND_URL}/telemetry`, payload, {
      headers: {
        'x-api-key': API_KEY,
      },
      timeout: 5000,
    });
  } catch (err: any) {
    console.error(`[Vehicle ${VEHICLE_ID}] Telemetry send failed: ${err.message}`);
  }

  scheduleNext();
}

function scheduleNext() {
  // Add random jitter of ±2000ms around interval to keep vehicles desynchronized
  const jitter = (Math.random() - 0.5) * 4000;
  const nextDelay = Math.max(2000, HEARTBEAT_INTERVAL * 1000 + jitter);
  setTimeout(sendTelemetry, nextDelay);
}

// Initial desynchronized startup phase offset (0-5s delay per vehicle)
const initialPhaseOffset = Math.random() * 5000;
setTimeout(sendTelemetry, initialPhaseOffset);
