# 🚛 ColdChainIQ — Real-Time Cold Chain Fleet Monitoring System

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

**ColdChainIQ** is a full-stack, enterprise-grade cold chain fleet monitoring platform designed for real-time tracking of temperature-sensitive transport assets (pharmaceuticals, food, perishables). It features real-time WebSocket telemetry, automated status transition state machines powered by XState, alerting for temperature excursions and connectivity dropouts, configuration profile management, and a complete historical audit log.

---

## 📸 Key Interfaces & Features

### 📍 1. Interactive Live Fleet Map & Telemetry
- **Full-Bleed Dark Mode Map**: Built with React-Leaflet and CARTO Dark vector tiles.
- **Dynamic Vehicle Markers**: Vector status rings colored by health (`online`, `degraded`, `offline`, `pending`) with pulsing glowing halos and clickable truck name tags (`Truck-001`).
- **Telemetry Popups**: Real-time floating telemetry cards showing cargo temperature, position, door status (`OPEN` / `CLOSED`), and timestamp.
- **Custom Zoom & View Controls**: Top-right dark glassmorphism Zoom In (`+`), Zoom Out (`-`), and Fit Fleet (`Maximize2`) map controls.

### 🧭 2. Vertical Icon Rail & Slide-Out Panels
- **Google Maps-Style Navigation**: Fixed 72px left icon rail featuring 5 primary slots: **Live Overview**, **Alerts**, **History**, **Config**, and **Provision**.
- **Adjacent Slide-Out Panels**: 420px slide-out container with click-outside backdrop dismissal and keyboard shortcuts (`Escape` key navigation).

### 📋 3. Audit History & Event Log
- **Full Audit Record**: Paginated historical audit log tracking all status-change events (`temperature_excursion`, `connectivity_lost`, `recovered`, `first_checkin`).
- **Multi-Param Filtering**: Filter events by vehicle, event type, date range, and acknowledgment status.
- **Visual Alert Priority**: Unacknowledged incidents stand out with red background tinting and left red accent bars; 5+ minute incidents highlight duration in bold amber.

### ⚙️ 4. Config Profile Management & Provisioning
- **Threshold Profiles**: Create custom thermal envelopes (`tempMin`, `tempMax`, `heartbeatIntervalSecs`) and assign them to specific vehicles.
- **Vehicle Provisioning**: Provision new transport vehicles into the system starting in a `pending` state until initial telemetry is received.

### 🛰️ 5. Real-Time Telemetry Simulator
- **Multi-Truck Simulator**: Node.js telemetry generator simulating live GPS movement along routes, cargo thermal dynamics, door sensor state toggles, temperature excursions, and connection loss/recovery.

---

## 🛠️ Tech Stack Architecture

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend UI** | React 18, Vite, TypeScript, TailwindCSS, Lucide Icons, Leaflet / React-Leaflet, Recharts |
| **State & Data** | TanStack React Query (v5), Socket.io-client, React Router v6 |
| **Backend API** | NestJS (v11), Node.js, Express, RxJS, Passport JWT Authentication |
| **State Machine** | XState (v5) finite state machine governing vehicle health states (`pending` ➔ `online` ⇄ `degraded` ⇄ `offline`) |
| **Database & Cache**| PostgreSQL 15, Prisma ORM (v7), Redis 7 (caching & pub/sub messaging) |
| **Real-Time Engine**| Socket.io WebSockets, NestJS WebSockets Gateway |
| **Containerization**| Docker, Docker Compose |

---

## 📁 Repository Structure

