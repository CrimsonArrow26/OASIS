-- =====================================================================
-- MARITIME SENTINEL - NTRO Oil Spill Detection & Vessel Attribution System
-- Relational Database Schema (PostgreSQL 14+)
-- Prepared for: SIH 2025 - PS 26143 (NTRO)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For GIS vector queries

-- 1. INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(32) PRIMARY KEY,                  -- e.g. 'OSP-2024-0047'
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL,
    estimated_origin_at TIMESTAMPTZ NOT NULL,
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    confidence_score DOUBLE PRECISION NOT NULL CHECK (confidence_score BETWEEN 0.0 AND 1.0),
    area_km2 DOUBLE PRECISION NOT NULL,
    oil_type VARCHAR(64) DEFAULT 'HEAVY FUEL/CRUDE',
    status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'monitoring')),
    sar_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. INCIDENT GEOMETRY (SAR Slick Footprint)
CREATE TABLE IF NOT EXISTS incident_geometries (
    incident_id VARCHAR(32) PRIMARY KEY REFERENCES incidents(id) ON DELETE CASCADE,
    length_km DOUBLE PRECISION NOT NULL,
    width_km DOUBLE PRECISION NOT NULL,
    orientation_deg INTEGER NOT NULL,
    perimeter_km DOUBLE PRECISION NOT NULL,
    polygon_geojson JSONB NOT NULL
);

-- 3. DRIFT SIMULATION (NOAA GNOME Model Runs)
CREATE TABLE IF NOT EXISTS drift_simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id VARCHAR(32) REFERENCES incidents(id) ON DELETE CASCADE,
    model_version VARCHAR(32) DEFAULT 'NOAA GNOME 1.5.2',
    origin_latitude DOUBLE PRECISION NOT NULL,
    origin_longitude DOUBLE PRECISION NOT NULL,
    origin_uncertainty_km DOUBLE PRECISION NOT NULL,
    discharge_window VARCHAR(64) NOT NULL,
    surface_current_kts DOUBLE PRECISION NOT NULL,
    surface_current_dir_deg INTEGER NOT NULL,
    local_wind_kts DOUBLE PRECISION NOT NULL,
    local_wind_dir_deg INTEGER NOT NULL,
    hindcast_path JSONB NOT NULL,
    forecast_path JSONB NOT NULL,
    uncertainty_cone JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. SAR ACQUISITION METADATA
CREATE TABLE IF NOT EXISTS sar_acquisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id VARCHAR(32) REFERENCES incidents(id) ON DELETE CASCADE,
    satellite_mission VARCHAR(64) NOT NULL,      -- 'Sentinel-1A'
    orbit_number INTEGER NOT NULL,
    polarization VARCHAR(32) NOT NULL,           -- 'VV + VH'
    resolution_m DOUBLE PRECISION NOT NULL,       -- 10.0
    incidence_angle_deg DOUBLE PRECISION NOT NULL,-- 34.2
    processing_level VARCHAR(32) NOT NULL,       -- 'IW GRD'
    backscatter_db VARCHAR(32) NOT NULL,         -- '-21.4 dB'
    acquisition_date TIMESTAMPTZ NOT NULL
);

-- 5. REGISTERED VESSELS & AIS REGISTRY
CREATE TABLE IF NOT EXISTS vessels (
    mmsi VARCHAR(16) PRIMARY KEY,
    vessel_name VARCHAR(255) NOT NULL,
    vessel_type VARCHAR(64) NOT NULL,
    flag_state VARCHAR(64) NOT NULL,
    imo_number VARCHAR(16),
    callsign VARCHAR(16),
    length_m DOUBLE PRECISION,
    beam_m DOUBLE PRECISION
);

-- 6. VESSEL SUSPECT ATTRIBUTIONS (Trajectory Intersect & Ranking)
CREATE TABLE IF NOT EXISTS suspect_attributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id VARCHAR(32) REFERENCES incidents(id) ON DELETE CASCADE,
    vessel_mmsi VARCHAR(16) REFERENCES vessels(mmsi),
    rank INTEGER NOT NULL,
    speed_kts DOUBLE PRECISION NOT NULL,
    course_deg INTEGER NOT NULL,
    intersect_offset VARCHAR(32) NOT NULL,
    proximity_score DOUBLE PRECISION NOT NULL,
    trajectory_score DOUBLE PRECISION NOT NULL,
    ais_gap_score DOUBLE PRECISION NOT NULL,
    vessel_type_prior DOUBLE PRECISION NOT NULL,
    overall_match_score DOUBLE PRECISION NOT NULL,
    ais_gap_detected BOOLEAN DEFAULT FALSE,
    ais_gap_start TIMESTAMPTZ,
    ais_gap_end TIMESTAMPTZ,
    ais_gap_duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. COAST GUARD DISPATCH & INTERCEPT LOGS
CREATE TABLE IF NOT EXISTS dispatch_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id VARCHAR(32) REFERENCES incidents(id),
    target_mmsi VARCHAR(16) REFERENCES vessels(mmsi),
    unit_assigned VARCHAR(64) NOT NULL DEFAULT 'USCG-08 SECTOR NEW ORLEANS',
    dispatch_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) NOT NULL DEFAULT 'DISPATCHED',
    dossier_hash VARCHAR(64) NOT NULL,
    watchstander_id VARCHAR(32) NOT NULL DEFAULT 'W-4491'
);

-- INDEXES for fast spatial and temporal lookup
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_detected_at ON incidents(detected_at);
CREATE INDEX IF NOT EXISTS idx_attributions_incident ON suspect_attributions(incident_id);
CREATE INDEX IF NOT EXISTS idx_attributions_rank ON suspect_attributions(incident_id, rank);
