import React, { useState } from 'react';
import type { MeteorologyObs, CoupledPhysicsFeatures } from '../types';
import { Layers, ArrowRight, ShieldCheck } from 'lucide-react';

interface AtmosphericCouplingSectionProps {
  weather: MeteorologyObs;
  physics: CoupledPhysicsFeatures;
}

export const AtmosphericCouplingSection: React.FC<AtmosphericCouplingSectionProps> = ({
  weather,
  physics
}) => {
  const [selectedVar, setSelectedVar] = useState<'inversion' | 'wind' | 'pbl' | 'humidity'>('inversion');

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-indigo-900 text-white rounded-md">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Weather–Pollution Atmospheric Coupling & Physical Process Chains
            </h2>
            <p className="text-xs text-slate-500">
              Explicit physical coupling linking meteorological boundary layer variables with aerosol transport dynamics
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-indigo-900 bg-indigo-50 px-3 py-1 rounded border border-indigo-200">
          Physics-Guided Layer
        </span>
      </div>

      {/* Weather Variable Cards Grid (Clickable) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <button
          onClick={() => setSelectedVar('inversion')}
          className={`p-3 rounded-lg border text-left transition-all ${
            selectedVar === 'inversion' ? 'bg-purple-900 text-white font-bold shadow ring-2 ring-purple-400' : 'bg-slate-50 text-slate-800 hover:bg-slate-100 border-slate-200'
          }`}
        >
          <span className="text-[10px] uppercase font-bold opacity-80 block">Inversion Lid</span>
          <span className="text-xl font-extrabold block mt-0.5">ΔT {weather.inversion_delta_t}°C</span>
          <span className="text-[11px] font-semibold opacity-90 block mt-1">{physics.inversion.category}</span>
        </button>

        <button
          onClick={() => setSelectedVar('wind')}
          className={`p-3 rounded-lg border text-left transition-all ${
            selectedVar === 'wind' ? 'bg-blue-900 text-white font-bold shadow ring-2 ring-blue-400' : 'bg-slate-50 text-slate-800 hover:bg-slate-100 border-slate-200'
          }`}
        >
          <span className="text-[10px] uppercase font-bold opacity-80 block">Wind Speed</span>
          <span className="text-xl font-extrabold block mt-0.5">{weather.wind_speed} km/h</span>
          <span className="text-[11px] font-semibold opacity-90 block mt-1">Dir: {weather.wind_direction}° NW</span>
        </button>

        <button
          onClick={() => setSelectedVar('pbl')}
          className={`p-3 rounded-lg border text-left transition-all ${
            selectedVar === 'pbl' ? 'bg-teal-900 text-white font-bold shadow ring-2 ring-teal-400' : 'bg-slate-50 text-slate-800 hover:bg-slate-100 border-slate-200'
          }`}
        >
          <span className="text-[10px] uppercase font-bold opacity-80 block">PBL Height</span>
          <span className="text-xl font-extrabold block mt-0.5">{weather.pbl_height.toFixed(0)} m</span>
          <span className="text-[11px] font-semibold opacity-90 block mt-1">Mixing Depth</span>
        </button>

        <button
          onClick={() => setSelectedVar('humidity')}
          className={`p-3 rounded-lg border text-left transition-all ${
            selectedVar === 'humidity' ? 'bg-indigo-900 text-white font-bold shadow ring-2 ring-indigo-400' : 'bg-slate-50 text-slate-800 hover:bg-slate-100 border-slate-200'
          }`}
        >
          <span className="text-[10px] uppercase font-bold opacity-80 block">Rel. Humidity</span>
          <span className="text-xl font-extrabold block mt-0.5">{weather.humidity}%</span>
          <span className="text-[11px] font-semibold opacity-90 block mt-1">Aerosol Growth</span>
        </button>

        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800">
          <span className="text-[10px] uppercase font-bold opacity-80 block">Temperature</span>
          <span className="text-xl font-extrabold block mt-0.5">{weather.temperature}°C</span>
          <span className="text-[11px] font-semibold opacity-90 block mt-1">Surface Temp</span>
        </div>

        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800">
          <span className="text-[10px] uppercase font-bold opacity-80 block">Pressure</span>
          <span className="text-xl font-extrabold block mt-0.5">{weather.pressure} hPa</span>
          <span className="text-[11px] font-semibold opacity-90 block mt-1">Surface Pressure</span>
        </div>
      </div>

      {/* Visual Cause-and-Effect Chain Diagrams */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-5">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
          Atmospheric Process Chains (Cause ➔ Effect ➔ Pollution Impact)
        </h3>

        <div className="space-y-3 text-xs">
          {/* Chain 1: Stagnant Wind Chain */}
          <div className="bg-white p-3 rounded border border-slate-200 flex flex-wrap items-center gap-2 font-bold text-slate-800">
            <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-900 border border-rose-200">LOW WIND (3.5 km/h)</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 border border-amber-200">LOW DISPERSION (ADI 24)</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="px-2.5 py-1 rounded bg-purple-100 text-purple-900 border border-purple-200">POLLUTANT ACCUMULATION</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="px-2.5 py-1 rounded bg-red-900 text-white font-extrabold">HIGHER PM2.5 & AQI</span>
          </div>

          {/* Chain 2: Strong Inversion Capping Chain */}
          <div className="bg-white p-3 rounded border border-slate-200 flex flex-wrap items-center gap-2 font-bold text-slate-800">
            <span className="px-2.5 py-1 rounded bg-purple-100 text-purple-900 border border-purple-200">STRONG INVERSION (ΔT = 3.5°C)</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 border border-amber-200">SUPPRESSED VERTICAL MIXING</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="px-2.5 py-1 rounded bg-indigo-100 text-indigo-900 border border-indigo-200">AEROSOLS TRAPPED NEAR GROUND</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="px-2.5 py-1 rounded bg-red-900 text-white font-extrabold">AQI DETERIORATION RISK</span>
          </div>
        </div>
      </div>

      {/* Selected Variable Physical Mechanism Card */}
      <div className="bg-indigo-50/60 border border-indigo-200 p-4 rounded-lg text-xs text-slate-800">
        <div className="flex items-center space-x-2 font-bold text-indigo-950 mb-1">
          <ShieldCheck className="w-4 h-4 text-indigo-800" />
          <span className="uppercase tracking-wide">Physical Coupling Insight: {selectedVar.toUpperCase()}</span>
        </div>

        {selectedVar === 'inversion' && (
          <p className="leading-relaxed font-medium">
            <strong>Thermal Inversion Lid (ΔT = {weather.inversion_delta_t}°C, {physics.inversion.category}):</strong> Warm air layer overlying colder surface air suppresses buoyancy and vertical convective overturn. Emitted particulate matter remains trapped within the shallow surface boundary layer, accelerating smog formation.
          </p>
        )}

        {selectedVar === 'wind' && (
          <p className="leading-relaxed font-medium">
            <strong>Wind Speed & Ventilation ({weather.wind_speed} km/h, {weather.wind_direction}° NW):</strong> Low horizontal wind speed prevents advective dilution and flushing of urban emissions. North-westerly wind vector aligns with major upwind stubble burning corridors in Punjab & Haryana.
          </p>
        )}

        {selectedVar === 'pbl' && (
          <p className="leading-relaxed font-medium">
            <strong>Planetary Boundary Layer Height ({weather.pbl_height.toFixed(0)}m):</strong> Boundary layer height defines the vertical mixing volume. Shallow boundary layers during winter nights compress pollutants into a narrow atmospheric column, significantly elevating ground concentrations.
          </p>
        )}

        {selectedVar === 'humidity' && (
          <p className="leading-relaxed font-medium">
            <strong>Relative Humidity ({weather.humidity}%):</strong> High relative humidity fosters hygroscopic growth of sulfate, nitrate, and secondary organic aerosols, increasing aerosol particle cross-section and light scattering (haze/fog formation).
          </p>
        )}
      </div>
    </div>
  );
};
