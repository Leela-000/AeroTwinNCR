from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class AirQualityObs(BaseModel):
    station_id: str
    station_name: str
    lat: float
    lon: float
    timestamp: str
    pm25: float
    pm10: float
    o3: float
    nox: float
    aqi: int
    aqi_category: str
    is_demo: bool = True

class MeteorologyObs(BaseModel):
    timestamp: str
    temperature: float = Field(..., description="Temperature in Celsius")
    humidity: float = Field(..., description="Relative Humidity %")
    wind_speed: float = Field(..., description="Wind Speed in km/h")
    wind_direction: float = Field(..., description="Wind direction in degrees (0-360)")
    pressure: float = Field(..., description="Pressure in hPa")
    pbl_height: float = Field(..., description="Planetary Boundary Layer Height in meters")
    inversion_delta_t: float = Field(..., description="Surface to 100m temp diff in °C")

class FireHotspot(BaseModel):
    id: str
    lat: float
    lon: float
    timestamp: str
    frp: float = Field(..., description="Fire Radiative Power (MW)")
    confidence: float = Field(..., description="Confidence % (0-100)")
    distance_km: Optional[float] = None
    direction_deg: Optional[float] = None

class InversionIndicator(BaseModel):
    strength_val: float
    category: str  # "Weak", "Moderate", "Strong"
    lapse_rate_c_per_km: float
    description: str
    accumulation_effect: str

class AtmosphericDispersionIndex(BaseModel):
    score: float  # 0 to 100
    category: str  # "Poor", "Fair", "Good", "Very Good"
    wind_factor: float
    pbl_factor: float
    inversion_factor: float
    description: str

class AccumulationRisk(BaseModel):
    level: str  # "Low", "Moderate", "High", "Very High"
    score: float
    primary_driver: str
    description: str

class RegionalFireInfluence(BaseModel):
    score: float  # 0 to 100
    level: str  # "Low", "Moderate", "High", "Severe"
    active_hotspots_count: int
    max_frp: float
    effective_transport_score: float
    description: str

class CoupledPhysicsFeatures(BaseModel):
    inversion: InversionIndicator
    dispersion_index: AtmosphericDispersionIndex
    accumulation_risk: AccumulationRisk
    fire_influence: RegionalFireInfluence

class ForecastPoint(BaseModel):
    timestamp: str
    hour_ahead: int
    aqi: int
    aqi_low: int
    aqi_high: int
    pm25: float
    pm25_low: float
    pm25_high: float
    pm10: float
    o3: float
    nox: float
    prob_above_200: float
    prob_above_300: float
    prob_above_400: float
    aqi_category: str
    coupled_features: CoupledPhysicsFeatures
    weather_snapshot: MeteorologyObs

class TimeBlockForecast(BaseModel):
    block_label: str  # "12 AM - 6 AM", "6 AM - 12 PM", "12 PM - 6 PM", "6 PM - 12 AM"
    day_label: str    # "Today", "Day 2", "Day 3"
    date_str: str
    avg_aqi: int
    avg_pm25: float
    prob_above_200: float
    prob_above_300: float
    prob_above_400: float
    aqi_category: str

class PastObservationPoint(BaseModel):
    timestamp: str
    hour_ago: int
    pm25: float
    pm10: float
    o3: float
    nox: float
    aqi: int

class PollutantHistoricalAndForecast(BaseModel):
    past_24h: List[PastObservationPoint]
    future_72h: List[ForecastPoint]

class ForecastResponse(BaseModel):
    location_id: str
    location_name: str
    generated_at: str
    is_demo_data: bool
    baseline_name: str
    model_name: str
    current_aqi: int
    peak_72h_aqi: int
    forecast_points: List[ForecastPoint]
    time_blocks: List[TimeBlockForecast]
    pollutant_series: PollutantHistoricalAndForecast

class ProbabilisticMetrics(BaseModel):
    target_hour: int
    threshold: int
    predicted_aqi: int
    prob_exceeding_threshold: float
    prob_above_200: float
    prob_above_300: float
    prob_above_400: float
    range_low: int
    range_high: int
    explanation: str

class HealthRecommendation(BaseModel):
    category: str
    general_public: str
    sensitive_groups: str
    mask_advice: str
    outdoor_exercise: str

class ActivitySlot(BaseModel):
    time_range: str
    predicted_aqi: int
    recommendation: str
    suitability: str  # "Suitable", "Caution", "Avoid"

class ActivityPlan(BaseModel):
    activity_name: str
    description: str
    slots: List[ActivitySlot]

class BestOutdoorWindow(BaseModel):
    is_window_available: bool
    window_time_range: str
    expected_aqi_range: str
    risk_level: str
    recommendation_text: str

class AlertItem(BaseModel):
    id: str
    alert_type: str  # "rising" | "fire" | "dispersion"
    title: str
    message: str
    lead_time_hours: int
    severity: str  # "Critical", "Warning", "Info"

class FeatureImportanceItem(BaseModel):
    feature_name: str
    display_name: str
    contribution_score: float
    direction: str  # "increase" | "decrease" | "neutral"
    detail: str

class ForecastExplanation(BaseModel):
    target_hour: int
    predicted_aqi: int
    delta_from_current: int
    primary_reason: str
    top_factors: List[FeatureImportanceItem]
    summary_bullet_points: List[str]

class EventAttribution(BaseModel):
    primary_driver: str
    confidence_pct: float
    stagnant_pct: float
    local_pct: float
    regional_pct: float
    biomass_pct: float
    rationale: str

class PlumeTransportPoint(BaseModel):
    lat: float
    lon: float
    intensity: float
    timestamp: str
    hour_ahead: int
    source_region: str

class PlumeTransportResponse(BaseModel):
    generated_at: str
    transport_corridor_name: str
    plume_points: List[PlumeTransportPoint]
    disclaimer: str = "Model-estimated pollution transport — simulated advection estimate"

class ScenarioRequest(BaseModel):
    wind_speed_multiplier: float = Field(1.0, ge=0.2, le=3.0)
    pbl_height_shift_m: float = Field(0.0, ge=-800.0, le=1200.0)
    inversion_strength_shift: float = Field(0.0, ge=-3.0, le=5.0)
    fire_intensity_multiplier: float = Field(1.0, ge=0.0, le=5.0)

class ScenarioResponse(BaseModel):
    request_params: ScenarioRequest
    baseline_avg_aqi: float
    scenario_avg_aqi: float
    delta_aqi: float
    percentage_change: float
    comparison_points: List[Dict[str, Any]]
    summary_text: str
    disclaimer: str = "Scenario simulation — not an operational forecast."

class TimeSeriesValidationPoint(BaseModel):
    timestamp: str
    actual_pm25: float
    predicted_pm25: float
    baseline_pm25: float

class ValidationMetrics(BaseModel):
    model_name: str
    mae: float
    rmse: float
    r2: float
    aqi_category_accuracy: float
    baseline_mae: float
    baseline_rmse: float
    sample_size: int
    time_series: List[TimeSeriesValidationPoint]

class ComparisonItem(BaseModel):
    capability: str
    standard_systems: str
    aerotwin_ncr: str

class WRFChemGridStatus(BaseModel):
    coupled_model_name: str = "WRF-Chem v4.5 coupled with AeroTwin ML"
    grid_resolution: str = "3 km x 3 km"
    last_run_timestamp: str
    coupled_variables: List[str]
    status: str = "Active Grid Ingestion Ready"
    active_domain: str = "Delhi NCR + Indo-Gangetic Plains (IGP)"
