import React, { useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend
} from 'recharts';
import type { ScenarioRequest, ScenarioResponse } from '../types';
import { runScenarioSimulation } from '../services/api';
import { Cpu, RotateCcw, Play, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface ScenarioLabSectionProps {
  selectedStationId: string;
}

export const ScenarioLabSection: React.FC<ScenarioLabSectionProps> = ({ selectedStationId }) => {
  const [windMult, setWindMult] = useState<number>(0.6);
  const [pblShift, setPblShift] = useState<number>(-250);
  const [invShift, setInvShift] = useState<number>(1.8);
  const [fireMult, setFireMult] = useState<number>(1.5);

  const [simulationResult, setSimulationResult] = useState<ScenarioResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleRunSimulation = async () => {
    setIsLoading(true);
    const req: ScenarioRequest = {
      wind_speed_multiplier: windMult,
      pbl_height_shift_m: pblShift,
      inversion_strength_shift: invShift,
      fire_intensity_multiplier: fireMult
    };
    const res = await runScenarioSimulation(req, selectedStationId);
    setSimulationResult(res);
    setIsLoading(false);
  };

  const handleReset = () => {
    setWindMult(1.0);
    setPblShift(0);
    setInvShift(0.0);
    setFireMult(1.0);
    setSimulationResult(null);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 mb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-900 text-white rounded-md">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Scenario Lab — Interactive "What-If" Decision Support Simulator
            </h2>
            <p className="text-xs text-slate-500">
              Simulate aerosol dispersion under hypothetical meteorology & emissions interventions
            </p>
          </div>
        </div>

        {/* PROMINENT MANDATORY DISCLAIMER */}
        <div className="bg-amber-100 border border-amber-300 text-amber-950 px-3 py-1.5 rounded font-extrabold text-xs flex items-center space-x-1.5 shadow-sm">
          <AlertOctagon className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>Scenario simulation — not an operational forecast.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Scenario Sliders */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-4">
              Hypothetical Atmospheric Parameters
            </h3>

            {/* Slider 1: Wind Speed Multiplier */}
            <div className="mb-4">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Wind Speed Multiplier:</span>
                <span className="font-extrabold text-blue-900">{windMult.toFixed(2)}x ({((windMult - 1)*100).toFixed(0)}%)</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="2.0"
                step="0.1"
                value={windMult}
                onChange={e => setWindMult(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0.3x (Stagnant)</span>
                <span>1.0x (Normal)</span>
                <span>2.0x (Strong Wind)</span>
              </div>
            </div>

            {/* Slider 2: PBL Height Shift */}
            <div className="mb-4">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">PBL Mixing Height Shift:</span>
                <span className="font-extrabold text-blue-900">{pblShift > 0 ? `+${pblShift}` : pblShift} m</span>
              </div>
              <input
                type="range"
                min="-400"
                max="600"
                step="50"
                value={pblShift}
                onChange={e => setPblShift(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>-400m (Compressed)</span>
                <span>0m</span>
                <span>+600m (Expanded)</span>
              </div>
            </div>

            {/* Slider 3: Inversion Strength Shift */}
            <div className="mb-4">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Inversion Delta-T Shift:</span>
                <span className="font-extrabold text-purple-900">{invShift > 0 ? `+${invShift.toFixed(1)}` : invShift.toFixed(1)} °C</span>
              </div>
              <input
                type="range"
                min="-2.0"
                max="3.5"
                step="0.5"
                value={invShift}
                onChange={e => setInvShift(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-700"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>-2.0°C (Weaker)</span>
                <span>0.0°C</span>
                <span>+3.5°C (Severe Lid)</span>
              </div>
            </div>

            {/* Slider 4: Fire Intensity Multiplier */}
            <div className="mb-5">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Regional Fire FRP Multiplier:</span>
                <span className="font-extrabold text-amber-800">{fireMult.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="3.0"
                step="0.25"
                value={fireMult}
                onChange={e => setFireMult(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0.0x (Zero Fires)</span>
                <span>1.0x</span>
                <span>3.0x (Peak Stubble)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-3 border-t border-slate-200">
            <button
              onClick={handleRunSimulation}
              disabled={isLoading}
              className="flex-1 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded text-xs shadow-sm flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Simulating...' : 'Run Scenario'}</span>
            </button>

            <button
              onClick={handleReset}
              className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded text-xs border border-slate-300 transition-colors"
              title="Reset to Baseline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Baseline vs Scenario Forecast Comparison */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Baseline Forecast vs Scenario Forecast Comparison
              </h3>
              {simulationResult && (
                <div className="flex items-center space-x-2 text-xs font-bold">
                  <span className="text-slate-600">Baseline Avg: {simulationResult.baseline_avg_aqi}</span>
                  <span>➔</span>
                  <span className={simulationResult.delta_aqi > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                    Scenario Avg: {simulationResult.scenario_avg_aqi} ({simulationResult.delta_aqi > 0 ? `+${simulationResult.delta_aqi}` : simulationResult.delta_aqi})
                  </span>
                </div>
              )}
            </div>

            {/* Recharts Comparison Line Chart */}
            <div className="h-64 w-full bg-white p-2 rounded border border-slate-200 mb-3">
              {simulationResult ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={simulationResult.comparison_points}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} domain={[0, 'auto']} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="baseline_aqi"
                      name="Baseline Forecast"
                      stroke="#64748b"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="scenario_aqi"
                      name="Scenario Simulation"
                      stroke={simulationResult.delta_aqi > 0 ? '#dc2626' : '#16a34a'}
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                  <Cpu className="w-8 h-8 mb-2 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-700">No Scenario Run Yet</p>
                  <p className="text-[11px] mt-1 max-w-sm">
                    Adjust the hypothetical weather or stubble fire sliders on the left and click <strong>"Run Scenario"</strong> to observe aerosol dispersion changes.
                  </p>
                </div>
              )}
            </div>

            {simulationResult && (
              <div className="bg-white p-3 rounded border border-slate-200 text-xs text-slate-800">
                <div className="flex items-center space-x-1.5 font-bold text-blue-900 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-blue-700" />
                  <span>Simulation Summary & Decision Insights:</span>
                </div>
                <p className="leading-relaxed font-medium">{simulationResult.summary_text}</p>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between">
            <span>Decision-support model layer</span>
            <span className="font-bold text-amber-900">NOT AN OPERATIONAL FORECAST</span>
          </div>
        </div>
      </div>
    </div>
  );
};
