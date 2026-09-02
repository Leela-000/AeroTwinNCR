import pytest
from app.models.schemas import MeteorologyObs
from app.data.providers import calculate_indian_aqi, DemoDataProvider
from app.engine.physics import PhysicsEngine

def test_indian_aqi_calculation():
    # Test PM2.5 = 150 (Very Poor)
    aqi, category = calculate_indian_aqi(pm25=150.0, pm10=220.0, o3=30.0, nox=50.0)
    assert aqi > 300
    assert category == "Very Poor"

    # Test Good AQI
    aqi_good, cat_good = calculate_indian_aqi(pm25=20.0, pm10=40.0, o3=20.0, nox=15.0)
    assert aqi_good <= 50
    assert cat_good == "Good"

def test_inversion_indicator():
    met = MeteorologyObs(
        timestamp="2026-09-01T00:00:00",
        temperature=15.0,
        humidity=80.0,
        wind_speed=4.0,
        wind_direction=300.0,
        pressure=1016.0,
        pbl_height=250.0,
        inversion_delta_t=3.2
    )
    inv = PhysicsEngine.compute_inversion_indicator(met)
    assert inv.category == "Strong"
    assert inv.strength_val == 3.2
    assert inv.lapse_rate_c_per_km == 32.0

def test_dispersion_index():
    met = MeteorologyObs(
        timestamp="2026-09-01T00:00:00",
        temperature=15.0,
        humidity=80.0,
        wind_speed=3.0,
        wind_direction=300.0,
        pressure=1016.0,
        pbl_height=200.0,
        inversion_delta_t=3.5
    )
    inv = PhysicsEngine.compute_inversion_indicator(met)
    adi = PhysicsEngine.compute_dispersion_index(met, inv)
    assert adi.category == "Poor"
    assert adi.score < 30.0

def test_fire_influence():
    met = MeteorologyObs(
        timestamp="2026-09-01T00:00:00",
        temperature=15.0,
        humidity=80.0,
        wind_speed=12.0,
        wind_direction=310.0, # NW wind directly from Punjab towards Delhi
        pressure=1016.0,
        pbl_height=400.0,
        inversion_delta_t=1.5
    )
    hotspots = DemoDataProvider.get_fire_hotspots()
    fire_inf = PhysicsEngine.compute_regional_fire_influence(met, hotspots)
    assert fire_inf.score > 20.0
    assert fire_inf.active_hotspots_count == len(hotspots)
