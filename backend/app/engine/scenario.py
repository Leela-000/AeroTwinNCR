from typing import List, Dict, Any
from app.models.schemas import (
    ScenarioRequest, ScenarioResponse, ForecastResponse, AirQualityObs, MeteorologyObs, FireHotspot
)
from app.engine.forecast import ForecastingEngine


class ScenarioEngine:
    """
    Scenario Lab Simulator for AeroTwin NCR decision-support platform.
    Evaluates 'What-If' policy and atmospheric scenarios.
    """

    def __init__(self, forecaster: ForecastingEngine):
        self.forecaster = forecaster

    def simulate_scenario(
        self,
        req: ScenarioRequest,
        current_obs: AirQualityObs,
        weather_series: List[MeteorologyObs],
        fire_hotspots: List[FireHotspot]
    ) -> ScenarioResponse:
        # 1. Baseline 72-hour forecast
        baseline = self.forecaster.predict_72h(current_obs, weather_series, fire_hotspots)

        # 2. Modify fire hotspots if fire multiplier changed
        modified_fires = []
        for f in fire_hotspots:
            modified_fires.append(FireHotspot(
                id=f.id,
                lat=f.lat,
                lon=f.lon,
                timestamp=f.timestamp,
                frp=max(0.0, f.frp * req.fire_intensity_multiplier),
                confidence=f.confidence,
                distance_km=f.distance_km,
                direction_deg=f.direction_deg
            ))

        # 3. Custom forecast under modified physics parameters
        custom_params = {
            "wind_speed_multiplier": req.wind_speed_multiplier,
            "pbl_height_shift_m": req.pbl_height_shift_m,
            "inversion_strength_shift": req.inversion_strength_shift
        }

        scenario = self.forecaster.predict_72h(current_obs, weather_series, modified_fires, custom_params=custom_params)

        # 4. Compare baseline vs scenario points
        comparison_points: List[Dict[str, Any]] = []
        base_aqis = []
        scen_aqis = []

        for b_pt, s_pt in zip(baseline.forecast_points, scenario.forecast_points):
            base_aqis.append(b_pt.aqi)
            scen_aqis.append(s_pt.aqi)
            comparison_points.append({
                "hour": b_pt.hour_ahead,
                "timestamp": b_pt.timestamp,
                "baseline_aqi": b_pt.aqi,
                "scenario_aqi": s_pt.aqi,
                "baseline_pm25": b_pt.pm25,
                "scenario_pm25": s_pt.pm25,
                "delta_aqi": s_pt.aqi - b_pt.aqi,
                "delta_pm25": round(s_pt.pm25 - b_pt.pm25, 1)
            })

        base_avg = sum(base_aqis) / len(base_aqis)
        scen_avg = sum(scen_aqis) / len(scen_aqis)
        delta_avg = scen_avg - base_avg
        pct_change = ((scen_avg - base_avg) / base_avg) * 100.0 if base_avg > 0 else 0.0

        # Construct explanation summary text
        actions = []
        if req.wind_speed_multiplier != 1.0:
            direction = "increase" if req.wind_speed_multiplier > 1.0 else "decrease"
            actions.append(f"{direction} in wind speed by {abs(req.wind_speed_multiplier - 1.0)*100:.0f}%")
        if req.pbl_height_shift_m != 0.0:
            direction = "higher" if req.pbl_height_shift_m > 0 else "lower"
            actions.append(f"{abs(req.pbl_height_shift_m):.0f}m {direction} Planetary Boundary Layer (PBL)")
        if req.inversion_strength_shift != 0.0:
            direction = "stronger" if req.inversion_strength_shift > 0 else "weaker"
            actions.append(f"{abs(req.inversion_strength_shift):.1f}°C {direction} thermal inversion lid")
        if req.fire_intensity_multiplier != 1.0:
            direction = "increase" if req.fire_intensity_multiplier > 1.0 else "reduction"
            actions.append(f"{abs(req.fire_intensity_multiplier - 1.0)*100:.0f}% {direction} in regional fire activity")

        scenario_desc = ", ".join(actions) if actions else "Baseline conditions"

        if delta_avg > 15:
            effect_text = f"Under simulated scenario ({scenario_desc}), average 72-hour AQI increases by +{delta_avg:.1f} points (+{pct_change:.1f}%), worsening pollution accumulation."
        elif delta_avg < -15:
            effect_text = f"Under simulated scenario ({scenario_desc}), average 72-hour AQI drops by {abs(delta_avg):.1f} points ({pct_change:.1f}%), demonstrating enhanced atmospheric flushing."
        else:
            effect_text = f"Under simulated scenario ({scenario_desc}), average 72-hour AQI remains virtually unchanged ({delta_avg:+.1f} points)."

        return ScenarioResponse(
            request_params=req,
            baseline_avg_aqi=round(base_avg, 1),
            scenario_avg_aqi=round(scen_avg, 1),
            delta_aqi=round(delta_avg, 1),
            percentage_change=round(pct_change, 1),
            comparison_points=comparison_points,
            summary_text=effect_text,
            disclaimer="Scenario simulation — not an operational forecast."
        )
