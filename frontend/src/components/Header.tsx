import React from 'react';
import { Wind, ShieldAlert, Cpu, Activity, Play, Layers, BarChart3, HelpCircle, MapPin, HeartPulse } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  selectedLocationId: string;
  onSelectLocation: (locId: string) => void;
  onRunDemoEpisode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isDemoMode,
  setIsDemoMode,
  selectedLocationId,
  onSelectLocation,
  onRunDemoEpisode
}) => {
  const locations = [
    { id: 'DELHI', name: 'Delhi NCR (Central / Anand Vihar)' },
    { id: 'NOIDA', name: 'Noida (Sector 62)' },
    { id: 'GURUGRAM', name: 'Gurugram (Vikas Sadan)' },
    { id: 'GHAZIABAD', name: 'Ghaziabad (Vasundhara)' },
    { id: 'FARIDABAD', name: 'Faridabad (Sector 11)' },
  ];

  const tabs = [
    { id: 'dashboard', label: '72-Hour Forecast Dashboard', icon: Activity },
    { id: 'coupling', label: 'Atmospheric Coupling', icon: Wind },
    { id: 'advisories', label: 'Health & Activity Advisor', icon: HeartPulse },
    { id: 'explain', label: 'Why is Pollution Changing?', icon: HelpCircle },
    { id: 'attribution', label: 'Regional Attribution & Plumes', icon: Wind },
    { id: 'scenario', label: 'Scenario Lab (What-If)', icon: Cpu },
    { id: 'validation', label: 'Model Validation', icon: BarChart3 },
    { id: 'comparison', label: 'Enhancement Matrix', icon: ShieldAlert },
    { id: 'wrf', label: 'WRF-Chem Integration', icon: Layers },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-900 text-white rounded-lg shadow-sm">
            <Wind className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">AeroTwin NCR</h1>
              <span className="bg-blue-50 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-blue-200">
                Physics-Guided 72h Coupled Forecast
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Delhi NCR Air Pollution–Weather Coupled Forecasting & Decision-Support Platform | SIH 2026
            </p>
          </div>
        </div>

        {/* Controls: Location Selector + Badges */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Location Selector Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-300 rounded px-2.5 py-1">
            <MapPin className="w-3.5 h-3.5 text-blue-900" />
            <select
              value={selectedLocationId}
              onChange={(e) => onSelectLocation(e.target.value)}
              className="text-xs font-bold bg-transparent text-slate-800 focus:outline-none cursor-pointer"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          {/* Data Tag */}
          <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1.5 border ${
            isDemoMode 
              ? 'bg-amber-50 text-amber-900 border-amber-300' 
              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
            <span>{isDemoMode ? 'DEMO / SIMULATED DATASET' : 'LIVE MONITORING DATA'}</span>
          </div>

          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            className="text-xs font-medium px-3 py-1.5 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
          >
            Switch to {isDemoMode ? 'Live Data Mode' : 'Demo Winter Episode'}
          </button>

          {onRunDemoEpisode && (
            <button
              onClick={onRunDemoEpisode}
              className="text-xs font-semibold px-3 py-1.5 rounded bg-blue-700 hover:bg-blue-800 text-white shadow-sm flex items-center space-x-1 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Play 72h Episode</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100">
        <nav className="flex space-x-1 overflow-x-auto py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2.5 px-3.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
