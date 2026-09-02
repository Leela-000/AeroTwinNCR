import math
from datetime import datetime, timedelta
from typing import List
from app.models.schemas import (
    ForecastPoint, FireHotspot, EventAttribution, 
    PlumeTransportPoint, PlumeTransportResponse, MeteorologyObs
)

class AttributionEngine:
    """
    Pollution Event Attribution & Regional Plume Transport Corridor Estimator for AeroTwin NCR.
    """

    @staticmethod
    def classify_attribution(forecast_point: ForecastPoint, hotspots: List[FireHotspot]) -> EventAttribution:
        feat = forecast_point.coupled_features
        met = forecast_point.weather_snapshot

        # Calculate driver component scores
        inv_score = feat.inversion.strength_val * 20.0
        disp_stagnation = (100.0 - feat.dispersion_index.score) * 0.5
        stagnant_raw = inv_score + disp_stagnation

        fire_raw = feat.fire_influence.score * 1.2
        local_raw = min(100.0, forecast_point.pm25 * 0.4)
        regional_raw = fire_raw * 0.6 + (20.0 if 290.0 <= met.wind_direction <= 340.0 else 5.0)

        total = max(1.0, stagnant_raw + local_raw + regional_raw + fire_raw)

        stagnant_pct = round((stagnant_raw / total) * 100, 1)
        local_pct = round((local_raw / total) * 100, 1)
        regional_pct = round((regional_raw / total) * 100, 1)
        biomass_pct = round((fire_raw / total) * 100, 1)

        # Primary driver determination
        drivers = [
            ("Stagnant Atmospheric Conditions", stagnant_pct),
            ("Local Accumulation", local_pct),
            ("Regional Transport", regional_pct),
            ("Biomass Burning Influence", biomass_pct),
        ]
        drivers.sort(key=lambda x: x[1], reverse=True)

        top_driver_name, top_pct = drivers[0]

        if top_pct < 38.0:
            primary = "Combined Effects"
            rationale = "Multifactor episode: atmospheric inversion, low wind speeds, and regional transport contributing simultaneously."
            conf = 84.5
        else:
            primary = top_driver_name
            conf = min(96.0, 70.0 + top_pct * 0.3)

            if primary == "Stagnant Atmospheric Conditions":
                rationale = f"Episode primarily caused by boundary layer stagnation (PBL {met.pbl_height:.0f}m, Wind {met.wind_speed} km/h) and a strong thermal inversion lid (ΔT = {feat.inversion.strength_val}°C)."
            elif primary == "Biomass Burning Influence":
                rationale = f"Episode strongly influenced by upwind agricultural fire activity ({feat.fire_influence.active_hotspots_count} active hotspots, max FRP {feat.fire_influence.max_frp} MW) aligned with NW wind vector ({met.wind_direction:.0f}°)."
            elif primary == "Local Accumulation":
                rationale = f"Episode driven by heavy urban ground emissions (PM2.5 {forecast_point.pm25} µg/m³) accumulating under stagnant surface winds."
            else:
                rationale = f"Episode driven by regional transport of particulate matter along the Indo-Gangetic Plains corridor."

        return EventAttribution(
            primary_driver=primary,
            confidence_pct=conf,
            stagnant_pct=stagnant_pct,
            local_pct=local_pct,
            regional_pct=regional_pct,
            biomass_pct=biomass_pct,
            rationale=rationale
        )

    @staticmethod
    def estimate_plume_transport(hotspots: List[FireHotspot], met: MeteorologyObs, hour_ahead: int = 24) -> PlumeTransportResponse:
        """
        Calculates advection plume trajectories from stubble burning hotspots towards Delhi NCR.
        Uses wind speed & direction vectors for advection dispersion.
        """
        now = datetime.now()
        plume_points: List[PlumeTransportPoint] = []

        wind_speed_ms = met.wind_speed / 3.6
        wind_dir_rad = math.radians(met.wind_direction)

        # Vector components of wind movement (direction wind is blowing TO = wind_dir + 180)
        u_wind = -wind_speed_ms * math.sin(wind_dir_rad) # Eastward m/s
        v_wind = -wind_speed_ms * math.cos(wind_dir_rad) # Northward m/s

        for h_spot in hotspots[:5]: # Top fire hotspots
            source_lat = h_spot.lat
            source_lon = h_spot.lon
            base_intensity = h_spot.frp

            # Generate 6 advection steps along transport corridor (e.g. 0h, 4h, 8h, 12h, 16h, 20h)
            for step in range(6):
                hours_elapsed = step * (hour_ahead / 5.0)
                seconds = hours_elapsed * 3600.0

                # 1 degree lat approx 111 km, 1 deg lon approx 111 * cos(lat) km
                delta_lat = (v_wind * seconds) / (111000.0)
                delta_lon = (u_wind * seconds) / (111000.0 * math.cos(math.radians(source_lat)))

                p_lat = source_lat + delta_lat
                p_lon = source_lon + delta_lon

                # Dispersion intensity decays with travel distance & time
                intensity_decay = max(10.0, base_intensity * math.exp(-0.04 * hours_elapsed))

                p_ts = (now + timedelta(hours=int(hours_elapsed))).isoformat()

                plume_points.append(PlumeTransportPoint(
                    lat=round(p_lat, 4),
                    lon=round(p_lon, 4),
                    intensity=round(intensity_decay, 1),
                    timestamp=p_ts,
                    hour_ahead=int(hours_elapsed),
                    source_region=h_spot.id
                ))

        return PlumeTransportResponse(
            generated_at=now.isoformat(),
            transport_corridor_name="Indo-Gangetic Plains Stubble Smoke Transport Corridor (Punjab/Haryana -> Delhi NCR)",
            plume_points=plume_points,
            disclaimer="Model-estimated pollution transport — simulated advection estimate"
        )
