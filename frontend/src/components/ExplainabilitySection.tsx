import React from 'react';
import type { ForecastExplanation } from '../types';
import { HelpCircle, TrendingUp, TrendingDown, ArrowRight, ShieldCheck } from 'lucide-react';

interface ExplainabilitySectionProps {
  explanation: ForecastExplanation;
  selectedHour: number;
}

export const ExplainabilitySection: React.FC<ExplainabilitySectionProps> = ({
  explanation,
  selectedHour
}) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-indigo-50 text-indigo-900 rounded-md">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Why is Air Quality Changing at T+{selectedHour} Hours?
            </h2>
            <p className="text-xs text-slate-500">
              Explainable AI (XAI) feature contribution breakdown derived from coupled meteorological-chemistry model inputs
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded border border-slate-200 text-xs">
          <span className="text-slate-500 font-medium">Target Prediction:</span>
          <span className="font-extrabold text-slate-900">AQI {explanation.predicted_aqi}</span>
          <span className={`font-bold ${explanation.delta_from_current >= 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
            ({explanation.delta_from_current >= 0 ? `+${explanation.delta_from_current}` : explanation.delta_from_current} vs Current)
          </span>
        </div>
      </div>

      {/* Primary Reason Headline Box */}
      <div className="bg-blue-50/60 border border-blue-200 p-3.5 rounded-lg mb-5 text-xs text-slate-800 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-blue-900 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-blue-950 uppercase tracking-wider block mb-1">
            Model Explanation Rationale:
          </span>
          <p className="leading-relaxed font-medium">{explanation.primary_reason}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Model Feature Contribution Waterfall/Bar Chart */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Model Feature Contribution Breakdown
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
              Model feature contribution
            </span>
          </div>

          <div className="space-y-3">
            {explanation.top_factors.map((factor) => {
              const maxScore = Math.max(...explanation.top_factors.map(f => f.contribution_score), 50);
              const pct = (factor.contribution_score / maxScore) * 100;
              const isIncrease = factor.direction === 'increase';

              return (
                <div key={factor.feature_name} className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
                      {isIncrease ? (
                        <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>{factor.display_name}</span>
                    </span>
                    <span className="font-extrabold text-slate-900">
                      +{factor.contribution_score} pts
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isIncrease ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-600 mt-1.5 font-medium leading-normal">
                    {factor.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Natural Language Key Takeaways */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center space-x-1.5">
              <ArrowRight className="w-4 h-4 text-blue-900" />
              <span>Key Atmospheric Drivers at T+{selectedHour}h</span>
            </h3>

            <ul className="space-y-2 text-xs">
              {explanation.summary_bullet_points.map((bullet, idx) => (
                <li key={idx} className="flex items-start space-x-2 bg-white p-2.5 rounded border border-slate-200 text-slate-800 font-medium">
                  <span className="text-blue-900 font-bold">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Explainer algorithm: SHAP feature value decomposition</span>
            <span className="font-semibold text-slate-700">Validated physics coupled rules</span>
          </div>
        </div>
      </div>
    </div>
  );
};
