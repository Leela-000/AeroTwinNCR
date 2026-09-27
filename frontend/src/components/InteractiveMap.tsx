import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import type { AirQualityObs, FireHotspot, PlumeTransportPoint } from '../types';
import { Layers, Flame, Wind } from 'lucide-react';

interface InteractiveMapProps {
  observations: AirQualityObs[];
  fireHotspots: FireHotspot[];
  plumePoints: PlumeTransportPoint[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
}

// Leaflet default icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom AQI Pin Generator
function createAQIStationIcon(aqi: number, isSelected: boolean) {
  let color = '#16a34a';
  if (aqi > 400) color = '#7f1d1d';
  else if (aqi > 300) color = '#dc2626';
  else if (aqi > 200) color = '#f97316';
  else if (aqi > 100) color = '#eab308';

  const size = isSelected ? 36 : 28;
  const html = `
    <div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: ${isSelected ? '3px solid #0f172a' : '2px solid white'};
      color: white;
      font-weight: 800;
      font-size: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
    ">
      ${aqi}
    </div>
  `;
  return L.divIcon({ html, className: 'custom-aqi-pin', iconSize: [size, size], iconAnchor: [size/2, size/2] });
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  observations,
  fireHotspots,
  plumePoints,
  selectedStationId,
  onSelectStation
}) => {
  // Layer visibility toggles
  const [showAQI, setShowAQI] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showFires, setShowFires] = useState(true);
  const [showPlume, setShowPlume] = useState(true);

  // Plume transport corridor coordinates (Polyline)
  const plumeLine = plumePoints.map(p => [p.lat, p.lon] as [number, number]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-full min-h-[500px] flex flex-col justify-between">
      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-blue-900" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Delhi NCR Interactive Geospatial Layer
          </h2>
        </div>

        {/* Toggle Switches */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <label className="flex items-center space-x-1 cursor-pointer bg-slate-50 px-2.5 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-100">
            <input type="checkbox" checked={showAQI} onChange={e => setShowAQI(e.target.checked)} className="rounded text-blue-600" />
            <span>☑ AQI Stations</span>
          </label>

          <label className="flex items-center space-x-1 cursor-pointer bg-slate-50 px-2.5 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-100">
            <input type="checkbox" checked={showHeatmap} onChange={e => setShowHeatmap(e.target.checked)} className="rounded text-blue-600" />
            <span>☑ PM2.5 Heat Layer</span>
          </label>

          <label className="flex items-center space-x-1 cursor-pointer bg-slate-50 px-2.5 py-1 rounded border border-slate-200 text-amber-800 hover:bg-slate-100">
            <input type="checkbox" checked={showFires} onChange={e => setShowFires(e.target.checked)} className="rounded text-amber-600" />
            <span>🔥 Fire Hotspots</span>
          </label>

          <label className="flex items-center space-x-1 cursor-pointer bg-slate-50 px-2.5 py-1 rounded border border-slate-200 text-purple-800 hover:bg-slate-100">
            <input type="checkbox" checked={showPlume} onChange={e => setShowPlume(e.target.checked)} className="rounded text-purple-600" />
            <span>💨 Plume Corridor</span>
          </label>
        </div>
      </div>

      {/* Grounded Map Container */}
      <div className="relative flex-1 w-full min-h-[440px] rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
        <MapContainer
          center={[28.6139, 77.2090]}
          zoom={9}
          scrollWheelZoom={false}
          className="w-full h-full min-h-[440px] z-10"
          style={{ height: '100%', minHeight: '440px', width: '100%' }}
        >
          {/* Light CartoDB map tiles */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CartoDB</a> Positron'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {/* 1. PM2.5 Heatmap Circles */}
          {showHeatmap && observations.map(obs => (
            <CircleMarker
              key={`heat-${obs.station_id}`}
              center={[obs.lat, obs.lon]}
              radius={35}
              pathOptions={{
                color: obs.aqi > 400 ? '#7f1d1d' : obs.aqi > 300 ? '#dc2626' : '#f97316',
                fillColor: obs.aqi > 400 ? '#7f1d1d' : obs.aqi > 300 ? '#dc2626' : '#f97316',
                fillOpacity: 0.22,
                stroke: false
              }}
            />
          ))}

          {/* 2. Plume Transport Corridor Polyline & Nodes */}
          {showPlume && (
            <>
              <Polyline
                positions={plumeLine}
                pathOptions={{ color: '#7c3aed', weight: 4, dashArray: '8, 8', opacity: 0.8 }}
              />
              {plumePoints.map((pt, idx) => (
                <CircleMarker
                  key={`plume-${idx}`}
                  center={[pt.lat, pt.lon]}
                  radius={12 + (idx * 2)}
                  pathOptions={{
                    color: '#7c3aed',
                    fillColor: '#a78bfa',
                    fillOpacity: 0.45,
                    weight: 1.5
                  }}
                >
                  <Popup>
                    <div className="text-xs">
                      <p className="font-bold text-purple-900">Model Transport Plume Node (T+{pt.hour_ahead}h)</p>
                      <p>Source FRP: {pt.intensity} MW</p>
                      <p className="text-slate-500 text-[10px] mt-1 font-semibold">
                        Model-estimated pollution transport
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </>
          )}

          {/* 3. Satellite Fire Hotspots */}
          {showFires && fireHotspots.map(fire => (
            <CircleMarker
              key={fire.id}
              center={[fire.lat, fire.lon]}
              radius={Math.min(18, Math.max(8, fire.frp / 15))}
              pathOptions={{
                color: '#b45309',
                fillColor: '#f59e0b',
                fillOpacity: 0.8,
                weight: 2
              }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <div className="flex items-center space-x-1 text-amber-800 font-bold">
                    <Flame className="w-4 h-4" />
                    <span>Satellite Stubble Fire Hotspot</span>
                  </div>
                  <p className="mt-1">ID: <strong>{fire.id}</strong></p>
                  <p>FRP: <strong>{fire.frp} MW</strong> (Conf: {fire.confidence}%)</p>
                  <p>Distance from Delhi: <strong>{fire.distance_km} km</strong></p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* 4. CPCB AQI Station Markers */}
          {showAQI && observations.map(obs => (
            <Marker
              key={obs.station_id}
              position={[obs.lat, obs.lon]}
              icon={createAQIStationIcon(obs.aqi, obs.station_id === selectedStationId)}
              eventHandlers={{
                click: () => onSelectStation(obs.station_id)
              }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <h3 className="font-bold text-slate-900">{obs.station_name}</h3>
                  <div className="mt-1.5 flex items-center justify-between gap-3">
                    <span>AQI: <strong className="text-slate-900">{obs.aqi}</strong></span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold">{obs.aqi_category}</span>
                  </div>
                  <p className="mt-1 text-slate-600">PM2.5: {obs.pm25} µg/m³ | PM10: {obs.pm10} µg/m³</p>
                  <button
                    onClick={() => onSelectStation(obs.station_id)}
                    className="mt-2 w-full py-1 bg-blue-900 text-white rounded text-[11px] font-semibold hover:bg-blue-800"
                  >
                    Select Station Forecast
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Transport Disclaimer Overlay */}
        {showPlume && (
          <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm border border-purple-200 p-2 rounded text-[11px] text-purple-900 font-medium z-[1000] flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-1.5">
              <Wind className="w-3.5 h-3.5 text-purple-700" />
              <span><strong>Transport Overlay:</strong> Model-estimated pollution transport plume from upwind fires</span>
            </div>
            <span className="text-[10px] bg-purple-100 px-2 py-0.5 rounded border border-purple-300 font-bold uppercase">
              Simulated Advection
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
