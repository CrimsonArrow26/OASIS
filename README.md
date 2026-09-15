# Maritime Sentinel

> **Autonomous Satellite SAR Oil Spill Detection & Vessel Attribution System**
> Command & Control (C2) Maritime Surveillance Workstation

---

## 📌 Overview

**Maritime Sentinel** is an operational maritime domain awareness and intelligence platform designed to detect, track, and attribute marine oil spill incidents using Synthetic Aperture Radar (SAR) satellite imagery and Automatic Identification System (AIS) vessel tracking data.

The system correlates detected slick footprints with hydrodynamic drift models (hindcast & forecast) and historical vessel trajectories to pinpoint source discharge locations and assign weighted attribution scores to suspect vessels.

---

## 🚀 Key Features

### 🛰️ Synthetic Aperture Radar (SAR) Analysis
- **Satellite Ingestion**: Ingests Sentinel-1 C-Band SAR imagery (VV/VH dual-polarization).
- **Slick Segmentation**: Detects low-backscatter oceanic anomalies indicative of mineral oil spills.
- **Georeferenced Overlays**: Synchronized multi-layer raster visualization with boundary vectorization.

### 🌊 Hydrodynamic Drift Modeling
- **Backward Hindcasting**: Back-calculates slick drift vectors against surface currents and wind fields to estimate the precise time and coordinates of discharge.
- **Forward Forecasting**: Projects slick dispersion pathways and uncertainty cones for environmental impact assessment.
- **Metocean Fusion**: Integrates surface current velocity (knots) and local wind vector forces.

### 🚢 AIS Vessel Tracking & Anomaly Detection
- **Trajectory Interpolation**: Evaluates historical vessel movements across spatiotemporal discharge windows.
- **AIS Gap Detection**: Flags intentional transponder switch-offs ("dark vessel" activities) occurring near slick origins.
- **Kinematic Analysis**: Measures vessel speed, course alteration, and proximity offsets relative to the estimated spill timeline.

### 🎯 Multi-Factor Vessel Attribution Engine
Suspect rankings are computed using a multi-criteria scoring algorithm:
- **Proximity Score**: Physical distance to the discharge centroid.
- **Trajectory Alignment**: Intersect angle and alignment with the drift hindcast.
- **AIS Gap Anomaly**: Temporal and spatial correlation with transponder blackouts.
- **Vessel Type Prior**: Risk weighting based on vessel class (e.g., Crude Tankers, Chemical Carriers, Cargo).

### 🗺️ Tactical C2 Geospatial Map Interface
- **Interactive Layers**: Toggle between SAR raw tiles, segmented spill masks, drift vectors, uncertainty cones, and AIS tracks.
- **Temporal Playback**: Time-slider scrub controls to visualize vessel movements relative to slick formation.
- **Forensic Dossier**: One-click generation of audit-ready incident reports and evidence summaries.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Leaflet / D3
- **Backend**: Node.js, Express
- **Build & Bundler**: Vite, esbuild (`tsx` for development)
- **Data Formats**: GeoJSON, TopoJSON, ISO 8601 UTC Timestamps

---

## 📂 Project Structure

```
├── public/
│   └── sar_images/          # Georeferenced SAR rasters & overlay masks
├── src/
│   ├── components/
│   │   ├── detail/          # Incident dossier & suspect breakdown panels
│   │   ├── incidents/       # Incident lists, filters & severity indicators
│   │   ├── layout/          # Top navigation, status bars & header
│   │   ├── map/             # Leaflet geospatial map & layer controllers
│   │   └── timeline/        # Spatiotemporal playback & scrubber controls
│   ├── config/              # Application parameters & map presets
│   ├── hooks/               # Custom React hooks for data fetching & map state
│   ├── mock/                # Pre-loaded baseline datasets & SAR incidents
│   ├── services/            # Analytics, drift computation & AIS processing
│   ├── store/               # Application state management
│   ├── types.ts             # Domain models & TypeScript interfaces
│   ├── App.tsx              # Root application component
│   └── main.tsx             # Client entry point
├── server.ts                # Express API & static delivery server
├── package.json             # Dependencies and build scripts
└── vite.config.ts           # Vite configuration
```

---

## ⚙️ Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm** or **bun** / **yarn** / **pnpm**

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/CrimsonArrow26/MarineSentinel.git
   cd MarineSentinel
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the local development server:
```bash
npm run dev
```
Open your browser at `http://localhost:3000` to access the C2 workstation.

---

## 🏗️ Production Build & Deployment

### 1. Build the Application
Compiles the Vite client assets and bundles the Node.js Express server into `dist/server.cjs`:
```bash
npm run build
```

### 2. Start Production Server
```bash
npm start
```

---

## ☁️ Deployment Guide

### Deploying to Render / Web Services

1. **Environment**: Node.js
2. **Build Command**:
   ```bash
   npm install && npm run build
   ```
3. **Start Command**:
   ```bash
   npm start
   ```
4. **Environment Variables**:
   - `PORT=3000` (or automatically assigned by host)
   - `NODE_ENV=production`

---

## 📄 License

This project is released under the [MIT License](LICENSE).
