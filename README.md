# AeroTwin NCR — Physics-Guided 72-Hour Coupled Air Pollution Forecast & Decision Support Platform

**Smart India Hackathon (SIH 2026) Internal Prototype**

> **Problem Statement**: Air Pollution–Weather Coupled Forecasting System (Delhi NCR Focus)  
> **Core Concept**: AeroTwin NCR is an atmospheric-science grounded, explainable 72-hour air-pollution forecasting and decision-support platform for Delhi NCR that explicitly models the interaction between meteorology, atmospheric chemistry, and satellite fire activity.

---

## 🌟 Key Product Capabilities

AeroTwin NCR provides four core capabilities:

1. **FORECAST (72-Hour Outlook)**: Multi-pollutant predictions (AQI, PM2.5, PM10, O3, NOx) for 6h, 12h, 24h, 48h, and 72h views with statistical 95% confidence bounds ($\pm 1.96\cdot\sigma$).
2. **EXPLAIN (Explainable AI - XAI)**: Explains **WHY** pollution levels are predicted to increase or decrease for any target hour using SHAP-inspired feature contribution score breakdowns.
3. **ATTRIBUTE (Pollution Event Attribution)**: Quantifies driver shares into *Stagnant Atmospheric Conditions*, *Local Accumulation*, *Regional Transport*, *Biomass Burning Influence*, or *Combined Effects*.
4. **SIMULATE / DECISION SUPPORT (Scenario Lab)**: Interactive "What-If" policy & atmospheric simulator allowing users to modify wind speed, boundary layer height (PBL), thermal inversion strength, and regional fire intensity.
   - *Explicitly labeled*: `"Scenario simulation — not an operational forecast."`

---

## 🔬 Most Important Differentiation

Conventional dashboards typically display current AQI, static weather forecasts, and satellite fire hotspots separately.

**AeroTwin NCR Integration Layer**:
- Real-time Thermal Inversion indicator ($\Delta T$ lapse rate across 100m layer).
- Atmospheric Dispersion Index (ADI) combining wind speed ($v_{\text{wind}}$), boundary layer height ($h_{\text{PBL}}$), and stability.
- Pollution Accumulation Risk scoring.
- Wind-vector aligned regional stubble fire advection transport score & plume corridor.
- Dynamic feature importance explanations ("Why AQI is changing").
- What-If Scenario Lab for policy decision support.

---

## 🏗️ System Architecture

```
DATA SOURCES (CPCB, Open-Meteo, NASA FIRMS)
        ↓
DATA INGESTION & QUALITY CONTROL
        ↓
FEATURE ENGINEERING & COUPLED ATMOSPHERIC INDICATORS
(Inversion ΔT, ADI, Accumulation Risk, Regional Fire Score)
        ↓
MODULAR FORECASTING ENGINE (XGBoost / RandomForest + WRF-Chem Grid Adapter)
        ↓
72-HOUR FORECAST WITH UNCERTAINTY BOUNDS
        ↓
EXPLANATION (XAI) + SOURCE ATTRIBUTION + PLUME CORRIDOR
        ↓
SCENARIO LAB (WHAT-IF SIMULATOR)
        ↓
INTERACTIVE DASHBOARD (React + Leaflet Map)
```

---

## 💻 Tech Stack & Requirements

- **Backend**: Python 3.13, FastAPI, Uvicorn, Scikit-Learn, XGBoost, Pandas, NumPy, PyDantic, Pytest.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Leaflet / React-Leaflet, Recharts, Lucide Icons.

---

## 🚀 Quickstart Guide & Local Execution

### 1. Run Backend Server
```bash
cd backend
python -m pip install fastapi uvicorn pydantic pandas numpy scikit-learn xgboost pytest requests httpx
python -m uvicorn app.main:app --reload --port 8000
```
- API Documentation (Swagger): `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/v1/health`

### 2. Run Backend Pytest Suite
```bash
cd backend
python -m pytest
```

### 3. Run Frontend Application
```bash
cd frontend
npm install
npm run dev
```
- Open UI in browser: `http://localhost:5173`

---

## 📊 Final Acceptance Test Checklist

- [x] 72-hour AQI forecast outlook visible with time-horizon filters (6h, 12h, 24h, 48h, 72h).
- [x] PM2.5, PM10, O3, NOx timelines with 95% statistical confidence bands.
- [x] Meteorological variables (wind speed, direction, temperature, humidity, PBL height, inversion $\Delta T$).
- [x] Inversion indicator ($\Delta T$ lapse rate) & Atmospheric Dispersion Index (ADI).
- [x] Satellite stubble fire hotspots in Punjab/Haryana with wind vector transport score.
- [x] Explainable forecast ("Why is AQI changing?") with feature contribution waterfall bars.
- [x] Clear distinction between observed data vs forecast/simulation.
- [x] Interactive Scenario Lab ("What-If" simulator) with explicit disclaimer banner.
- [x] Architectural netCDF grid interface adapter for future WRF-Chem operational integration.
- [x] Scientific integrity: No unsupported claims or fake government API disguises.
- [x] Government/Research white-theme layout with Plotly/Recharts & Leaflet maps.
