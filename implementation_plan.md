# AeroTwin NCR: Physics-Guided 72-Hour Coupled Air Pollution Forecast & Decision-Support System

## Overview
**AeroTwin NCR** is an atmospheric-science-grounded, explainable 72-hour air pollution forecasting and decision-support platform specifically designed for the Delhi National Capital Region (NCR). Unlike conventional AQI dashboards that merely display static forecasts or historical sensor data, AeroTwin NCR acts as an integration and coupling layer between meteorological physics, satellite fire activity, machine learning models, and real-time atmospheric health indicators.

The platform provides four core capabilities:
1. **Coupled 72-Hour Forecast**: Multi-pollutant (AQI, PM2.5, PM10, O3, NOx) and weather prediction with uncertainty confidence bounds.
2. **Explainable AI (XAI)**: Explicit breakdown of *why* pollution levels are changing (e.g. low wind speed + low Planetary Boundary Layer (PBL) height + strong thermal inversion).
3. **Event Attribution**: Quantified classification of pollution drivers (Stagnant Atmospheric Conditions, Local Accumulation, Regional Transport, Stubble/Biomass Burning, or Combined).
4. **Scenario Lab (Decision Support)**: Interactive "What-If" simulator for policymakers and researchers to evaluate aerosol dispersion under hypothetical weather or emission changes.

---

## User Review Required

> [!IMPORTANT]
> **Data & Physics Strategy**:
> - Real-time open government APIs (e.g., CPCB OpenData / Open-Meteo / NASA FIRMS) will be supported via clean data abstraction interfaces.
> - For demo and offline reliability during hackathon evaluations, a realistic physics-based 72-hour winter smog episode benchmark dataset ("Delhi Winter Inversion Episode") is included and explicitly tagged as `DEMO / SIMULATED DATA` in accordance with scientific integrity guidelines.
> - The UI enforces a strictly professional, research/government aesthetic with a **white background theme**, dark navy/blue typography, and restrained color coding for AQI severity.

---

## Technical Architecture & Component Breakdown

```
+-----------------------------------------------------------------------------------+
|                                 AeroTwin NCR UI                                   |
| (React + TypeScript + Vite + Tailwind CSS + Recharts + Leaflet Interactive Map)   |
|                                                                                   |
|  +-------------------+  +--------------------+  +------------------------------+  |
|  | 72-Hour Forecast  |  | "Why it Changed?"  |  | Interactive NCR Map          |  |
|  | AQI / PM2.5 / O3 |  | Feature Importance |  | Hotspots / Plumes / Vectors  |  |
|  +-------------------+  +--------------------+  +------------------------------+  |
|  +-------------------+  +--------------------+  +------------------------------+  |
|  | Scenario Lab      |  | Model Validation   |  | Enhancements Matrix vs       |  |
|  | "What-If" Engine  |  | MAE/RMSE Metrics   |  | Existing Solutions           |  |
|  +-------------------+  +--------------------+  +------------------------------+  |
+-----------------------------------------------------------------------------------+
                                         │  HTTP / REST API
                                         ▼
+-----------------------------------------------------------------------------------+
|                                FastAPI Backend Engine                             |
|                                                                                   |
|  ┌────────────────────────┐   ┌──────────────────────────┐   ┌─────────────────┐  |
|  │ Data Ingestion Layer   │──▶│ Derived Physics Features │──▶│ XGBoost + ML    |  |
|  │ (CPCB, Weather, Fire)  │   │ Inversion, ADI, Risk     │   │ Forecast Engine │  |
|  └────────────────────────┘   └──────────────────────────┘   └─────────────────┘  |
|               │                            │                          │           |
|               ▼                            ▼                          ▼           |
|  ┌────────────────────────┐   ┌──────────────────────────┐   ┌─────────────────┐  |
|  │ WRF-Chem Architecture  │   │ Attribution & Plume      │   │ What-If Scenario│  |
|  │ Grid Interface Adapter │   │ Transport Estimator      │   │ Simulator Engine│  |
|  └────────────────────────┘   └──────────────────────────┘   └─────────────────┘  |
+-----------------------------------------------------------------------------------+
```

---

## Proposed Implementation Steps

### 1. Data Layer & Abstraction
- Abstract data providers: `AirQualityProvider`, `MeteorologyProvider`, `FireHotspotProvider`.
- Live API adapters (Open-Meteo Air Quality & NASA FIRMS) with graceful fallback to cached physics-based simulation datasets.
- Clean schemas for:
  - Air Quality: PM2.5, PM10, O3, NOx, AQI (CPCB standard Indian AQI formula).
  - Meteorology: Temperature, Relative Humidity, Wind Speed, Wind Direction, Pressure, Planetary Boundary Layer (PBL) Height, Temperature Inversion ($\Delta T$).
  - Biomass Burning: Latitude, Longitude, FRP (Fire Radiative Power), Timestamp, Distance to Delhi NCR.

