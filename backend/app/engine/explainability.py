from typing import List
from app.models.schemas import ForecastPoint, FeatureImportanceItem, ForecastExplanation

class ExplainabilityEngine:
    """
    Explainable AI (XAI) feature contribution engine for AeroTwin NCR.
    Explains WHY pollution levels are predicted to increase or decrease for any target hour.
    """

    @staticmethod
    def explain_hour_forecast(target_point: ForecastPoint, current_aqi: int) -> ForecastExplanation:
        feat = target_point.coupled_features
        met = target_point.weather_snapshot
        
        target_aqi = target_point.aqi
        delta_aqi = target_aqi - current_aqi

        factors: List[FeatureImportanceItem] = []
        bullets: List[str] = []

        # 1. Wind Speed Contribution
        if met.wind_speed < 6.0:
            w_score = round(35.0 + (6.0 - met.wind_speed) * 4.5, 1)
            w_dir = "increase"
            w_detail = f"Very low wind speed ({met.wind_speed} km/h) prevents horizontal pollutant ventilation."
            bullets.append(f"↓ Low wind speed ({met.wind_speed} km/h) restricts atmospheric flushing.")
        else:
            w_score = round(max(5.0, (met.wind_speed - 6.0) * 3.0), 1)
            w_dir = "decrease"
            w_detail = f"Favorable wind speed ({met.wind_speed} km/h) promotes pollutant dispersion."
            bullets.append(f"↑ Active wind speed ({met.wind_speed} km/h) aids pollutant dilution.")

        factors.append(FeatureImportanceItem(
            feature_name="wind_speed",
            display_name="Wind Speed & Ventilation",
            contribution_score=w_score,
            direction=w_dir,
            detail=w_detail
        ))

        # 2. PBL Height Contribution
        if met.pbl_height < 400.0:
            p_score = round(30.0 + (400.0 - met.pbl_height) * 0.12, 1)
            p_dir = "increase"
            p_detail = f"Shallow Planetary Boundary Layer ({met.pbl_height:.0f}m) severely compresses mixing volume."
            bullets.append(f"↓ Compressed PBL height ({met.pbl_height:.0f}m) traps aerosols near ground.")
        else:
            p_score = round(max(5.0, (met.pbl_height - 400.0) * 0.05), 1)
            p_dir = "decrease"
            p_detail = f"Deep boundary layer mixing volume ({met.pbl_height:.0f}m)."
            bullets.append(f"↑ Elevated PBL height ({met.pbl_height:.0f}m) expands vertical dispersion volume.")

        factors.append(FeatureImportanceItem(
            feature_name="pbl_height",
            display_name="Planetary Boundary Layer Height",
            contribution_score=p_score,
            direction=p_dir,
            detail=p_detail
        ))

        # 3. Thermal Inversion Contribution
        inv_dt = feat.inversion.strength_val
        if inv_dt >= 1.5:
            i_score = round(25.0 + inv_dt * 8.0, 1)
            i_dir = "increase"
            i_detail = f"Strong thermal inversion lid (ΔT = {inv_dt}°C) blocks vertical aerosol escape."
            bullets.append(f"↑ Thermal inversion lid (ΔT = {inv_dt}°C, {feat.inversion.category}) acts as a trap.")
        else:
            i_score = round(max(2.0, inv_dt * 5.0), 1)
            i_dir = "neutral"
            i_detail = f"Weak inversion conditions (ΔT = {inv_dt}°C)."
            bullets.append(f"Weak atmospheric inversion lid (ΔT = {inv_dt}°C).")

        factors.append(FeatureImportanceItem(
            feature_name="thermal_inversion",
            display_name="Thermal Inversion Lid",
            contribution_score=i_score,
            direction=i_dir,
            detail=i_detail
        ))

        # 4. Regional Stubble Burning Influence
        fire_score = feat.fire_influence.score
        if fire_score >= 25.0:
            f_score = round(fire_score * 0.75, 1)
            f_dir = "increase"
            f_detail = f"North-westerly winds ({met.wind_direction:.0f}°) carrying biomass smoke from upwind fires."
            bullets.append(f"+ High potential regional biomass-burning smoke transport (NW wind {met.wind_direction:.0f}°).")
        else:
            f_score = round(fire_score * 0.4, 1)
            f_dir = "neutral"
            f_detail = "Low regional stubble burning transport impact."

        factors.append(FeatureImportanceItem(
            feature_name="regional_fire",
            display_name="Regional Stubble Fire Transport",
            contribution_score=f_score,
            direction=f_dir,
            detail=f_detail
        ))

        # 5. Upstream PM2.5 Accumulation Trend
        if target_point.pm25 > 120.0:
            pm_score = round(min(45.0, target_point.pm25 * 0.18), 1)
            pm_dir = "increase"
            pm_detail = f"High baseline background PM2.5 concentration ({target_point.pm25} µg/m³)."
            bullets.append(f"↑ High background PM2.5 persistence ({target_point.pm25} µg/m³).")
        else:
            pm_score = round(target_point.pm25 * 0.1, 1)
            pm_dir = "decrease"
            pm_detail = "Moderate baseline particle load."

        factors.append(FeatureImportanceItem(
            feature_name="pm25_trend",
            display_name="PM2.5 Concentration Persistence",
            contribution_score=pm_score,
            direction=pm_dir,
            detail=pm_detail
        ))

        # Sort factors by contribution score descending
        factors.sort(key=lambda x: x.contribution_score, reverse=True)

        if delta_aqi > 30:
            reason = f"Significant AQI deterioration (+{delta_aqi} AQI points) predicted due to stagnant boundary layer dynamics and atmospheric capping."
        elif delta_aqi < -30:
            reason = f"Noticeable AQI improvement ({delta_aqi} AQI points) predicted due to strengthening ventilation and PBL expansion."
        else:
            reason = f"Steady AQI levels (AQI ~{target_aqi}) governed by balance between ground emissions and atmospheric dispersion."

        return ForecastExplanation(
            target_hour=target_point.hour_ahead,
            predicted_aqi=target_aqi,
            delta_from_current=delta_aqi,
            primary_reason=reason,
            top_factors=factors,
            summary_bullet_points=bullets
        )
