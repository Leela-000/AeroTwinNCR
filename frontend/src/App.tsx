import React, { useEffect, useState } from 'react';
import type {
  AirQualityObs, FireHotspot, ForecastResponse,
  ForecastExplanation, EventAttribution, PlumeTransportResponse
} from './types';
import {
  fetchObservations, fetchFireHotspots, fetch72hForecast,
  fetchForecastExplanation, fetchAttribution, fetchPlumeTransport
} from './services/api';

import { Header } from './components/Header';
import { TopCards } from './components/TopCards';
import { InteractiveMap } from './components/InteractiveMap';
import { ForecastSection } from './components/ForecastSection';
import { TimeBlockSection } from './components/TimeBlockSection';
import { AtmosphericCouplingSection } from './components/AtmosphericCouplingSection';
import { HealthAdvisorySection } from './components/HealthAdvisorySection';
import { ExplainabilitySection } from './components/ExplainabilitySection';
import { AttributionSection } from './components/AttributionSection';
import { ScenarioLabSection } from './components/ScenarioLabSection';
import { ValidationSection } from './components/ValidationSection';
import { ComparisonSection } from './components/ComparisonSection';
import { WRFChemSection } from './components/WRFChemSection';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('DELHI');
  const [selectedHour, setSelectedHour] = useState<number>(24);

  const [observations, setObservations] = useState<AirQualityObs[]>([]);
  const [fireHotspots, setFireHotspots] = useState<FireHotspot[]>([]);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [explanation, setExplanation] = useState<ForecastExplanation | null>(null);
  const [attribution, setAttribution] = useState<EventAttribution | null>(null);
  const [plume, setPlume] = useState<PlumeTransportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [obsList, firesList, fc, exp, attr, plm] = await Promise.all([
        fetchObservations(),
        fetchFireHotspots(),
        fetch72hForecast(selectedLocationId),
        fetchForecastExplanation(selectedLocationId, selectedHour),
        fetchAttribution(selectedLocationId, selectedHour),
        fetchPlumeTransport(selectedHour)
      ]);

      setObservations(obsList);
      setFireHotspots(firesList);
      setForecast(fc);
      setExplanation(exp);
      setAttribution(attr);
      setPlume(plm);
      setLoading(false);
    }
    loadData();
  }, [selectedLocationId, selectedHour]);

  const currentStationObs = observations.find(o => o.station_id.toUpperCase() === selectedLocationId.toUpperCase()) || observations[0];
  const firstPtWeather = forecast?.forecast_points[0]?.weather_snapshot;
  const firstPtPhysics = forecast?.forecast_points[0]?.coupled_features;

  if (loading || !forecast || !explanation || !attribution || !plume || !currentStationObs) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-md text-center max-w-md">
          <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-base font-bold text-slate-900">Initializing AeroTwin NCR Platform</h2>
          <p className="text-xs text-slate-500 mt-1">
            Loading coupled meteorology-chemistry features and 72-hour forecast engine for {selectedLocationId}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDemoMode={isDemoMode}
        setIsDemoMode={setIsDemoMode}
        selectedLocationId={selectedLocationId}
        onSelectLocation={setSelectedLocationId}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <>
            <TopCards currentObs={currentStationObs} forecast={forecast} />

            {/* Split Screen Grid Layout — Grounded Map & Forecast Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 items-stretch">
              <div className="lg:col-span-5 h-full min-h-[500px] flex flex-col">
                <InteractiveMap
                  observations={observations}
                  fireHotspots={fireHotspots}
                  plumePoints={plume.plume_points}
                  selectedStationId={selectedLocationId}
                  onSelectStation={setSelectedLocationId}
                />
              </div>

              <div className="lg:col-span-7 flex flex-col">
                <ForecastSection
                  forecast={forecast}
                  observations={observations}
                  selectedLocationId={selectedLocationId}
                  onSelectLocation={setSelectedLocationId}
                  selectedHour={selectedHour}
                  onSelectHour={setSelectedHour}
                />
              </div>
            </div>

            <TimeBlockSection timeBlocks={forecast.time_blocks} />

            <HealthAdvisorySection
              currentAqi={currentStationObs.aqi}
              selectedLocationId={selectedLocationId}
            />

            {firstPtWeather && firstPtPhysics && (
              <AtmosphericCouplingSection
                weather={firstPtWeather}
                physics={firstPtPhysics}
              />
            )}

            <ExplainabilitySection
              explanation={explanation}
              selectedHour={selectedHour}
            />

            <AttributionSection
              attribution={attribution}
              fireHotspots={fireHotspots}
              plume={plume}
              selectedHour={selectedHour}
            />

            <ScenarioLabSection selectedStationId={selectedLocationId} />
          </>
        )}

        {activeTab === 'coupling' && firstPtWeather && firstPtPhysics && (
          <AtmosphericCouplingSection
            weather={firstPtWeather}
            physics={firstPtPhysics}
          />
        )}

        {activeTab === 'advisories' && (
          <HealthAdvisorySection
            currentAqi={currentStationObs.aqi}
            selectedLocationId={selectedLocationId}
          />
        )}

        {activeTab === 'explain' && (
          <ExplainabilitySection
            explanation={explanation}
            selectedHour={selectedHour}
          />
        )}

        {activeTab === 'attribution' && (
          <AttributionSection
            attribution={attribution}
            fireHotspots={fireHotspots}
            plume={plume}
            selectedHour={selectedHour}
          />
        )}

        {activeTab === 'scenario' && (
          <ScenarioLabSection selectedStationId={selectedLocationId} />
        )}

        {activeTab === 'validation' && (
          <ValidationSection />
        )}

        {activeTab === 'comparison' && (
          <ComparisonSection />
        )}

        {activeTab === 'wrf' && (
          <WRFChemSection />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div>
            <p className="font-semibold text-slate-800">AeroTwin NCR — Smart India Hackathon 2026 Prototype</p>
            <p className="mt-0.5">Physics-Guided 72-Hour Air Pollution–Weather Coupled Forecasting Platform for Delhi NCR</p>
          </div>
          <div className="flex items-center space-x-4 text-slate-600">
            <span>CPCB Indian AQI Standard</span>
            <span>•</span>
            <span>WRF-Chem Architecture Grid Ready</span>
            <span>•</span>
            <span>Explainable AI (XAI)</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
