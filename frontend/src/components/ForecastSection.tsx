import React, { useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine
} from 'recharts';
import type { ForecastResponse, AirQualityObs } from '../types';
import { Calendar, Clock } from 'lucide-react';

interface ForecastSectionProps {
  forecast: ForecastResponse;
  observations: AirQualityObs[];
  selectedLocationId: string;
  onSelectLocation: (id: string) => void;
  selectedHour: number;
  onSelectHour: (hour: number) => void;
}

export const ForecastSection: React.FC<ForecastSectionProps> = ({
  forecast,
  observations,
  selectedLocationId,
  onSelectLocation,
  selectedHour,
  onSelectHour
}) => {
  const [horizonFilter, setHorizonFilter] = useState<number>(72);
  const [pollutant, setPollutant] = useState<'aqi' | 'pm25' | 'pm10' | 'o3' | 'nox'>('aqi');

  // Build combined past 24h + future 72h dataset for Recharts with NOW divider
  const pastData = forecast.pollutant_series.past_24h.map(p => ({
    label: `-${p.hour_ago}h`,
    timeType: 'Past (Observed)',
    aqi: p.aqi,
    pm25: p.pm25,
    pm10: p.pm10,
    o3: p.o3,
    nox: p.nox,
    isFuture: false
  }));

  const futureDisplay = forecast.forecast_points.slice(0, horizonFilter);

  const futureData = futureDisplay.map(pt => ({
    label: `+${pt.hour_ahead}h`,
    timeType: 'Future (Forecast)',
    hourNum: pt.hour_ahead,
    aqi: pt.aqi,
    aqi_low: pt.aqi_low,
    aqi_high: pt.aqi_high,
    pm25: pt.pm25,
    pm25_low: pt.pm25_low,
    pm25_high: pt.pm25_high,
    pm10: pt.pm10,
    o3: pt.o3,
    nox: pt.nox,
    isFuture: true,
    category: pt.aqi_category,
    wind: pt.weather_snapshot.wind_speed,
    pbl: pt.weather_snapshot.pbl_height,
    inversion: pt.coupled_features.inversion.strength_val
  }));

  const combinedData = [...pastData, ...futureData];

  const getPollutantColor = () => {
    switch (pollutant) {
      case 'pm25': return '#2563eb';
      case 'pm10': return '#0891b2';
      case 'o3': return '#16a34a';
      case 'nox': return '#d97706';
      default: return '#dc2626';
    }
  };

  const currentColor = getPollutantColor();

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 mb-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-900" />
            <h2 className="text-base font-bold text-slate-900">
              Past 24h Observed & Next 72h Forecast Outlook
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Location: <strong className="text-slate-800">{forecast.location_name}</strong> | Model: {forecast.model_name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Location Selector */}
          <select
            value={selectedLocationId}
            onChange={(e) => onSelectLocation(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {observations.map(st => (
              <option key={st.station_id} value={st.station_id}>
                {st.station_name} (Current AQI: {st.aqi})
              </option>
            ))}
          </select>

          {/* Time Horizon View Filter */}
          <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200 text-xs font-semibold">
            {[6, 12, 24, 48, 72].map(h => (
              <button
                key={h}
                onClick={() => setHorizonFilter(h)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  horizonFilter === h ? 'bg-blue-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>

          {/* Pollutant Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200 text-xs font-semibold">
            {[
              { id: 'aqi', label: 'AQI' },
              { id: 'pm25', label: 'PM2.5' },
              { id: 'pm10', label: 'PM10' },
              { id: 'o3', label: 'O3' },
              { id: 'nox', label: 'NOx' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPollutant(p.id as any)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  pollutant === p.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Forecast Recharts Area */}
      <div className="h-72 w-full mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={combinedData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPollutant" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={currentColor} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={currentColor} stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} domain={[0, 'auto']} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white border border-slate-200 p-3 rounded shadow-lg text-xs">
                      <p className="font-bold text-slate-900 border-b pb-1 mb-1.5 flex items-center justify-between">
                        <span>{data.label} ({data.timeType})</span>
                      </p>
                      <p className="text-slate-700 font-semibold">
                        {pollutant.toUpperCase()}: <span style={{ color: currentColor }}>{data[pollutant]}</span>
                      </p>
                      {data.isFuture && pollutant === 'aqi' && (
                        <p className="text-slate-600">
                          95% Confidence Interval: <strong>{data.aqi_low} – {data.aqi_high}</strong>
                        </p>
                      )}
                      {data.isFuture && pollutant === 'pm25' && (
                        <p className="text-slate-600">
                          95% Confidence Interval: <strong>{data.pm25_low} – {data.pm25_high} µg/m³</strong>
                        </p>
                      )}
                      {data.isFuture && (
                        <div className="mt-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                          <p>Wind: {data.wind} km/h | PBL: {data.pbl}m | Inv: ΔT {data.inversion}°C</p>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Vertical Marker: NOW */}
            <ReferenceLine x="-1h" stroke="#0f172a" strokeWidth={2} label={{ value: 'NOW (Observed | Forecast)', fill: '#0f172a', fontSize: 10, position: 'top' }} />

            {pollutant === 'aqi' && (
              <>
                <ReferenceLine y={200} stroke="#eab308" strokeDasharray="3 3" label={{ value: 'Moderate (200)', fill: '#ca8a04', fontSize: 10 }} />
                <ReferenceLine y={300} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'Poor (300)', fill: '#c2410c', fontSize: 10 }} />
                <ReferenceLine y={400} stroke="#dc2626" strokeDasharray="3 3" label={{ value: 'Severe (400)', fill: '#991b1b', fontSize: 10 }} />
              </>
            )}
            <Area
              type="monotone"
              dataKey={pollutant}
              stroke={currentColor}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorPollutant)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Hour Picker Step Strip */}
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-900" />
            <span>Select Target Forecast Hour for XAI Explanation & Attribution Analysis:</span>
          </span>
          <span className="text-xs font-extrabold text-blue-900 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
            Selected: T+{selectedHour}h
          </span>
        </div>

        <div className="flex space-x-1 overflow-x-auto pb-1">
          {[6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72].map(h => {
            const pt = forecast.forecast_points[h - 1];
            const isSel = selectedHour === h;
            return (
              <button
                key={h}
                onClick={() => onSelectHour(h)}
                className={`flex-1 min-w-[70px] py-1.5 px-2 rounded text-center transition-all ${
                  isSel
                    ? 'bg-blue-900 text-white shadow font-bold ring-2 ring-blue-400'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200 text-xs font-semibold'
                }`}
              >
                <div className="text-[10px] text-slate-400 uppercase">T+{h}h</div>
                <div className="text-xs mt-0.5">AQI {pt ? pt.aqi : '--'}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
