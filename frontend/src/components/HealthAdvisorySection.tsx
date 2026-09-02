import React, { useEffect, useState } from 'react';
import type { HealthRecommendation, ActivityPlan, BestOutdoorWindow, AlertItem } from '../types';
import {
  fetchHealthAdvisory, fetchActivityPlan, fetchBestOutdoorWindow, fetchActiveAlerts
} from '../services/api';
import { HeartPulse, Calendar, Sun, AlertTriangle, ShieldCheck } from 'lucide-react';

interface HealthAdvisorySectionProps {
  currentAqi: number;
  selectedLocationId: string;
}

export const HealthAdvisorySection: React.FC<HealthAdvisorySectionProps> = ({
  currentAqi,
  selectedLocationId
}) => {
  const [health, setHealth] = useState<HealthRecommendation | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string>("Cycling");
  const [activityPlan, setActivityPlan] = useState<ActivityPlan | null>(null);
  const [outdoorWindow, setOutdoorWindow] = useState<BestOutdoorWindow | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const activities = [
    "Walking", "Cycling", "Running", "Outdoor Sports",
    "Commuting", "School", "Outdoor Work", "Indoor Work"
  ];

  useEffect(() => {
    fetchHealthAdvisory(currentAqi).then(setHealth);
    fetchBestOutdoorWindow(selectedLocationId).then(setOutdoorWindow);
    fetchActiveAlerts(selectedLocationId).then(setAlerts);
  }, [currentAqi, selectedLocationId]);

  useEffect(() => {
    fetchActivityPlan(selectedActivity, selectedLocationId).then(setActivityPlan);
  }, [selectedActivity, selectedLocationId]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-rose-900 text-white rounded-md">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Public Health Advisories & Personal Activity Advisor
            </h2>
            <p className="text-xs text-slate-500">
              Actionable, general public-health guidance dynamically derived from 72-hour AQI predictions
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded border border-rose-200">
          General Health Guidance (Not Medical Advice)
        </span>
      </div>

      {/* Active Alerts Row */}
      {alerts.length > 0 && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border text-xs ${
                alert.severity === 'Critical'
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : alert.severity === 'Warning'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-blue-50 border-blue-300 text-blue-950'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span className="flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{alert.title}</span>
                </span>
                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-white/80">
                  {alert.severity}
                </span>
              </div>
              <p className="leading-snug text-[11px] mt-1">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 1. What Should I Do Today? Card */}
        {health && (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-900" />
              <span>What Should I Do Today? (AQI {currentAqi})</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="font-bold text-slate-900 block mb-0.5">General Public:</span>
                <p className="text-slate-700">{health.general_public}</p>
              </div>

              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="font-bold text-amber-900 block mb-0.5">Sensitive Groups (Asthma, Elderly, Children):</span>
                <p className="text-slate-700">{health.sensitive_groups}</p>
              </div>

              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="font-bold text-indigo-900 block mb-0.5">Protective Mask Guidance:</span>
                <p className="text-slate-700">{health.mask_advice}</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. Outdoor Window Advisor Card */}
        {outdoorWindow && (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center space-x-1.5">
                <Sun className="w-4 h-4 text-amber-600" />
                <span>Best Outdoor Window Today</span>
              </h3>

              <div className={`p-4 rounded-lg border text-xs mb-3 ${
                outdoorWindow.is_window_available ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}>
                <div className="font-extrabold text-sm mb-1">
                  {outdoorWindow.window_time_range}
                </div>
                <div className="font-bold mb-2">
                  Expected Range: {outdoorWindow.expected_aqi_range} | Risk: {outdoorWindow.risk_level}
                </div>
                <p className="leading-relaxed text-[11px] font-medium">
                  {outdoorWindow.recommendation_text}
                </p>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 italic">
              Calculated dynamically from boundary layer dispersion and forecast diurnal curves.
            </p>
          </div>
        )}

        {/* 3. Activity Advisor ("PLAN YOUR DAY") */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-purple-900" />
              <span>Plan Your Day — Activity Advisor</span>
            </h3>
          </div>

          <div className="mb-3">
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">Select Activity:</label>
            <select
              value={selectedActivity}
              onChange={e => setSelectedActivity(e.target.value)}
              className="w-full text-xs font-semibold px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              {activities.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          {activityPlan && (
            <div className="space-y-2 text-xs">
              {activityPlan.slots.map((slot, idx) => (
                <div key={idx} className="bg-white p-2 rounded border border-slate-200 flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 block">{slot.time_range}</span>
                    <span className="text-[11px] text-slate-600 block mt-0.5">{slot.recommendation}</span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded whitespace-nowrap ${
                    slot.suitability === 'Suitable' ? 'bg-emerald-100 text-emerald-800' : slot.suitability === 'Caution' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {slot.suitability} (AQI {slot.predicted_aqi})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
