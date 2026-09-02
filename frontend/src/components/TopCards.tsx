import React from 'react';
import type { AirQualityObs, ForecastResponse } from '../types';
import { Activity, TrendingUp, Thermometer, Wind, AlertTriangle } from 'lucide-react';

interface TopCardsProps {
  currentObs: AirQualityObs;
  forecast: ForecastResponse;
}

export const TopCards: React.FC<TopCardsProps> = ({ currentObs, forecast }) => {
  const getAQIBadge = (aqi: number) => {
    if (aqi <= 50) return { label: 'Good', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' };
    if (aqi <= 100) return { label: 'Satisfactory', bg: 'bg-lime-100', text: 'text-lime-800', border: 'border-lime-300' };
    if (aqi <= 200) return { label: 'Moderate', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' };
    if (aqi <= 300) return { label: 'Poor', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' };
    if (aqi <= 400) return { label: 'Very Poor', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' };
    return { label: 'Severe', bg: 'bg-rose-900', text: 'text-white', border: 'border-rose-950' };
  };

  const currBadge = getAQIBadge(currentObs.aqi);
  const peakBadge = getAQIBadge(forecast.peak_72h_aqi);

  const firstPt = forecast.forecast_points[0];
  const inv = firstPt?.coupled_features.inversion;
  const risk = firstPt?.coupled_features.accumulation_risk;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* 1. Current AQI */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current AQI</span>
          <Activity className="w-4 h-4 text-slate-400" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-3xl font-extrabold text-slate-900">{currentObs.aqi}</span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded border ${currBadge.bg} ${currBadge.text} ${currBadge.border}`}>
            {currBadge.label}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-2 truncate">
          {currentObs.station_name}
        </p>
      </div>

      {/* 2. 72-Hour Peak AQI */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">72-Hour Peak AQI</span>
          <TrendingUp className="w-4 h-4 text-rose-500" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-3xl font-extrabold text-rose-700">{forecast.peak_72h_aqi}</span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded border ${peakBadge.bg} ${peakBadge.text} ${peakBadge.border}`}>
            {peakBadge.label}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Predicted peak during episode window
        </p>
      </div>

      {/* 3. PM2.5 Concentration */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">PM2.5 Concentration</span>
          <Wind className="w-4 h-4 text-blue-500" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-3xl font-extrabold text-slate-900">{currentObs.pm25}</span>
          <span className="text-xs font-medium text-slate-500">µg/m³</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Standard CPCB limit: 60 µg/m³
        </p>
      </div>

      {/* 4. Pollution Accumulation Risk */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Accumulation Risk</span>
          <AlertTriangle className={`w-4 h-4 ${risk?.level === 'Very High' || risk?.level === 'High' ? 'text-amber-500' : 'text-emerald-500'}`} />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className={`text-2xl font-bold ${
            risk?.level === 'Very High' ? 'text-red-700' : risk?.level === 'High' ? 'text-amber-700' : 'text-slate-800'
          }`}>
            {risk?.level || 'Moderate'}
          </span>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            Score: {risk?.score || 65}/100
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-2 truncate" title={risk?.primary_driver}>
          Driver: {risk?.primary_driver || 'Boundary Layer Stagnation'}
        </p>
      </div>

      {/* 5. Inversion Status */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inversion Status</span>
          <Thermometer className="w-4 h-4 text-purple-600" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-purple-900">
            {inv?.category || 'Strong'}
          </span>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
            ΔT = {inv?.strength_val || 3.2}°C
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Lapse rate: {inv?.lapse_rate_c_per_km || 32.0} °C/km (100m)
        </p>
      </div>
    </div>
  );
};