### 2. Physics-Guided Derived Feature Engine
- **Thermal Inversion Indicator**: Calculates temperature lapse rate ($\Delta T / \Delta z$), categorizing inversion as *Weak*, *Moderate*, or *Strong*.
- **Atmospheric Dispersion Index (ADI)**: Multi-factor formula coupling wind speed ($v_{wind}$), PBL height ($h_{PBL}$), and thermal stability.
- **Pollution Accumulation Risk Score**: Combined risk metric (Low, Moderate, High, Very High) determining likelihood of stagnant pollutant trapping.
- **Regional Fire Influence Factor**: Directionally aligned, distance-decayed weighting of active stubble burning fires relative to Delhi's prevailing wind vector.

### 3. Modular Forecasting Engine & Explainability
- **XGBoost / Random Forest Forecast Model**: Predicts hourly AQI and PM2.5 for $t+1$ to $t+72$ hours.
- **Persistence & Historical Baseline**: For baseline comparison and model validation.
- **WRF-Chem Integration Adapter**: Code structure and interface specifying how 3D chemical transport model netCDF output maps into AeroTwin's feature pipeline.
- **Model Uncertainty**: Computes 95% prediction intervals ($\hat{y} \pm 1.96 \cdot \sigma$) based on residual variance across horizon windows.
- **Explainability Engine (SHAP-inspired feature contributions)**: Computes dynamic directional impact of each weather/chemistry feature for any target forecast hour.

### 4. Event Attribution & Plume Simulator Engine
- **Attribution Classifier**: Rules-based + ML feature attribution categorizing pollution drivers into *Stagnant Atmospheric Conditions*, *Local Accumulation*, *Regional Transport*, *Biomass Burning Influence*, or *Combined*.
- **Plume Transport Estimator**: Wind-vector advection model estimating regional pollution plume corridors from Punjab/Haryana into Delhi NCR with explicit label `"Model-estimated pollution transport"`.

### 5. What-If Scenario Lab Engine
- Allows interactive modification of:
  - Wind speed multiplier ($0.5\times$ to $2.0\times$)
  - PBL height shift (e.g. $-300\text{ m}$ to $+500\text{ m}$)
  - Thermal Inversion intensity
  - Regional Fire FRP intensity
- Evaluates modified physics features through the ML model to output **Scenario Forecast vs Baseline Forecast**, prominently labeled as **"Scenario Simulation — Not an operational forecast"**.

### 6. Research-Grade Government UI (Frontend)
- Built with React, Vite, TypeScript, Tailwind CSS, Recharts, and Leaflet.
- Clean **White Theme**, Dark Navy header, Indigo accents, clear AQI color indicators (Good, Satisfactory, Moderate, Poor, Very Poor, Severe).
- **Interactive Map**: Delhi NCR boundary, station markers with live/forecast AQI, satellite fire hotspots, wind vector arrows, and model transport plume layer.
- **72-Hour Forecast Charts**: Interactive time-series with 6h, 12h, 24h, 48h, 72h filters, pollutant toggles, and uncertainty bands.
- **"Why is Pollution Changing?"**: Live feature contribution bars explaining hourly shifts.
- **Scenario Lab Panel**: Interactive sliders with side-by-side comparison charts.
- **Model Validation Dashboard**: Real vs Predicted metrics (MAE, RMSE, $R^2$, AQI Category Accuracy).
- **Enhancement Matrix**: Clear comparative analysis of AeroTwin NCR vs traditional monitoring systems.
- **Demo Mode**: Playable 72-hour winter episode step-by-through controller.

---

## Verification Plan

### Automated Verification
- Python backend test suite (`pytest`) verifying:
  - CPCB AQI calculation logic.
  - Derived physics feature calculations (Inversion, ADI, Fire influence).
  - 72-hour forecast shape and confidence interval validation.
  - Scenario simulation outputs.
- API Endpoint verification via HTTP client checks.

### Manual Verification & Judge Demonstration
- Verify UI responsiveness and white-background presentation.
- Confirm all 12 points of the Final Acceptance Test checklist in prompt.
- Check distinct labeling on Demo Data vs Live Data, and Scenario Simulation vs Operational Forecast.
