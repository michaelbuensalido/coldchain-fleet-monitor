"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const VEHICLE_ID = process.argv[2];
const API_KEY = process.argv[3];
const BACKEND_URL = process.argv[4] || 'http://localhost:3000';
const HEARTBEAT_INTERVAL = parseInt(process.argv[5] || '30', 10);
const TEMP_MIN = parseFloat(process.argv[6] || '2.0');
const TEMP_MAX = parseFloat(process.argv[7] || '8.0');
if (!VEHICLE_ID || !API_KEY) {
    console.error('Usage: ts-node vehicle.ts <vehicleId> <apiKey> [backendUrl] [intervalSecs] [tempMin] [tempMax]');
    process.exit(1);
}
console.log(`Starting simulated vehicle ${VEHICLE_ID}`);
console.log(`Config: URL=${BACKEND_URL}, Interval=${HEARTBEAT_INTERVAL}s, TempRange=[${TEMP_MIN}, ${TEMP_MAX}]`);
// Initial coordinates (around Seattle area)
let latitude = 47.6062 + (Math.random() - 0.5) * 0.1;
let longitude = -122.3321 + (Math.random() - 0.5) * 0.1;
let currentTemperature = (TEMP_MIN + TEMP_MAX) / 2; // Start in the middle
let doorOpen = false;
// Flags for simulated scenarios
let disconnectCounter = 0;
let driftCounter = 0;
async function sendTelemetry() {
    // 1. Connectivity loss scenario simulation: 10% chance to simulate a disconnect of 3 heartbeats
    if (disconnectCounter > 0) {
        console.log(`[Vehicle ${VEHICLE_ID}] Simulated connectivity loss. Suppressing report.`);
        disconnectCounter--;
        return;
    }
    if (Math.random() < 0.05) {
        console.log(`[Vehicle ${VEHICLE_ID}] Connection lost! Triggering disconnect simulation.`);
        disconnectCounter = 3;
        return;
    }
    // 2. Temperature drift simulation
    let tempNoise = (Math.random() - 0.5) * 0.4;
    if (driftCounter > 0) {
        // Force drift outside bounds
        currentTemperature += 1.5; // Exceed max
        driftCounter--;
        console.log(`[Vehicle ${VEHICLE_ID}] Drifting temp: ${currentTemperature.toFixed(2)}°C`);
    }
    else {
        // Normal state or random drift trigger (5% chance)
        if (Math.random() < 0.05) {
            console.log(`[Vehicle ${VEHICLE_ID}] Temperature excursion initiated!`);
            driftCounter = 5; // Drift for 5 ticks
        }
        // Normal walk towards center point
        const target = (TEMP_MIN + TEMP_MAX) / 2;
        currentTemperature += (target - currentTemperature) * 0.1 + tempNoise;
    }
    // Ensure door fluctuates occasionally
    if (Math.random() < 0.1) {
        doorOpen = !doorOpen;
    }
    // GPS walk
    latitude += (Math.random() - 0.5) * 0.002;
    longitude += (Math.random() - 0.5) * 0.002;
    try {
        const payload = {
            temperature: parseFloat(currentTemperature.toFixed(2)),
            latitude: parseFloat(latitude.toFixed(6)),
            longitude: parseFloat(longitude.toFixed(6)),
            doorOpen,
        };
        console.log(`[Vehicle ${VEHICLE_ID}] Sending: Temp=${payload.temperature}°C, Door=${payload.doorOpen}, Pos=(${payload.latitude}, ${payload.longitude})`);
        await axios_1.default.post(`${BACKEND_URL}/telemetry`, payload, {
            headers: {
                'x-api-key': API_KEY,
            },
            timeout: 5000,
        });
    }
    catch (err) {
        console.error(`[Vehicle ${VEHICLE_ID}] Telemetry send failed: ${err.message}`);
    }
}
// Start interval loop
setInterval(sendTelemetry, HEARTBEAT_INTERVAL * 1000);
// Send first reading immediately
sendTelemetry();
