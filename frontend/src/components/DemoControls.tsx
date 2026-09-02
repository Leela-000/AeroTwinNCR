import React from 'react';
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';

interface DemoControlsProps {
  currentDemoStep: number;
  setCurrentDemoStep: (step: number) => void;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
}

export const DemoControls: React.FC<DemoControlsProps> = ({
  currentDemoStep,
  setCurrentDemoStep,
  isPlaying,
  setIsPlaying
}) => {
  const steps = [
    { hour: 0, label: 'T0: Baseline Moderate AQI (~185)' },
    { hour: 12, label: 'T+12h: Inversion Building (~245)' },
    { hour: 24, label: 'T+24h: Strong Inversion Lid (~320)' },
    { hour: 36, label: 'T+36h: Regional Fire Smoke (~395)' },
    { hour: 48, label: 'T+48h: Peak Severe Smog (~445)' },
    { hour: 72, label: 'T+72h: Dispersion Recovery (~210)' },
  ];

  return (
    <div className="bg-amber-50 border border-amber-300 rounded-lg p-3.5 mb-6 shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-amber-600 text-white rounded">
            <FastForward className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
              Judges Demo Mode: 72-Hour Delhi Winter Smog Episode Playback
            </h3>
            <p className="text-[11px] text-amber-800">
              Demonstrates dynamic coupling between weather shifts, inversion capping, fire transport & AQI response
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="py-1 px-3 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded text-xs shadow-sm flex items-center space-x-1 transition-colors"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause Episode' : 'Play Episode'}</span>
          </button>

          <button
            onClick={() => { setIsPlaying(false); setCurrentDemoStep(0); }}
            className="py-1 px-2.5 bg-white hover:bg-amber-100 text-amber-900 font-semibold rounded text-xs border border-amber-300 transition-colors"
            title="Reset Episode to T0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Step Selector Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 mt-2">
        {steps.map(step => (
          <button
            key={step.hour}
            onClick={() => { setIsPlaying(false); setCurrentDemoStep(step.hour); }}
            className={`p-2 rounded text-left transition-all text-xs ${
              currentDemoStep === step.hour
                ? 'bg-amber-900 text-white font-bold shadow ring-2 ring-amber-500'
                : 'bg-white text-amber-950 hover:bg-amber-100 border border-amber-200 font-medium'
            }`}
          >
            <div className="text-[10px] opacity-80">Phase Step</div>
            <div className="truncate font-bold mt-0.5">{step.label}</div>
          </button>
        ))}
      </div>

      <div className="mt-2 text-[10px] text-amber-900 font-bold flex items-center justify-between border-t border-amber-200/80 pt-1.5">
        <span>Explicit Label: Demonstration / simulated scenario</span>
        <span>Delhi Winter Smog Benchmark Series</span>
      </div>
    </div>
  );
};
