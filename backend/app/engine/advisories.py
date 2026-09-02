from typing import List
from app.models.schemas import (
    ForecastPoint, HealthRecommendation, ActivityPlan, 
    ActivitySlot, BestOutdoorWindow, AlertItem
)

class AdvisoriesEngine:
    """
    Public Health Advisories, Dynamic Activity Planner & Alert System Engine for AeroTwin NCR.
    """

    @staticmethod
    def get_health_recommendations(current_aqi: int) -> HealthRecommendation:
        if current_aqi <= 50:
            return HealthRecommendation(
                category="Good",
                general_public="🟢 Outdoor activities are generally suitable for all individuals.",
                sensitive_groups="🟢 Enjoy normal outdoor activities.",
                mask_advice="No protective mask required under current conditions.",
                outdoor_exercise="Ideal conditions for outdoor running, cycling, and sports."
            )
        elif current_aqi <= 100:
            return HealthRecommendation(
                category="Satisfactory",
                general_public="🟢 Air quality is acceptable for most outdoor activities.",
                sensitive_groups="🟡 Unusually sensitive individuals should consider limiting prolonged outdoor exertion.",
                mask_advice="Mask not required unless exceptionally sensitive to dust.",
                outdoor_exercise="Suitable for outdoor activities."
            )
        elif current_aqi <= 200:
            return HealthRecommendation(
                category="Moderate",
                general_public="🟡 Consider reducing prolonged heavy outdoor exertion if experiencing discomfort.",
                sensitive_groups="🟠 Children, elderly, and individuals with respiratory conditions should take breaks.",
                mask_advice="Cloth or N95 mask advised near high-traffic corridors.",
                outdoor_exercise="Moderate outdoor exercise acceptable; schedule during afternoon dispersion hours."
            )
        elif current_aqi <= 300:
            return HealthRecommendation(
                category="Poor",
                general_public="🟠 Reduce prolonged outdoor exertion. Take frequent breaks indoors.",
                sensitive_groups="🔴 Avoid prolonged outdoor physical activity.",
                mask_advice="N95 / N99 mask strongly recommended when outdoors.",
                outdoor_exercise="Shift intense workouts indoors or use air-filtered spaces."
            )
        elif current_aqi <= 400:
            return HealthRecommendation(
                category="Very Poor",
                general_public="🔴 Avoid prolonged outdoor exertion. Keep windows closed during morning/evening inversion.",
                sensitive_groups="🔴 Stay indoors and keep activity levels low.",
                mask_advice="Well-fitted N95 / N99 mask essential for any outdoor movement.",
                outdoor_exercise="Avoid outdoor physical exercise. Use indoor air purifiers where available."
            )
        else:
            return HealthRecommendation(
                category="Severe",
                general_public="🔴 Avoid all outdoor physical activity. Follow official health advisories.",
                sensitive_groups="🔴 Remain strictly indoors in air-filtered environments.",
                mask_advice="N95/N99 mask mandatory if outdoor exposure cannot be avoided.",
                outdoor_exercise="Strictly avoid outdoor sports, running, and heavy labor."
            )

    @staticmethod
    def get_activity_plan(activity_name: str, forecast_points: List[ForecastPoint]) -> ActivityPlan:
        """
        Evaluates 4 key diurnal slots today based on predicted AQI.
        """
        slots_def = [
            ("6 AM - 10 AM (Morning)", 6, 10),
            ("10 AM - 2 PM (Midday)", 10, 14),
            ("2 PM - 6 PM (Afternoon)", 14, 18),
            ("6 PM - 10 PM (Evening)", 18, 22),
        ]

        activity_slots: List[ActivitySlot] = []

        for label, start_h, end_h in slots_def:
            pts = [p for p in forecast_points if start_h <= p.hour_ahead <= end_h]
            if not pts:
                pts = forecast_points[:4]
            avg_aqi = int(sum(p.aqi for p in pts) / len(pts))

            # Recommendation text tailored to activity & AQI
            if avg_aqi <= 150:
                rec = f"Suitable window for {activity_name.lower()}. AQI is relatively favorable."
                suit = "Suitable"
            elif avg_aqi <= 250:
                rec = f"Proceed with caution. Consider reducing duration of {activity_name.lower()}."
                suit = "Caution"
            else:
                rec = f"Avoid outdoor {activity_name.lower()} during this window. High pollution levels."
                suit = "Avoid"

            activity_slots.append(ActivitySlot(
                time_range=label,
                predicted_aqi=avg_aqi,
                recommendation=rec,
                suitability=suit
            ))

        return ActivityPlan(
            activity_name=activity_name,
            description=f"Personalized schedule recommendation for {activity_name}",
            slots=activity_slots
        )

    @staticmethod
    def get_best_outdoor_window(forecast_points: List[ForecastPoint]) -> BestOutdoorWindow:
        """
        Calculates the best 4-hour outdoor window today (hours 1-24) with lowest AQI.
        """
        today_pts = forecast_points[:24]
        if not today_pts:
            today_pts = forecast_points

        min_aqi_window = None
        min_avg_aqi = 999

        for i in range(len(today_pts) - 3):
            window = today_pts[i:i+4]
            avg_aqi = sum(p.aqi for p in window) / 4.0
            if avg_aqi < min_avg_aqi:
                min_avg_aqi = avg_aqi
                min_aqi_window = window

        if min_aqi_window and min_avg_aqi <= 220:
            start_h = min_aqi_window[0].hour_ahead
            end_h = min_aqi_window[-1].hour_ahead
            return BestOutdoorWindow(
                is_window_available=True,
                window_time_range=f"T+{start_h}h to T+{end_h}h ({start_h}:00 - {end_h}:00)",
                expected_aqi_range=f"AQI {int(min_aqi_window[0].aqi)} – {int(min_aqi_window[-1].aqi)}",
                risk_level="Moderate" if min_avg_aqi > 100 else "Low",
                recommendation_text=f"Best outdoor window today expected around T+{start_h}h–T+{end_h}h due to peak afternoon boundary layer ventilation."
            )
        else:
            return BestOutdoorWindow(
                is_window_available=False,
                window_time_range="None today",
                expected_aqi_range="AQI > 250 throughout day",
                risk_level="High / Severe",
                recommendation_text="NO LOW-POLLUTION OUTDOOR WINDOW EXPECTED TODAY due to persistent thermal inversion and low wind speeds."
            )

    @staticmethod
    def get_active_alerts(forecast_points: List[ForecastPoint]) -> List[AlertItem]:
        alerts: List[AlertItem] = []

        # 1. Check for AQI Rising Alert
        first_300_pt = next((p for p in forecast_points if p.aqi >= 300), None)
        if first_300_pt:
            alerts.append(AlertItem(
                id="ALERT_RISING_01",
                alert_type="rising",
                title="⚠️ AQI Deterioration Alert",
                message=f"AQI is predicted to exceed 300 (Very Poor) within {first_300_pt.hour_ahead} hours. Primary drivers: PM2.5 persistence & shallow PBL height ({first_300_pt.weather_snapshot.pbl_height:.0f}m).",
                lead_time_hours=first_300_pt.hour_ahead,
                severity="Critical" if first_300_pt.hour_ahead <= 24 else "Warning"
            ))

        # 2. Check for Regional Fire Alert
        high_fire_pt = next((p for p in forecast_points if p.coupled_features.fire_influence.score >= 50.0), None)
        if high_fire_pt:
            alerts.append(AlertItem(
                id="ALERT_FIRE_02",
                alert_type="fire",
                title="🔥 Potential Regional Stubble Smoke Transport",
                message=f"Increased satellite fire activity in upwind regions with north-westerly wind vector ({high_fire_pt.weather_snapshot.wind_direction:.0f}°). Potential influence on NCR: {high_fire_pt.coupled_features.fire_influence.level}.",
                lead_time_hours=high_fire_pt.hour_ahead,
                severity="Warning"
            ))

        # 3. Check for Dispersion Improving Alert
        good_disp_pt = next((p for p in forecast_points if p.hour_ahead > 24 and p.coupled_features.dispersion_index.score >= 55.0), None)
        if good_disp_pt:
            alerts.append(AlertItem(
                id="ALERT_DISP_03",
                alert_type="dispersion",
                title="🌬 Dispersion Improvement Expected",
                message=f"Increasing wind speed ({good_disp_pt.weather_snapshot.wind_speed} km/h) and boundary layer expansion expected around T+{good_disp_pt.hour_ahead}h, aiding pollutant dilution.",
                lead_time_hours=good_disp_pt.hour_ahead,
                severity="Info"
            ))

        return alerts
