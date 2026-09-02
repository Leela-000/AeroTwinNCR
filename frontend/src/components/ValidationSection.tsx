import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend
} from 'recharts';
import type { ValidationMetrics } from '../types';
import { fetchValidationMetrics } from '../services/api';
import { BarChart3, CheckCircle } from 'lucide-react';

export const ValidationSection: React.FC = () => {
  const [metrics, setMetrics] = useState<ValidationMetrics | null>(null);

  useEffect(() => {
    fetchValidationMetrics().then(setMetrics);
  }, []);

  if (!metrics) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading validation metrics...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-emerald-50 text-emerald-900 rounded-md">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Model Performance & Verification Benchmarks
            </h2>
            <p className="text-xs text-slate-500">
              Evaluated on {metrics.sample_size} historical Delhi NCR winter hours split
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded border border-slate-200">
          Model: {metrics.model_name}
        </span>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: MAE */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Mean Absolute Error (MAE)</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-blue-900">{metrics.mae}</span>
            <span className="text-xs text-slate-500 font-semibold">µg/m³</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Baseline Persistence MAE: <strong>{metrics.baseline_mae} µg/m³</strong> ({((1 - metrics.mae/metrics.baseline_mae)*100).toFixed(0)}% lower error)
          </p>
        </div>

        {/* Card 2: RMSE */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Root Mean Squared Error (RMSE)</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-blue-900">{metrics.rmse}</span>
            <span className="text-xs text-slate-500 font-semibold">µg/m³</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Baseline Persistence RMSE: <strong>{metrics.baseline_rmse} µg/m³</strong>
          </p>
        </div>

        {/* Card 3: R2 Score */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Coeff. of Determination (R²)</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-800">{metrics.r2}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">High Fit</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Strong correlation across winter episode peaks
          </p>
        </div>

        {/* Card 4: AQI Category Accuracy */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">AQI Category Accuracy</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{metrics.aqi_category_accuracy}%</span>
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Correctly classifies CPCB AQI categories
          </p>
        </div>
      </div>

      {/* Actual vs Predicted Time-Series Chart */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
          Ground Truth Actual PM2.5 vs AeroTwin & Persistence Predictions
        </h3>

        <div className="h-64 w-full bg-white p-2 rounded border border-slate-200">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.time_series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={11} label={{ value: 'PM2.5 (µg/m³)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="actual_pm25" name="Actual PM2.5 (Observed)" stroke="#0f172a" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="predicted_pm25" name="AeroTwin Physics-Guided XGBoost" stroke="#2563eb" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="baseline_pm25" name="Persistence Baseline" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
