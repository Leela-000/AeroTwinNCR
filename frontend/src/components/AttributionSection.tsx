import React from 'react';
import type { EventAttribution, FireHotspot, PlumeTransportResponse } from '../types';
import { Flame, Compass, PieChart, ShieldAlert } from 'lucide-react';

interface AttributionSectionProps {
  attribution: EventAttribution;
  fireHotspots: FireHotspot[];
  plume: PlumeTransportResponse;
  selectedHour: number;
}

export const AttributionSection: React.FC<AttributionSectionProps> = ({
  attribution,
  fireHotspots,
  selectedHour
}) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-amber-50 text-amber-900 rounded-md">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Pollution Event Attribution & Regional Fire Transport
            </h2>
            <p className="text-xs text-slate-500">
              Quantified contribution drivers for upcoming pollution episode at T+{selectedHour}h
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded border border-amber-200">
          Primary Driver: {attribution.primary_driver} ({attribution.confidence_pct}% Confidence)
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Driver Percentage Breakdown */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
            Attribution Driver Share (% Contribution)
          </h3>

          <div className="space-y-3">
            {[
              { label: 'Stagnant Atmospheric Conditions', val: attribution.stagnant_pct, color: 'bg-indigo-600' },
              { label: 'Local Ground Accumulation', val: attribution.local_pct, color: 'bg-blue-600' },
              { label: 'Regional Transport Corridor', val: attribution.regional_pct, color: 'bg-teal-600' },
              { label: 'Biomass / Stubble Fire Influence', val: attribution.biomass_pct, color: 'bg-amber-600' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>{item.label}</span>
                  <span className="font-extrabold text-slate-900">{item.val}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.val}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600 font-medium leading-relaxed">
            <strong className="text-slate-900 block mb-0.5">Scientific Rationale:</strong>
            {attribution.rationale}
          </div>
        </div>

        {/* Middle Column: Regional Fire Hotspots Table */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center space-x-1.5">
              <Flame className="w-4 h-4 text-amber-600" />
              <span>Active Upwind Satellite Fire Hotspots (Punjab & Haryana Corridor)</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
              Potential regional biomass-burning influence
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="text-[11px] font-bold text-slate-500 uppercase bg-slate-200/70 border-b border-slate-300">
                <tr>
                  <th className="py-2 px-2.5">Fire ID</th>
                  <th className="py-2 px-2.5">Coordinates</th>
                  <th className="py-2 px-2.5">FRP (MW)</th>
                  <th className="py-2 px-2.5">Confidence</th>
                  <th className="py-2 px-2.5">Distance</th>
                  <th className="py-2 px-2.5">Bearing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {fireHotspots.map(fire => (
                  <tr key={fire.id} className="hover:bg-white transition-colors">
                    <td className="py-2 px-2.5 font-bold text-slate-900">{fire.id}</td>
                    <td className="py-2 px-2.5 text-slate-600">{fire.lat.toFixed(2)}°N, {fire.lon.toFixed(2)}°E</td>
                    <td className="py-2 px-2.5 font-extrabold text-amber-800">{fire.frp} MW</td>
                    <td className="py-2 px-2.5 font-semibold text-emerald-800">{fire.confidence}%</td>
                    <td className="py-2 px-2.5 font-medium">{fire.distance_km} km</td>
                    <td className="py-2 px-2.5 text-slate-600 flex items-center space-x-1">
                      <Compass className="w-3 h-3 text-slate-400" />
                      <span>{fire.direction_deg?.toFixed(0)}° (NW)</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 bg-amber-50 border border-amber-200 p-2.5 rounded text-[11px] text-amber-900 font-medium flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>
              <strong>Note:</strong> Regional fire influence is estimated based on wind vector alignment and distance decay advection models.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
