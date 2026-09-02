import math
from datetime import datetime, timedelta
from typing import List, Tuple, Dict, Any
from app.models.schemas import (
    AirQualityObs, MeteorologyObs, FireHotspot, 
    PastObservationPoint, PollutantHistoricalAndForecast
)

def calculate_indian_aqi(pm25: float, pm10: float, o3: float, nox: float) -> Tuple[int, str]:
    """
    Computes Sub-Indices for PM2.5, PM10, O3, NOx and returns the max AQI and category per CPCB standard.
    Categories:
    Good (0-50), Satisfactory (51-100), Moderate (101-200), Poor (201-300), Very Poor (301-400), Severe (401+)
    """
    def sub_index(val: float, breakpoints: List[Tuple[float, float, int, int]]) -> int:
        for c_low, c_high, i_low, i_high in breakpoints:
            if c_low <= val <= c_high:
                return int(i_low + (i_high - i_low) * (val - c_low) / (c_high - c_low))
        if val > breakpoints[-1][1]:
            c_low, c_high, i_low, i_high = breakpoints[-1]
            return int(i_high + (val - c_high) * 0.5)
        return 0

    pm25_bp = [(0, 30, 0, 50), (30, 60, 51, 100), (60, 90, 101, 200), (90, 120, 201, 300), (120, 250, 301, 400), (250, 500, 401, 500)]
    pm10_bp = [(0, 50, 0, 50), (50, 100, 51, 100), (100, 250, 101, 200), (250, 350, 201, 300), (350, 430, 301, 400), (430, 600, 401, 500)]
    o3_bp = [(0, 50, 0, 50), (50, 100, 51, 100), (100, 168, 101, 200), (168, 208, 201, 300), (208, 748, 301, 400), (748, 1000, 401, 500)]
    nox_bp = [(0, 40, 0, 50), (40, 80, 51, 100), (80, 180, 101, 200), (180, 280, 201, 300), (280, 400, 301, 400), (400, 800, 401, 500)]

    si_pm25 = sub_index(pm25, pm25_bp)
    si_pm10 = sub_index(pm10, pm10_bp)
    si_o3 = sub_index(o3, o3_bp)
    si_nox = sub_index(nox, nox_bp)

    overall_aqi = max(si_pm25, si_pm10, si_o3, si_nox)

    if overall_aqi <= 50:
        cat = "Good"
    elif overall_aqi <= 100:
        cat = "Satisfactory"
    elif overall_aqi <= 200:
        cat = "Moderate"
    elif overall_aqi <= 300:
        cat = "Poor"
    elif overall_aqi <= 400:
        cat = "Very Poor"
    else:
        cat = "Severe"

    return overall_aqi, cat


NCR_LOCATIONS: Dict[str, Dict[str, Any]] = {
    "DELHI": {"id": "DELHI", "name": "Delhi NCR (Central / Anand Vihar)", "lat": 28.6469, "lon": 77.3160, "pm25_base": 185.0},
    "NOIDA": {"id": "NOIDA", "name": "Noida (Sector 62)", "lat": 28.6245, "lon": 77.3577, "pm25_base": 162.0},
    "GURUGRAM": {"id": "GURUGRAM", "name": "Gurugram (Vikas Sadan)", "lat": 28.4595, "lon": 77.0266, "pm25_base": 154.0},
    "GHAZIABAD": {"id": "GHAZIABAD", "name": "Ghaziabad (Vasundhara)", "lat": 28.6631, "lon": 77.3820, "pm25_base": 192.0},
    "FARIDABAD": {"id": "FARIDABAD", "name": "Faridabad (Sector 11)", "lat": 28.3995, "lon": 77.3162, "pm25_base": 148.0},
}


