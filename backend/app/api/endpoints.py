from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException

from app.models.schemas import (
    AirQualityObs, MeteorologyObs, FireHotspot, 
    ForecastResponse, ForecastExplanation, EventAttribution,
    PlumeTransportResponse, ScenarioRequest, ScenarioResponse,
    ValidationMetrics, ComparisonItem, WRFChemGridStatus,
    HealthRecommendation, ActivityPlan, BestOutdoorWindow, AlertItem
)
from app.data.providers import DemoDataProvider, NCR_LOCATIONS
from app.engine.forecast import ForecastingEngine
from app.engine.explainability import ExplainabilityEngine
from app.engine.attribution import AttributionEngine
from app.engine.scenario import ScenarioEngine
from app.engine.validation import ValidationEngine
from app.engine.wrf_chem import WRFChemInterfaceAdapter
from app.engine.advisories import AdvisoriesEngine

router = APIRouter()

forecaster = ForecastingEngine(model_type="xgboost")
scenario_engine = ScenarioEngine(forecaster)
wrf_adapter = WRFChemInterfaceAdapter()


@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "service": "AeroTwin NCR Engine",
        "version": "1.0.0-MVP",
        "wrf_grid_status": "Ready",
        "demo_mode": True
    }


@router.get("/observations", response_model=List[AirQualityObs])
def get_observations():
    return DemoDataProvider.get_current_observations()


@router.get("/weather", response_model=List[MeteorologyObs])
def get_weather_series(hours: int = Query(72, ge=12, le=72)):
    return DemoDataProvider.get_weather_series(hours)


@router.get("/fires", response_model=List[FireHotspot])
def get_fire_hotspots():
    return DemoDataProvider.get_fire_hotspots()


@router.get("/forecast", response_model=ForecastResponse)
def get_72h_forecast(location_id: str = Query("DELHI")):
    obs_list = DemoDataProvider.get_current_observations()
    loc_obs = next((o for o in obs_list if o.station_id.upper() == location_id.upper()), obs_list[0])
    
    weather_series = DemoDataProvider.get_weather_series(72)
    hotspots = DemoDataProvider.get_fire_hotspots()
    
    return forecaster.predict_72h(loc_obs, weather_series, hotspots, location_id=location_id)


@router.get("/forecast/explain", response_model=ForecastExplanation)
def explain_forecast(location_id: str = Query("DELHI"), hour: int = Query(24, ge=1, le=72)):
    obs_list = DemoDataProvider.get_current_observations()
    loc_obs = next((o for o in obs_list if o.station_id.upper() == location_id.upper()), obs_list[0])
    
    weather_series = DemoDataProvider.get_weather_series(72)
    hotspots = DemoDataProvider.get_fire_hotspots()
    
    forecast_resp = forecaster.predict_72h(loc_obs, weather_series, hotspots, location_id=location_id)
    target_pt = next((pt for pt in forecast_resp.forecast_points if pt.hour_ahead == hour), forecast_resp.forecast_points[0])
    
    return ExplainabilityEngine.explain_hour_forecast(target_pt, loc_obs.aqi)


@router.get("/attribution", response_model=EventAttribution)
def get_attribution(location_id: str = Query("DELHI"), hour: int = Query(24, ge=1, le=72)):
    obs_list = DemoDataProvider.get_current_observations()
    loc_obs = next((o for o in obs_list if o.station_id.upper() == location_id.upper()), obs_list[0])
    
    weather_series = DemoDataProvider.get_weather_series(72)
    hotspots = DemoDataProvider.get_fire_hotspots()
    
    forecast_resp = forecaster.predict_72h(loc_obs, weather_series, hotspots, location_id=location_id)
    target_pt = next((pt for pt in forecast_resp.forecast_points if pt.hour_ahead == hour), forecast_resp.forecast_points[0])
    
    return AttributionEngine.classify_attribution(target_pt, hotspots)


@router.get("/plume", response_model=PlumeTransportResponse)
def get_plume_transport(hour: int = Query(24, ge=6, le=72)):
    weather_series = DemoDataProvider.get_weather_series(72)
    target_weather = weather_series[hour] if hour < len(weather_series) else weather_series[-1]
    hotspots = DemoDataProvider.get_fire_hotspots()
    
    return AttributionEngine.estimate_plume_transport(hotspots, target_weather, hour)


@router.post("/scenario", response_model=ScenarioResponse)
def run_scenario(req: ScenarioRequest, location_id: str = Query("DELHI")):
    obs_list = DemoDataProvider.get_current_observations()
    loc_obs = next((o for o in obs_list if o.station_id.upper() == location_id.upper()), obs_list[0])
    
    weather_series = DemoDataProvider.get_weather_series(72)
    hotspots = DemoDataProvider.get_fire_hotspots()
    
    return scenario_engine.simulate_scenario(req, loc_obs, weather_series, hotspots)


@router.get("/advisories/health", response_model=HealthRecommendation)
def get_health_advisory(aqi: int = Query(312)):
    return AdvisoriesEngine.get_health_recommendations(aqi)


@router.get("/advisories/activity", response_model=ActivityPlan)
def get_activity_plan(activity: str = Query("Cycling"), location_id: str = Query("DELHI")):
    obs_list = DemoDataProvider.get_current_observations()
    loc_obs = next((o for o in obs_list if o.station_id.upper() == location_id.upper()), obs_list[0])
    weather_series = DemoDataProvider.get_weather_series(72)
    hotspots = DemoDataProvider.get_fire_hotspots()
    forecast_resp = forecaster.predict_72h(loc_obs, weather_series, hotspots, location_id=location_id)
    
    return AdvisoriesEngine.get_activity_plan(activity, forecast_resp.forecast_points)


@router.get("/advisories/outdoor-window", response_model=BestOutdoorWindow)
def get_outdoor_window(location_id: str = Query("DELHI")):
    obs_list = DemoDataProvider.get_current_observations()
    loc_obs = next((o for o in obs_list if o.station_id.upper() == location_id.upper()), obs_list[0])
    weather_series = DemoDataProvider.get_weather_series(72)
    hotspots = DemoDataProvider.get_fire_hotspots()
    forecast_resp = forecaster.predict_72h(loc_obs, weather_series, hotspots, location_id=location_id)
    
    return AdvisoriesEngine.get_best_outdoor_window(forecast_resp.forecast_points)


@router.get("/alerts", response_model=List[AlertItem])
def get_alerts(location_id: str = Query("DELHI")):
    obs_list = DemoDataProvider.get_current_observations()
    loc_obs = next((o for o in obs_list if o.station_id.upper() == location_id.upper()), obs_list[0])
    weather_series = DemoDataProvider.get_weather_series(72)
    hotspots = DemoDataProvider.get_fire_hotspots()
    forecast_resp = forecaster.predict_72h(loc_obs, weather_series, hotspots, location_id=location_id)
    
    return AdvisoriesEngine.get_active_alerts(forecast_resp.forecast_points)


@router.get("/validation", response_model=ValidationMetrics)
def get_validation():
    return ValidationEngine.get_validation_metrics()


@router.get("/comparison", response_model=List[ComparisonItem])
def get_comparison():
    return ValidationEngine.get_comparison_matrix()


@router.get("/wrf-chem/status", response_model=WRFChemGridStatus)
def get_wrf_chem_status():
    return wrf_adapter.get_grid_status()
