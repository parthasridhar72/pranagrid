import React from 'react';
import { AlertTriangle, X, Flame, Droplets, CloudRain, Zap, Check } from 'lucide-react';
import { OutbreakScenario } from '../types';

interface OutbreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarios: OutbreakScenario[];
  activeScenario: OutbreakScenario | null;
  onSelectScenario: (scenario: OutbreakScenario | null) => void;
}

export const OutbreakModal: React.FC<OutbreakModalProps> = ({
  isOpen,
  onClose,
  scenarios,
  activeScenario,
  onSelectScenario,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-xl w-full p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Emergency Stress Simulation Drills
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Simulate real-world public health emergencies to stress-test Primary Healthcare Centre supply resilience, automated early warnings, and cross-district redistribution routing.
        </p>

        <div className="space-y-2.5">
          {scenarios.map((sc) => {
            const isSelected = activeScenario?.id === sc.id;
            return (
              <div
                key={sc.id}
                onClick={() => {
                  onSelectScenario(isSelected ? null : sc);
                }}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xs text-slate-100 flex items-center gap-2">
                    <span>{sc.name}</span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-900">
                      +{Math.round((sc.footfallMultiplier - 1) * 100)}% Surge
                    </span>
                  </div>
                  {isSelected ? (
                    <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Active Drill
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 font-mono">Click to Activate</span>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  Corridor: {sc.tagline} · Affected States: {sc.affectedStates.join(', ')}
                </div>

                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  {sc.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          {activeScenario ? (
            <button
              onClick={() => onSelectScenario(null)}
              className="text-xs text-rose-400 hover:text-rose-300 font-mono underline"
            >
              Reset to Nominal Baseline
            </button>
          ) : (
            <span className="text-[11px] text-slate-500 font-mono">
              Currently running on nominal baseline parameters
            </span>
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
