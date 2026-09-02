import React, { useEffect, useState } from 'react';
import type { ComparisonItem } from '../types';
import { fetchComparisonMatrix } from '../services/api';
import { ShieldCheck, Check, Info } from 'lucide-react';

export const ComparisonSection: React.FC = () => {
  const [matrix, setMatrix] = useState<ComparisonItem[]>([]);

  useEffect(() => {
    fetchComparisonMatrix().then(setMatrix);
  }, []);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-900 text-white rounded-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Enhancement Matrix: How AeroTwin NCR Complements Existing Systems
            </h2>
            <p className="text-xs text-slate-500">
              Positioned as an atmospheric coupling, explainability, and decision-support integration layer
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded border border-blue-200">
          Integration Layer
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider">
              <th className="py-3 px-4 rounded-tl">Capability / Feature</th>
              <th className="py-3 px-4">Standard Monitoring / Forecasting Solutions</th>
              <th className="py-3 px-4 rounded-tr bg-blue-800 text-white">AeroTwin NCR Proposed Integration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {matrix.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                <td className="py-3 px-4 font-bold text-slate-900 border-r border-slate-200">
                  {row.capability}
                </td>
                <td className="py-3 px-4 text-slate-600 border-r border-slate-200">
                  {row.standard_systems}
                </td>
                <td className="py-3 px-4 font-semibold text-blue-950 bg-blue-50/50 flex items-start space-x-2">
                  <Check className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                  <span>{row.aerotwin_ncr}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 bg-slate-50 border border-slate-200 p-3 rounded text-xs text-slate-600 flex items-start space-x-2">
        <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Product Positioning Note:</strong> Existing monitoring dashboards (CPCB, SAFAR, Windy, IQAir) provide invaluable operational measurements and satellite observations. AeroTwin NCR serves to integrate these data streams with physics-guided indicator coupling, explainable feature importance, and interactive decision-support simulation.
        </p>
      </div>
    </div>
  );
};
