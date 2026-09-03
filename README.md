#  ColdChainIQ — Real-Time Cold Chain Fleet Monitoring System

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

**ColdChainIQ** is a full-stack, enterprise-grade cold chain fleet monitoring platform designed for real-time tracking of temperature-sensitive transport assets (pharmaceuticals, food, perishables). It features real-time WebSocket telemetry, automated status transition state machines powered by XState, alerting for temperature excursions and connectivity dropouts, configuration profile management, and a complete historical audit log.

---

##  Key Interfaces & Features

###  1. Interactive Live Fleet Map & Telemetry

- **Full-Bleed Dark Mode Map**: Built with React-Leaflet and CARTO Dark vector tiles.
- **Dynamic Vehicle Markers**: Vector status rings colored by health (`online`, `degraded`, `offline`, `pending`) with pulsing glowing halos and clickable truck name tags (`Truck-001`).
- **Telemetry Popups**: Real-time floating telemetry cards showing cargo temperature, position, door status (`OPEN` / `CLOSED`), and timestamp.
- **Custom Zoom & View Controls**: Top-right dark glassmorphism Zoom In (`+`), Zoom Out (`-`), and Fit Fleet (`Maximize2`) map controls.

###  2. Vertical Icon Rail & Slide-Out Panels

- **Google Maps-Style Navigation**: Fixed 72px left icon rail featuring 5 primary slots: **Live Overview**, **Alerts**, **History**, **Config**, and **Provision**.
- **Adjacent Slide-Out Panels**: 420px slide-out container with click-outside backdrop dismissal and keyboard shortcuts (`Escape` key navigation).

###  3. Audit History & Event Log

- **Full Audit Record**: Paginated historical audit log tracking all status-change events (`temperature_excursion`, `connectivity_lost`, `recovered`, `first_checkin`).
- **Multi-Param Filtering**: Filter events by vehicle, event type, date range, and acknowledgment status.
- **Visual Alert Priority**: Unacknowledged incidents stand out with red background tinting and left red accent bars; 5+ minute incidents highlight duration in bold amber.

###  4. Config Profile Management & Provisioning

- **Threshold Profiles**: Create custom thermal envelopes (`tempMin`, `tempMax`, `heartbeatIntervalSecs`) and assign them to specific vehicles.
- **Vehicle Provisioning**: Provision new transport vehicles into the system starting in a `pending` state until initial telemetry is received.

###  5. Real-Time Telemetry Simulator

- **Multi-Truck Simulator**: Node.js telemetry generator simulating live GPS movement along routes, cargo thermal dynamics, door sensor state toggles, temperature excursions, and connection loss/recovery.

---

##  Tech Stack Architecture

| Layer                | Technologies Used                                                                                                |
| :------------------- | :--------------------------------------------------------------------------------------------------------------- |
| **Frontend UI**      | React 18, Vite, TypeScript, TailwindCSS, Lucide Icons, Leaflet / React-Leaflet, Recharts                         |
| **State & Data**     | TanStack React Query (v5), Socket.io-client, React Router v6                                                     |
| **Backend API**      | NestJS (v11), Node.js, Express, RxJS, Passport JWT Authentication                                                |
| **State Machine**    | XState (v5) finite state machine governing vehicle health states (`pending` ➔ `online` ⇄ `degraded` ⇄ `offline`) |
| **Database & Cache** | PostgreSQL 15, Prisma ORM (v7), Redis 7 (caching & pub/sub messaging)                                            |
| **Real-Time Engine** | Socket.io WebSockets, NestJS WebSockets Gateway                                                                  |
| **Containerization** | Docker, Docker Compose                                                                                           |

---
