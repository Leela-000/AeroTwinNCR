import pytest
from app.data.providers import DemoDataProvider
from app.engine.forecast import ForecastingEngine
from app.engine.scenario import ScenarioEngine
from app.models.schemas import ScenarioRequest

def test_72h_forecast_generation():
    forecaster = ForecastingEngine()
    obs_list = DemoDataProvider.get_current_observations()
    weather = DemoDataProvider.get_weather_series(72)
    fires = DemoDataProvider.get_fire_hotspots()

    resp = forecaster.predict_72h(obs_list[0], weather, fires)
    
    assert len(resp.forecast_points) == 72
    assert resp.peak_72h_aqi > 0
    assert resp.forecast_points[0].hour_ahead == 1
    assert resp.forecast_points[71].hour_ahead == 72

    # Check uncertainty bounds
    for pt in resp.forecast_points:
        assert pt.aqi_low <= pt.aqi <= pt.aqi_high
        assert pt.pm25_low <= pt.pm25 <= pt.pm25_high

def test_scenario_lab_simulation():
    forecaster = ForecastingEngine()
    scenario_engine = ScenarioEngine(forecaster)

    obs_list = DemoDataProvider.get_current_observations()
    weather = DemoDataProvider.get_weather_series(72)
    fires = DemoDataProvider.get_fire_hotspots()

    # Scenario: Doubling wind speed should improve dispersion (lower average AQI)
    req = ScenarioRequest(
        wind_speed_multiplier=2.0,
        pbl_height_shift_m=300.0,
        inversion_strength_shift=-1.5,
        fire_intensity_multiplier=0.5
    )

    scen_resp = scenario_engine.simulate_scenario(req, obs_list[0], weather, fires)

    assert scen_resp.scenario_avg_aqi < scen_resp.baseline_avg_aqi
    assert scen_resp.delta_aqi < 0
    assert "not an operational forecast" in scen_resp.disclaimer.lower()
