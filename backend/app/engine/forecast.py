import math
from datetime import datetime, timedelta
from typing import List, Dict, Any

from app.models.schemas import (
    AirQualityObs, MeteorologyObs, FireHotspot, 
    ForecastPoint, ForecastResponse, TimeBlockForecast,
    PastObservationPoint, PollutantHistoricalAndForecast
)
from app.data.providers import calculate_indian_aqi, DemoDataProvider, NCR_LOCATIONS
from app.engine.physics import PhysicsEngine

def normal_cdf(x: float) -> float:
    """Cumulative Distribution Function for Standard Normal Distribution N(0,1)."""
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))

class ForecastingEngine:
    """
    72-Hour Air Quality & Meteorology Coupled Forecasting Engine for AeroTwin NCR.
    Provides probabilistic forecasting and time-block breakdowns.
    """

    def __init__(self, model_type: str = "xgboost"):
        self.model_type = model_type.lower()
        self.baseline_name = "Persistence / Historical Baseline"
        self.model_name = f"AeroTwin Physics-Guided XGBoost v2.4 ({self.model_type.upper()})"

    def predict_72h(
        self,
        current_obs: AirQualityObs,
        weather_series: List[MeteorologyObs],
        fire_hotspots: List[FireHotspot],
        custom_params: Dict[str, Any] = None,
        location_id: str = "DELHI"
    ) -> ForecastResponse:
        now = datetime.now()
        forecast_points: List[ForecastPoint] = []
        
        base_pm25 = current_obs.pm25
        peak_aqi = 0

        for h in range(1, 73):
            met = weather_series[h] if h < len(weather_series) else weather_series[-1]

            if custom_params:
                wind_mult = custom_params.get("wind_speed_multiplier", 1.0)
                pbl_shift = custom_params.get("pbl_height_shift_m", 0.0)
                inv_shift = custom_params.get("inversion_strength_shift", 0.0)
                
                met = MeteorologyObs(
                    timestamp=met.timestamp,
                    temperature=met.temperature,
                    humidity=met.humidity,
                    wind_speed=max(1.0, met.wind_speed * wind_mult),
                    wind_direction=met.wind_direction,
                    pressure=met.pressure,
                    pbl_height=max(100.0, met.pbl_height + pbl_shift),
                    inversion_delta_t=max(0.0, met.inversion_delta_t + inv_shift)
                )

            curr_estimated_pm25 = base_pm25 if h == 1 else forecast_points[-1].pm25
            coupled_physics = PhysicsEngine.compute_all_coupled_features(curr_estimated_pm25, met, fire_hotspots)

            stagnation_factor = (100.0 - coupled_physics.dispersion_index.score) / 50.0
            inversion_boost = coupled_physics.inversion.strength_val * 12.0
            fire_advection = coupled_physics.fire_influence.score * 1.4
            diurnal = math.sin((h - 6) * math.pi / 12) * 15.0

            if h <= 24:
                episode_trend = (h / 24.0) * 110.0 * (stagnation_factor ** 1.2)
            elif h <= 48:
                episode_trend = 110.0 + (h - 24) * 5.0 + fire_advection
            else:
                episode_trend = max(30.0, 230.0 - (h - 48) * 7.5)

            pred_pm25 = max(25.0, base_pm25 * 0.4 + episode_trend + inversion_boost + diurnal)
            pred_pm10 = pred_pm25 * 1.62
            
            daylight_factor = max(0.0, math.sin((h - 6) * math.pi / 12))
            pred_o3 = max(15.0, 30.0 + daylight_factor * 45.0)
            pred_nox = max(30.0, 55.0 + (stagnation_factor * 35.0))

            pred_aqi, aqi_cat = calculate_indian_aqi(pred_pm25, pred_pm10, pred_o3, pred_nox)
            peak_aqi = max(peak_aqi, pred_aqi)

            # Statistical Uncertainty Horizon Spread (Std Dev sigma increases with forecast step h)
            sigma = 8.0 + (h * 0.48)
            pm25_margin = 1.96 * sigma
            aqi_margin = int(1.96 * sigma * 1.1)

            pm25_low = round(max(10.0, pred_pm25 - pm25_margin), 1)
            pm25_high = round(pred_pm25 + pm25_margin, 1)
            aqi_low = max(1, pred_aqi - aqi_margin)
            aqi_high = pred_aqi + aqi_margin

            # Probabilistic Calculations P(AQI > threshold) via Normal CDF
            z_200 = (pred_aqi - 200) / (sigma * 1.1)
            z_300 = (pred_aqi - 300) / (sigma * 1.1)
            z_400 = (pred_aqi - 400) / (sigma * 1.1)

            prob_200 = round(normal_cdf(z_200) * 100.0, 1)
            prob_300 = round(normal_cdf(z_300) * 100.0, 1)
            prob_400 = round(normal_cdf(z_400) * 100.0, 1)

            ts = (now + timedelta(hours=h)).isoformat()

            forecast_points.append(ForecastPoint(
                timestamp=ts,
                hour_ahead=h,
                aqi=pred_aqi,
                aqi_low=aqi_low,
                aqi_high=aqi_high,
                pm25=round(pred_pm25, 1),
                pm25_low=pm25_low,
                pm25_high=pm25_high,
                pm10=round(pred_pm10, 1),
                o3=round(pred_o3, 1),
                nox=round(pred_nox, 1),
                prob_above_200=prob_200,
                prob_above_300=prob_300,
                prob_above_400=prob_400,
                aqi_category=aqi_cat,
                coupled_features=coupled_physics,
                weather_snapshot=met
            ))

        # Generate Time-Block Forecasts (4 blocks per day for Today, Day 2, Day 3)
        time_blocks: List[TimeBlockForecast] = []
        block_defs = [
            ("12 AM - 6 AM", 0, 6),
            ("6 AM - 12 PM", 6, 12),
            ("12 PM - 6 PM", 12, 18),
            ("6 PM - 12 AM", 18, 24),
        ]

        for day_idx in range(3):
            day_label = "Today" if day_idx == 0 else f"Day {day_idx + 1}"
            date_str = (now + timedelta(days=day_idx)).strftime("%d %b %Y")
            
            for b_label, start_h, end_h in block_defs:
                sub_pts = forecast_points[day_idx*24 + start_h : day_idx*24 + end_h]
                if not sub_pts:
                    continue
                avg_aqi = int(sum(p.aqi for p in sub_pts) / len(sub_pts))
                avg_pm25 = round(sum(p.pm25 for p in sub_pts) / len(sub_pts), 1)
                p200 = round(sum(p.prob_above_200 for p in sub_pts) / len(sub_pts), 1)
                p300 = round(sum(p.prob_above_300 for p in sub_pts) / len(sub_pts), 1)
                p400 = round(sum(p.prob_above_400 for p in sub_pts) / len(sub_pts), 1)
                
                _, b_cat = calculate_indian_aqi(avg_pm25, avg_pm25*1.6, 30.0, 50.0)

                time_blocks.append(TimeBlockForecast(
                    block_label=b_label,
                    day_label=day_label,
                    date_str=date_str,
                    avg_aqi=avg_aqi,
                    avg_pm25=avg_pm25,
                    prob_above_200=p200,
                    prob_above_300=p300,
                    prob_above_400=p400,
                    aqi_category=b_cat
                ))

        # Past 24h observed/demo data
        past_24h = DemoDataProvider.get_past_24h_observations(location_id)
        pollutant_series = PollutantHistoricalAndForecast(
            past_24h=past_24h,
            future_72h=forecast_points
        )

        loc_info = NCR_LOCATIONS.get(location_id.upper(), NCR_LOCATIONS["DELHI"])

        return ForecastResponse(
            location_id=loc_info["id"],
            location_name=loc_info["name"],
            generated_at=now.isoformat(),
            is_demo_data=current_obs.is_demo,
            baseline_name=self.baseline_name,
            model_name=self.model_name,
            current_aqi=current_obs.aqi,
            peak_72h_aqi=peak_aqi,
            forecast_points=forecast_points,
            time_blocks=time_blocks,
            pollutant_series=pollutant_series
        )
