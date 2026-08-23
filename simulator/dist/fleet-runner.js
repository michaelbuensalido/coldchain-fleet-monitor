"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const VEHICLE_COUNT = parseInt(process.env.VEHICLE_COUNT || '5', 10); // default to 5 for resource constraint
const processes = [];
async function startFleet() {
    console.log(`Initializing fleet of ${VEHICLE_COUNT} simulated vehicles against ${BACKEND_URL}`);
    try {
        // 1. Log in admin to provision vehicles and config profiles
        console.log('Logging in admin...');
        const loginRes = await axios_1.default.post(`${BACKEND_URL}/auth/login`, {
            email: 'admin@coldchain.com',
            password: 'adminpassword',
        });
        const token = loginRes.data.access_token;
        const authHeaders = { Authorization: `Bearer ${token}` };
        // 2. Create config profile
        console.log('Creating default config profile...');
        const configRes = await axios_1.default.post(`${BACKEND_URL}/configs`, {
            name: 'Pharma standard (2-8C)',
            tempMin: 2.0,
            tempMax: 8.0,
            heartbeatIntervalSecs: 5, // fast checks for lab/sim purposes
        }, { headers: authHeaders });
        const profile = configRes.data;
        console.log(`Created Config Profile: ${profile.id}`);
        // 3. Register vehicles and start their processes
        for (let i = 1; i <= VEHICLE_COUNT; i++) {
            const name = `Truck-${String(i).padStart(3, '0')}`;
            console.log(`Registering vehicle: ${name}...`);
            const vRes = await axios_1.default.post(`${BACKEND_URL}/vehicles`, { name, currentRoute: `Route-${String(100 + i)}` }, { headers: authHeaders });
            const { vehicle, apiKey } = vRes.data;
            console.log(`Registered vehicle ${vehicle.id}. API key generated.`);
            // Assign config profile to vehicle
            await axios_1.default.post(`${BACKEND_URL}/configs/assign`, { vehicleId: vehicle.id, configProfileId: profile.id }, { headers: authHeaders });
            console.log(`Assigned config profile to vehicle ${vehicle.id}`);
            // Stagger spawn
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const child = (0, child_process_1.fork)(path.join(__dirname, '..', 'dist', 'vehicle.js'), [
                vehicle.id,
                apiKey,
                BACKEND_URL,
                String(profile.heartbeatIntervalSecs),
                String(profile.tempMin),
                String(profile.tempMax),
            ]);
            processes.push(child);
            console.log(`Spawned simulator process for vehicle ${vehicle.id}`);
        }
        console.log('All fleet instances spawned successfully.');
    }
    catch (err) {
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
