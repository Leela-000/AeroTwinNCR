export interface AirQualityObs {
  station_id: string;
  station_name: string;
  lat: number;
  lon: number;
  timestamp: string;
  pm25: number;
  pm10: number;
  o3: number;
  nox: number;
  aqi: number;
  aqi_category: string;
  is_demo: boolean;
}

export interface MeteorologyObs {
  timestamp: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  pressure: number;
  pbl_height: number;
  inversion_delta_t: number;
}

export interface FireHotspot {
  id: string;
  lat: number;
  lon: number;
  timestamp: string;
  frp: number;
  confidence: number;
  distance_km?: number;
  direction_deg?: number;
}

export interface InversionIndicator {
  strength_val: number;
  category: string;
  lapse_rate_c_per_km: number;
  description: string;
  accumulation_effect: string;
}

export interface AtmosphericDispersionIndex {
  score: number;
  category: string;
  wind_factor: number;
  pbl_factor: number;
  inversion_factor: number;
  description: string;
}

export interface AccumulationRisk {
  level: string;
  score: number;
  primary_driver: string;
  description: string;
}

export interface RegionalFireInfluence {
  score: number;
  level: string;
  active_hotspots_count: number;
  max_frp: number;
  effective_transport_score: number;
  description: string;
}

export interface CoupledPhysicsFeatures {
  inversion: InversionIndicator;
  dispersion_index: AtmosphericDispersionIndex;
  accumulation_risk: AccumulationRisk;
  fire_influence: RegionalFireInfluence;
}

export interface ForecastPoint {
  timestamp: string;
  hour_ahead: number;
  aqi: number;
  aqi_low: number;
  aqi_high: number;
  pm25: number;
  pm25_low: number;
  pm25_high: number;
  pm10: number;
  o3: number;
  nox: number;
  prob_above_200: number;
  prob_above_300: number;
  prob_above_400: number;
  aqi_category: string;
  coupled_features: CoupledPhysicsFeatures;
  weather_snapshot: MeteorologyObs;
}

export interface TimeBlockForecast {
  block_label: string;
  day_label: string;
  date_str: string;
  avg_aqi: number;
  avg_pm25: number;
  prob_above_200: number;
  prob_above_300: number;
  prob_above_400: number;
  aqi_category: string;
}

export interface PastObservationPoint {
  timestamp: string;
  hour_ago: number;
  pm25: number;
  pm10: number;
  o3: number;
  nox: number;
  aqi: number;
}

export interface PollutantHistoricalAndForecast {
  past_24h: PastObservationPoint[];
  future_72h: ForecastPoint[];
}

export interface ForecastResponse {
  location_id: string;
  location_name: string;
  generated_at: string;
  is_demo_data: boolean;
  baseline_name: string;
  model_name: string;
  current_aqi: number;
  peak_72h_aqi: number;
  forecast_points: ForecastPoint[];
  time_blocks: TimeBlockForecast[];
  pollutant_series: PollutantHistoricalAndForecast;
}

export interface HealthRecommendation {
  category: string;
  general_public: string;
  sensitive_groups: string;
  mask_advice: string;
  outdoor_exercise: string;
}

export interface ActivitySlot {
  time_range: string;
  predicted_aqi: number;
  recommendation: string;
  suitability: string;
}

export interface ActivityPlan {
  activity_name: string;
  description: string;
  slots: ActivitySlot[];
}

export interface BestOutdoorWindow {
  is_window_available: boolean;
  window_time_range: string;
  expected_aqi_range: string;
  risk_level: string;
  recommendation_text: string;
}

export interface AlertItem {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  lead_time_hours: number;
  severity: string;
}

export interface FeatureImportanceItem {
  feature_name: string;
  display_name: string;
  contribution_score: number;
  direction: 'increase' | 'decrease' | 'neutral';
  detail: string;
}

export interface ForecastExplanation {
  target_hour: number;
  predicted_aqi: number;
  delta_from_current: number;
  primary_reason: string;
  top_factors: FeatureImportanceItem[];
  summary_bullet_points: string[];
}

export interface EventAttribution {
  primary_driver: string;
  confidence_pct: number;
  stagnant_pct: number;
  local_pct: number;
  regional_pct: number;
  biomass_pct: number;
  rationale: string;
}

export interface PlumeTransportPoint {
  lat: number;
  lon: number;
  intensity: number;
  timestamp: string;
  hour_ahead: number;
  source_region: string;
}

export interface PlumeTransportResponse {
  generated_at: string;
  transport_corridor_name: string;
  plume_points: PlumeTransportPoint[];
  disclaimer: string;
}

export interface ScenarioRequest {
  wind_speed_multiplier: number;
  pbl_height_shift_m: number;
  inversion_strength_shift: number;
  fire_intensity_multiplier: number;
}

export interface ScenarioPoint {
  hour: number;
  timestamp: string;
  baseline_aqi: number;
  scenario_aqi: number;
  baseline_pm25: number;
  scenario_pm25: number;
  delta_aqi: number;
  delta_pm25: number;
}

export interface ScenarioResponse {
  request_params: ScenarioRequest;
  baseline_avg_aqi: number;
  scenario_avg_aqi: number;
  delta_aqi: number;
  percentage_change: number;
  comparison_points: ScenarioPoint[];
  summary_text: string;
  disclaimer: string;
}

export interface TimeSeriesValidationPoint {
  timestamp: string;
  actual_pm25: number;
  predicted_pm25: number;
  baseline_pm25: number;
}

export interface ValidationMetrics {
  model_name: string;
  mae: number;
  rmse: number;
  r2: number;
  aqi_category_accuracy: number;
  baseline_mae: number;
  baseline_rmse: number;
  sample_size: number;
  time_series: TimeSeriesValidationPoint[];
}

export interface ComparisonItem {
  capability: string;
  standard_systems: string;
  aerotwin_ncr: string;
}

export interface WRFChemGridStatus {
  coupled_model_name: string;
  grid_resolution: string;
  last_run_timestamp: string;
  coupled_variables: string[];
  status: string;
  active_domain: string;
}