class DemoDataProvider:
    @staticmethod
    def get_current_observations() -> List[AirQualityObs]:
        now = datetime.now()
        results = []
        for loc_id, loc in NCR_LOCATIONS.items():
            pm25 = loc["pm25_base"]
            pm10 = pm25 * 1.64
            o3 = 30.0 + (hash(loc_id) % 15)
            nox = 62.0 + (pm25 * 0.15)
            aqi, cat = calculate_indian_aqi(pm25, pm10, o3, nox)
            results.append(AirQualityObs(
                station_id=loc["id"],
                station_name=loc["name"],
                lat=loc["lat"],
                lon=loc["lon"],
                timestamp=now.isoformat(),
                pm25=round(pm25, 1),
                pm10=round(pm10, 1),
                o3=round(o3, 1),
                nox=round(nox, 1),
                aqi=aqi,
                aqi_category=cat,
                is_demo=True
            ))
        return results

    @staticmethod
    def get_past_24h_observations(location_id: str = "DELHI") -> List[PastObservationPoint]:
        now = datetime.now()
        loc = NCR_LOCATIONS.get(location_id.upper(), NCR_LOCATIONS["DELHI"])
        base = loc["pm25_base"]
        points = []
        for h in range(24, 0, -1):
            ts = (now - timedelta(hours=h)).isoformat()
            # Diurnal trend over past 24h
            pm25 = base - 25.0 + math.sin((24 - h - 8) * math.pi / 12) * 35.0
            pm10 = pm25 * 1.62
            o3 = 25.0 + math.sin((24 - h - 14) * math.pi / 12) * 20.0
            nox = 50.0 + (pm25 * 0.1)
            aqi, _ = calculate_indian_aqi(pm25, pm10, o3, nox)
            points.append(PastObservationPoint(
                timestamp=ts,
                hour_ago=h,
                pm25=round(max(15.0, pm25), 1),
                pm10=round(max(30.0, pm10), 1),
                o3=round(max(10.0, o3), 1),
                nox=round(max(15.0, nox), 1),
                aqi=aqi
            ))
        return points

    @staticmethod
    def get_weather_series(hours_ahead: int = 72) -> List[MeteorologyObs]:
        now = datetime.now()
        series = []
        for h in range(hours_ahead + 1):
            ts = (now + timedelta(hours=h)).isoformat()
            diurnal_cycle = math.sin((h - 8) * math.pi / 12)
            
            if 20 <= h <= 48:
                wind_speed = max(2.5, 5.0 + diurnal_cycle * 2.0)
                pbl_height = max(180.0, 320.0 + diurnal_cycle * 120.0)
                inversion_dt = max(1.8, 3.8 - diurnal_cycle * 1.5)
            else:
                wind_speed = max(5.0, 11.0 + diurnal_cycle * 4.0)
                pbl_height = max(300.0, 650.0 + diurnal_cycle * 300.0)
                inversion_dt = max(0.2, 1.2 - diurnal_cycle * 1.0)
                
            temp = max(9.0, 18.0 + diurnal_cycle * 6.0)
            rh = max(40.0, 75.0 - diurnal_cycle * 20.0)
            wind_dir = 300.0 if 18 <= h <= 54 else 270.0
            pressure = 1016.0 + math.cos(h / 12.0) * 3.0
            
            series.append(MeteorologyObs(
                timestamp=ts,
                temperature=round(temp, 1),
                humidity=round(rh, 1),
                wind_speed=round(wind_speed, 1),
                wind_direction=round(wind_dir, 1),
                pressure=round(pressure, 1),
                pbl_height=round(pbl_height, 1),
                inversion_delta_t=round(inversion_dt, 1)
            ))
        return series

    @staticmethod
    def get_fire_hotspots() -> List[FireHotspot]:
        now = datetime.now()
        hotspots = [
            {"id": "FIRE_PB_01", "lat": 30.9010, "lon": 75.8573, "frp": 142.5, "conf": 88.0},
            {"id": "FIRE_PB_02", "lat": 30.3398, "lon": 76.3869, "frp": 98.0, "conf": 92.0},
            {"id": "FIRE_PB_03", "lat": 31.6340, "lon": 74.8723, "frp": 210.0, "conf": 95.0},
            {"id": "FIRE_HR_04", "lat": 29.9695, "lon": 76.8783, "frp": 76.5, "conf": 84.0},
            {"id": "FIRE_HR_05", "lat": 29.6857, "lon": 76.9905, "frp": 115.0, "conf": 90.0},
            {"id": "FIRE_PB_06", "lat": 30.2110, "lon": 74.9455, "frp": 185.0, "conf": 91.0},
            {"id": "FIRE_NCR_07", "lat": 28.9845, "lon": 77.0178, "frp": 45.0, "conf": 75.0},
        ]
        
        delhi_lat, delhi_lon = 28.6139, 77.2090
        res = []
        for h in hotspots:
            dlat = math.radians(h["lat"] - delhi_lat)
            dlon = math.radians(h["lon"] - delhi_lon)
            a = math.sin(dlat/2)**2 + math.cos(math.radians(delhi_lat)) * math.cos(math.radians(h["lat"])) * math.sin(dlon/2)**2
            dist = 6371 * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            
            y = math.sin(dlon) * math.cos(math.radians(h["lat"]))
            x = math.cos(math.radians(delhi_lat)) * math.sin(math.radians(h["lat"])) - math.sin(math.radians(delhi_lat)) * math.cos(math.radians(h["lat"])) * math.cos(dlon)
            bearing = (math.degrees(math.atan2(y, x)) + 360) % 360

            res.append(FireHotspot(
                id=h["id"],
                lat=h["lat"],
                lon=h["lon"],
                timestamp=now.isoformat(),
                frp=h["frp"],
                confidence=h["conf"],
                distance_km=round(dist, 1),
                direction_deg=round(bearing, 1)
            ))
        return res