```text
ColdChainIQ/
├── backend/                  # NestJS API Backend
│   ├── src/
│   │   ├── alerts/           # Alerts & Event Audit controllers, services, gateway
│   │   ├── auth/             # Passport JWT auth, login/register, local strategy
│   │   ├── config/           # Temperature configuration profiles controller/service
│   │   ├── prisma/           # Prisma DB service & schema definitions
│   │   ├── state-machine/    # XState vehicle lifecycle state machine logic
│   │   ├── telemetry/        # Telemetry ingest, WebSocket gateway, & sweep worker
│   │   └── vehicles/         # Vehicle provisioning & status controllers
│   ├── prisma/               # Schema definitions & DB migration scripts
│   └── package.json
├── frontend/                 # React + Vite Dashboard Application
│   ├── src/
│   │   ├── assets/           # Brand assets (logo.png)
│   │   ├── components/       # NavRail, Sidebar, FleetMap, HistoryPanelContent, AlertsPanel, etc.
│   │   ├── hooks/            # React Query hooks for vehicles, telemetry, alerts, events
│   │   ├── pages/            # Dashboard, Login, HistoryLog
│   │   ├── theme/            # Shared design tokens (surface, type, icon, severityColor)
│   │   └── index.css         # Tailwind directives & dark mode glassmorphism styles
│   └── package.json
├── simulator/                # Multi-Vehicle Telemetry Simulator (Node.js script)
│   ├── index.js              # Telemetry simulator generator
│   └── package.json
├── docker-compose.yml        # Docker Compose configuration (PostgreSQL + Redis)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local development machine:
- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher
- **Docker & Docker Compose**: Required for running PostgreSQL and Redis services.

---

### Quick Start with Docker Compose (Recommended)

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/michaelbuensalido/coldchain-fleet-monitor.git
   cd coldchain-fleet-monitor
   ```

2. **Start Infrastructure Services (PostgreSQL + Redis)**:
   ```bash
   docker-compose up -d
   ```
   *PostgreSQL will run on port `5432` and Redis on port `6379`.*

3. **Set Up & Run the Backend API**:
   ```bash
   cd backend
   npm install
   npx prisma db push
   npx prisma db seed
   npm run start:dev
   ```
   *Backend API runs at `http://localhost:3000`.*

4. **Set Up & Run the Frontend Dashboard**:
   ```bash
   # Open a new terminal window
   cd frontend
   npm install
   npm run dev
   ```
   *Frontend Dashboard runs at `http://localhost:5173`.*

5. **Start the Telemetry Simulator**:
   ```bash
   # Open a new terminal window
   cd simulator
   npm install
   npm start
   ```
   *The simulator will start transmitting live telemetry snapshots via WebSocket/HTTP to the backend.*

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/coldchain?schema=public"
REDIS_HOST="localhost"
REDIS_PORT=6379
JWT_SECRET="coldchain-super-secret-jwt-key"
PORT=3000
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL="http://localhost:3000"
VITE_WS_URL="http://localhost:3000"
```

---

## 📡 REST API & WebSocket Endpoint Reference

### Authentication
- `POST /auth/register` — Register a new fleet administrator account.
- `POST /auth/login` — Authenticate credentials and receive a JWT access token.

### Vehicles & Provisioning
- `GET /vehicles` — Fetch all fleet vehicles and their current health status.
- `POST /vehicles` — Provision a new vehicle (initial status: `pending`).
- `GET /vehicles/:id` — Fetch detailed vehicle information.

### Live Telemetry
- `POST /telemetry` — Ingest raw vehicle telemetry payload (temp, coordinates, door status).
- `GET /telemetry/latest` — Fetch latest telemetry snapshot for all fleet vehicles.
- `GET /telemetry/history?vehicleId=:id` — Fetch historic telemetry records for a vehicle.

### Alerts & Event Audit Log
- `GET /alerts` — Fetch live unresolved fleet alerts.
- `PUT /alerts/:id/acknowledge` — Acknowledge a specific alert.
- `PUT /alerts/acknowledge-all` — Acknowledge all active fleet alerts.
- `GET /events` — Query historical status-change audit trail (supports `vehicleId`, `status`, `from`, `to`, `acknowledged`, `page`, `limit`).
- `PUT /events/:id/acknowledge` — Acknowledge an audit log event.

### Config Profiles
- `GET /configs` — Fetch temperature configuration profiles.
- `POST /configs` — Create a new thermal threshold profile (`tempMin`, `tempMax`, `heartbeatIntervalSecs`).
- `POST /configs/assign` — Assign a configuration profile to a fleet vehicle.

### Real-Time WebSocket Events (`Socket.io`)
- `telemetryUpdate` — Emitted to connected dashboard clients whenever new vehicle telemetry arrives.
- `alertCreated` — Emitted when a vehicle experiences a temperature excursion or connectivity loss.

---

## 🧪 Testing & Production Build

### Frontend Production Build
```bash
cd frontend
npm run build
```
*Compiles TypeScript and bundles production assets into `frontend/dist/` (`tsc -b && vite build`).*

### Backend Tests
```bash
cd backend
npm run test
```
*Runs NestJS unit tests with Jest.*

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Author

Developed by **Michael Buensalido**  
GitHub: [@michaelbuensalido](https://github.com/michaelbuensalido)
