import React, { useState } from 'react';
import type { TimeBlockForecast } from '../types';
import { Clock, ShieldAlert } from 'lucide-react';

interface TimeBlockSectionProps {
  timeBlocks: TimeBlockForecast[];
}

export const TimeBlockSection: React.FC<TimeBlockSectionProps> = ({ timeBlocks }) => {
  const [probThreshold, setProbThreshold] = useState<200 | 300 | 400>(300);

  const getAQIBadge = (aqi: number) => {
    if (aqi <= 50) return { label: 'Good', bg: 'bg-emerald-100', text: 'text-emerald-800' };
    if (aqi <= 100) return { label: 'Satisfactory', bg: 'bg-lime-100', text: 'text-lime-800' };
    if (aqi <= 200) return { label: 'Moderate', bg: 'bg-yellow-100', text: 'text-yellow-800' };
    if (aqi <= 300) return { label: 'Poor', bg: 'bg-orange-100', text: 'text-orange-800' };
    if (aqi <= 400) return { label: 'Very Poor', bg: 'bg-red-100', text: 'text-red-800' };
    return { label: 'Severe', bg: 'bg-rose-900', text: 'text-white' };
  };

  const days = Array.from(new Set(timeBlocks.map(b => b.day_label)));

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-900 text-white rounded-md">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              72-Hour Time-Block AQI Forecast & Probabilistic Exceedance
            </h2>
            <p className="text-xs text-slate-500">
              Divided into 6-hour operational intervals with model-estimated exceedance probability
            </p>
          </div>
        </div>

        {/* Probability Threshold Selector */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-md border border-slate-200 text-xs font-semibold">
          <span className="text-slate-500 px-2">Exceedance Target:</span>
          {[200, 300, 400].map(th => (
            <button
              key={th}
              onClick={() => setProbThreshold(th as any)}
              className={`px-2.5 py-1 rounded transition-colors ${
                probThreshold === th ? 'bg-blue-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              P(AQI &gt; {th})
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Days */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {days.map(day => {
          const blocksForDay = timeBlocks.filter(b => b.day_label === day);
          return (
            <div key={day} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200">
                <span className="font-extrabold text-slate-900 text-sm">{day}</span>
                <span className="text-xs font-semibold text-slate-500">{blocksForDay[0]?.date_str}</span>
              </div>

              <div className="space-y-3">
                {blocksForDay.map((b, idx) => {
                  const badge = getAQIBadge(b.avg_aqi);
                  const probVal = probThreshold === 200 ? b.prob_above_200 : probThreshold === 300 ? b.prob_above_300 : b.prob_above_400;

                  return (
                    <div key={idx} className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{b.block_label}</span>
                        <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded ${badge.bg} ${badge.text}`}>
                          {b.avg_aqi} ({badge.label})
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                        <span className="text-slate-500 font-medium">P(AQI &gt; {probThreshold}):</span>
                        <span className={`font-extrabold ${probVal > 60 ? 'text-rose-700' : probVal > 30 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {probVal}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-[11px] text-slate-500 flex items-center space-x-1.5">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
        <span><strong>Demonstration Probability Label:</strong> Probabilities derived mathematically from simulated prediction error distribution.</span>
      </div>
    </div>
  );
};
