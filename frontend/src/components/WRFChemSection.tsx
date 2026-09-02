import React, { useEffect, useState } from 'react';
import type { WRFChemGridStatus } from '../types';
import { fetchWRFStatus } from '../services/api';
import { Layers, Database, Cpu, CheckCircle2 } from 'lucide-react';

export const WRFChemSection: React.FC = () => {
  const [wrfStatus, setWrfStatus] = useState<WRFChemGridStatus | null>(null);

  useEffect(() => {
    fetchWRFStatus().then(setWrfStatus);
  }, []);

  if (!wrfStatus) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading WRF-Chem status...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-indigo-900 text-white rounded-md">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              WRF-Chem Coupled Atmospheric Model Integration Architecture
            </h2>
            <p className="text-xs text-slate-500">
              3D Weather Research & Forecasting coupled with Chemistry numerical grid interface adapter
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded border border-emerald-300 flex items-center space-x-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{wrfStatus.status}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Architectural Capabilities */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center space-x-1.5">
            <Cpu className="w-4 h-4 text-blue-900" />
            <span>Operational Architecture Specification</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 font-semibold block">Coupled Model Core:</span>
              <span className="font-bold text-slate-900">{wrfStatus.coupled_model_name}</span>
            </div>

            <div>
              <span className="text-slate-500 font-semibold block">Grid Resolution & Domain:</span>
              <span className="font-bold text-slate-900">{wrfStatus.grid_resolution} | {wrfStatus.active_domain}</span>
            </div>

            <div>
              <span className="text-slate-500 font-semibold block">Last Synchronized Model Run:</span>
              <span className="font-mono text-slate-700">{wrfStatus.last_run_timestamp}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Coupled Variables Ingestion Schema */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 lg:col-span-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center space-x-1.5">
            <Database className="w-4 h-4 text-purple-900" />
            <span>3D Atmospheric Grid Variable Ingestion Registry (netCDF4 / GRIB2)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {wrfStatus.coupled_variables.map((variable, idx) => (
              <div key={idx} className="bg-white p-2.5 rounded border border-slate-200 text-xs font-semibold text-slate-800 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                <span>{variable}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded text-xs text-indigo-950 font-medium">
            <strong>WRF-Chem Production Scaling Note:</strong> For full operational deployment, AeroTwin NCR acts as a real-time post-processing and machine-learning error correction layer over raw 3D WRF-Chem grid runs, resolving sub-grid urban parameterizations for Delhi NCR monitoring stations.
          </div>
        </div>
      </div>
    </div>
  );
};
