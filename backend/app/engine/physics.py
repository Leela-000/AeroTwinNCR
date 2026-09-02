import math
from typing import List
from app.models.schemas import (
    MeteorologyObs, FireHotspot, InversionIndicator, 
    AtmosphericDispersionIndex, AccumulationRisk, 
    RegionalFireInfluence, CoupledPhysicsFeatures
)

class PhysicsEngine:
    """
    Physics-guided atmospheric indicator calculator for AeroTwin NCR.
    Transforms raw meteorology & satellite fire data into derived coupled physics features.
    """

    @staticmethod
    def compute_inversion_indicator(met: MeteorologyObs) -> InversionIndicator:
        """
        Estimates thermal inversion strength and lapse rate.
        Normal boundary layer lapse rate: ~ -6.5°C/km.
        Thermal inversion occurs when upper air is warmer than surface (delta_t > 0).
        """
        dt = met.inversion_delta_t
        # Estimate lapse rate per km (assuming ~100m layer depth)
        lapse_rate = dt * 10.0  # °C / km

        if dt < 1.0:
            category = "Weak"
            effect = "Normal vertical mixing; minimal trapped pollutants."
            desc = f"Mild vertical thermal profile (ΔT = {dt:.1f}°C across 100m)."
        elif dt < 2.5:
            category = "Moderate"
            effect = "Restricted vertical dispersion; pollutants begin trapping near ground."
            desc = f"Moderate thermal inversion (ΔT = {dt:.1f}°C across 100m)."
        else:
            category = "Strong"
            effect = "Severe atmospheric cap; heavy pollutant trapping & fog/smog accumulation."
            desc = f"Strong thermal inversion lid (ΔT = {dt:.1f}°C across 100m)."

        return InversionIndicator(
            strength_val=round(dt, 2),
            category=category,
            lapse_rate_c_per_km=round(lapse_rate, 2),
            description=desc,
            accumulation_effect=effect
        )

    @staticmethod
    def compute_dispersion_index(met: MeteorologyObs, inversion: InversionIndicator) -> AtmosphericDispersionIndex:
        """
        Atmospheric Dispersion Index (ADI):
        Combines Ventilation Coefficient (Wind Speed x PBL Height) with inversion modifier.
        """
        # Wind factor (0 to 1): wind_speed of 20 km/h is max optimal (5.55 m/s)
        wind_ms = met.wind_speed / 3.6
        wind_factor = min(1.0, wind_ms / 5.5)

        # PBL factor (0 to 1): PBL height of 1500m is optimal mixing
        pbl_factor = min(1.0, met.pbl_height / 1200.0)

        # Inversion modifier (0 to 1): Strong inversion reduces dispersion score
        inv_factor = max(0.1, 1.0 - (inversion.strength_val / 4.0))

        # Combined ventilation score (0-100)
        ventilation_coeff = wind_ms * met.pbl_height  # m^2/s
        raw_score = (ventilation_coeff / 4000.0) * 100.0 * inv_factor
        score = max(5.0, min(100.0, raw_score))

        if score < 30:
            category = "Poor"
            desc = "Stagnant atmospheric conditions with low mixing depth and weak ventilation."
        elif score < 55:
            category = "Fair"
            desc = "Moderate ventilation; pollutant dispersion is partially restricted."
        elif score < 75:
            category = "Good"
            desc = "Good atmospheric ventilation; active pollutant dispersion."
        else:
            category = "Very Good"
            desc = "Optimal dispersion conditions; rapid dilution of surface emissions."

        return AtmosphericDispersionIndex(
            score=round(score, 1),
            category=category,
            wind_factor=round(wind_factor * 100, 1),
            pbl_factor=round(pbl_factor * 100, 1),
            inversion_factor=round(inv_factor * 100, 1),
            description=desc
        )

    @staticmethod
    def compute_accumulation_risk(pm25_current: float, met: MeteorologyObs, inv: InversionIndicator, adi: AtmosphericDispersionIndex) -> AccumulationRisk:
        """
        Estimates risk score (0-100) of severe pollution accumulation over next 24 hours.
        """
        # Higher score means higher risk of severe accumulation
        inv_weight = inv.strength_val * 15.0
        stagnation_weight = (100.0 - adi.score) * 0.45
        pm_weight = min(40.0, (pm25_current / 250.0) * 40.0)

        risk_score = max(5.0, min(100.0, inv_weight + stagnation_weight + pm_weight))

        if risk_score < 30:
            level = "Low"
            driver = "Sufficient atmospheric ventilation"
            desc = "Pollutant accumulation risk is low due to healthy boundary layer depth and wind movement."
        elif risk_score < 55:
            level = "Moderate"
            driver = "Moderate wind speed with stable lower boundary"
            desc = "Moderate risk of local accumulation during morning and evening hours."
        elif risk_score < 75:
            level = "High"
            driver = "Low PBL height combined with moderate thermal inversion"
            desc = "High accumulation risk. Emitted pollutants will remain trapped close to ground level."
        else:
            level = "Very High"
            driver = "Severe inversion lid, low boundary layer, and near-stagnant winds"
            desc = "Critical pollution accumulation risk. High likelihood of severe smog episode."

        return AccumulationRisk(
            level=level,
            score=round(risk_score, 1),
            primary_driver=driver,
            description=desc
        )

    @staticmethod
    def compute_regional_fire_influence(met: MeteorologyObs, hotspots: List[FireHotspot]) -> RegionalFireInfluence:
        """
        Estimates potential regional stubble burning influence based on fire FRP and wind vector direction.
        Wind direction = 300° to 330° points directly from Punjab/Haryana towards Delhi NCR.
        """
        if not hotspots:
            return RegionalFireInfluence(
                score=0.0,
                level="Low",
                active_hotspots_count=0,
                max_frp=0.0,
                effective_transport_score=0.0,
                description="No active satellite fire hotspots detected in regional upwind sector."
            )

        active_count = len(hotspots)
        max_frp = max(h.frp for h in hotspots)
        sum_frp = sum(h.frp for h in hotspots)

        # Prevailing wind direction
        wind_dir = met.wind_direction
        wind_speed_kmh = met.wind_speed

        # Calculate alignment between wind direction and fire bearing towards Delhi
        # Optimal transport angle is when wind blows FROM fire TO Delhi (approx NW winds, 290°-330°)
        total_effective_transport = 0.0

        for h in hotspots:
            # Angle of fire relative to wind vector
            # If fire direction_deg is ~310° (NW) and wind_direction is 300° (from NW), alignment is high
            fire_bearing = h.direction_deg if h.direction_deg is not None else 310.0
            angle_diff = abs((wind_dir - fire_bearing + 180) % 360 - 180)
            
            # Transport alignment factor (1.0 if perfectly aligned along wind stream, 0.0 if orthogonal)
            alignment = max(0.0, math.cos(math.radians(angle_diff)))
            
            # Distance decay (1 / dist)
            dist = h.distance_km if h.distance_km else 250.0
            dist_factor = max(0.1, 1.0 - (dist / 500.0))

            # FRP weight
            frp_weight = min(1.0, h.frp / 250.0)

            # Wind speed advection multiplier (need at least 5 km/h wind to transport smoke)
            advection = min(1.5, wind_speed_kmh / 10.0)

            contribution = frp_weight * dist_factor * alignment * advection * 100.0
            total_effective_transport += contribution

        # Scale total score (0 to 100)
        final_score = min(100.0, (total_effective_transport / max(1, active_count)) * (math.log1p(sum_frp) / 4.0) * 15.0)

        if final_score < 20:
            level = "Low"
            desc = "Minimal potential regional biomass-burning influence under current wind alignment."
        elif final_score < 45:
            level = "Moderate"
            desc = "Moderate potential regional stubble smoke transport into Delhi NCR."
        elif final_score < 70:
            level = "High"
            desc = "High potential regional biomass-burning contribution driven by favorable north-westerly transport winds."
        else:
            level = "Severe"
            desc = "Severe potential regional biomass smoke intrusion. Model estimates heavy smoke advection into NCR."

        return RegionalFireInfluence(
            score=round(final_score, 1),
            level=level,
            active_hotspots_count=active_count,
            max_frp=round(max_frp, 1),
            effective_transport_score=round(total_effective_transport, 1),
            description=desc
        )

    @classmethod
    def compute_all_coupled_features(cls, pm25_current: float, met: MeteorologyObs, hotspots: List[FireHotspot]) -> CoupledPhysicsFeatures:
        inv = cls.compute_inversion_indicator(met)
        adi = cls.compute_dispersion_index(met, inv)
        risk = cls.compute_accumulation_risk(pm25_current, met, inv, adi)
        fire = cls.compute_regional_fire_influence(met, hotspots)

        return CoupledPhysicsFeatures(
            inversion=inv,
            dispersion_index=adi,
            accumulation_risk=risk,
            fire_influence=fire
        )
