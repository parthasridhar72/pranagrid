import React, { useState } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  Sparkles, 
  Calendar, 
  Truck, 
  CheckCircle2, 
  RefreshCw, 
  ShieldAlert, 
  Activity, 
  Clock, 
  ChevronRight,
  Flame,
  Droplets,
  CloudRain,
  Languages,
  Volume2
} from 'lucide-react';
import { EarlyWarningAlert, PHCCentre, OutbreakScenario } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { RegionalExplainerModal } from './RegionalExplainerModal';

interface DemandForecastingViewProps {
  alerts: EarlyWarningAlert[];
  phcs: PHCCentre[];
  activeScenario: OutbreakScenario | null;
  onSelectScenario: (scenario: OutbreakScenario | null) => void;
  availableScenarios: OutbreakScenario[];
  onAcknowledgeAlert: (alertId: string) => void;
  onInitiateTransferFromAlert: (phcId: string, medicineName: string) => void;
}

export const DemandForecastingView: React.FC<DemandForecastingViewProps> = ({
  alerts,
  phcs,
  activeScenario,
  onSelectScenario,
  availableScenarios,
  onAcknowledgeAlert,
  onInitiateTransferFromAlert,
}) => {
  const { t, currentLanguageInfo, speak } = useLanguage();
  const [selectedPhcId, setSelectedPhcId] = useState<string>(phcs[0]?.id || 'PHC-RJ-SHEO');
  const [forecastHorizon, setForecastHorizon] = useState<'7d' | '14d' | '30d'>('14d');
  
  // AI Advisor state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);

  // Regional explainer modal state
  const [explainerTarget, setExplainerTarget] = useState<{
    title: string;
    details: string;
    phcName?: string;
    district?: string;
  } | null>(null);

  const selectedPhc = phcs.find((p) => p.id === selectedPhcId) || phcs[0];
  const criticalDrug = selectedPhc?.medicineInventory[0];

  // Request Gemini Forecast Analysis
  const runAiForecasting = async () => {
    if (!selectedPhc || !criticalDrug) return;
    setIsAiLoading(true);
    setAiAnalysisResult(null);

    try {
      const response = await fetch('/api/forecast-demand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district: selectedPhc.districtName,
          state: selectedPhc.stateName,
          phcName: selectedPhc.name,
          medicineName: criticalDrug.medicineName,
          currentStock: criticalDrug.currentStock,
          burnRate: criticalDrug.dailyBurnRate,
          footfallTrend: `${selectedPhc.footfall.opdToday} daily OPD (${activeScenario ? activeScenario.name : 'Nominal Seasonal Trajectory'})`,
          emergencyScenario: activeScenario ? activeScenario.name : 'Standard Operational Profile',
        }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        setAiAnalysisResult(data.data);
      }
    } catch (err) {
      console.error('AI Forecast error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-1">
            <span>Predictive Epidemiology</span>
            <span aria-hidden="true">·</span>
            <span>Early Warning System (EWS)</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400">Stock-out Prevention</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {t('forecast.title', 'Demand Forecasting & Emergency Early Warnings')}
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            {t('forecast.subtitle', 'Multi-horizon consumption modeling combining localized footfall trends, monsoon vector signals, and seasonal surge dynamics to project stock-outs before they disrupt clinical care.')}
          </p>
        </div>

        {/* Emergency Drill Switcher */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1.5">
          <span className="text-xs text-slate-400 font-mono px-2">Outbreak Drill:</span>
          {availableScenarios.map((sc) => {
            const isCurrent = activeScenario?.id === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => onSelectScenario(isCurrent ? null : sc)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-all whitespace-nowrap ${
                  isCurrent
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={sc.description}
              >
                {sc.name.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Drill Notification if enabled */}
      {activeScenario && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-amber-900/60 text-amber-300">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-200 uppercase tracking-wide font-mono">
                Active Stress Simulation: {activeScenario.name}
              </div>
              <p className="text-xs text-amber-300/80 mt-0.5">
                {activeScenario.description}
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectScenario(null)}
            className="text-xs font-mono text-amber-400 hover:text-amber-200 underline whitespace-nowrap"
          >
            Reset Simulation
          </button>
        </div>
      )}

      {/* Two-Column Layout: Alerts on Left, Forecasting & Gemini Advisor on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Early Warning Alert Stream */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-semibold text-slate-200">
                Active Early Warning Alerts ({alerts.length})
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Live EWS Feed
            </span>
          </div>

          <div className="space-y-3">
            {alerts.map((alert) => {
              const isCritical = alert.severity === 'CRITICAL';
              return (
                <div
                  key={alert.id}
                  className={`bg-slate-900/80 border rounded-lg p-4 space-y-3 transition-all ${
                    isCritical
                      ? 'border-rose-900/60 shadow-sm shadow-rose-950/30'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                            isCritical
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-xs font-bold text-slate-200">
                          {alert.phcName} ({alert.district}, {alert.stateCode})
                        </span>
                      </div>
                      <h3 className="text-xs font-medium text-slate-100 mt-1">
                        {alert.title}
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap">
                      {alert.timestamp}
                    </span>
                  </div>

                  <div className="bg-slate-950/60 rounded p-2.5 border border-slate-800/80 text-xs font-mono space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>{t('inv.current_stock', 'Monitored Drug')}:</span>
                      <span className="text-slate-200 font-semibold">{alert.medicineOrResource}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>{t('forecast.projected_hours', 'Buffer Zero Point')}:</span>
                      <span className="text-rose-400 font-bold">{alert.projectedStockoutHours} {t('forecast.hours', 'hours')} ({alert.currentBufferDays}d)</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>{t('forecast.surge_factor', 'Surge Driver')}:</span>
                      <span className="text-amber-300">{alert.surgeFactor}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {alert.reason}
                  </p>

                  <div className="text-[11px] text-emerald-400/90 bg-emerald-950/20 border border-emerald-900/40 p-2 rounded">
                    <strong>{t('forecast.recommended_action', 'Recommended Protocol')}:</strong> {alert.recommendedAction}
                  </div>

                  {/* Actions & Regional Localization Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/70">
                    <div className="flex items-center gap-2">
                      {/* Regional Translation & Explanation Modal trigger */}
                      <button
                        onClick={() =>
                          setExplainerTarget({
                            title: alert.title,
                            details: `${alert.medicineOrResource}. ${alert.reason}. Action: ${alert.recommendedAction}`,
                            phcName: alert.phcName,
                            district: alert.district,
                          })
                        }
                        className="px-2 py-1 rounded bg-amber-950/40 border border-amber-600/40 text-amber-300 hover:bg-amber-900/50 text-xs font-medium flex items-center gap-1.5 transition-all"
                        title={t('btn.regional_explain', 'Explain in selected language')}
                      >
                        <Languages className="w-3.5 h-3.5 text-amber-400" />
                        <span>{t('btn.regional_explain', 'Regional Explainer')}</span>
                      </button>

                      {/* Direct Audio Speech Button */}
                      <button
                        onClick={() => {
                          const alertSpeech = `${alert.phcName}: ${alert.title}. ${alert.medicineOrResource}. ${alert.projectedStockoutHours} ${t('forecast.hours', 'hours')}. ${alert.recommendedAction}`;
                          speak(alertSpeech);
                        }}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
                        title={t('btn.listen_audio', 'Listen to Alert')}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onAcknowledgeAlert(alert.id)}
                        className={`text-xs font-mono transition-colors ${
                          alert.acknowledged ? 'text-slate-500' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {alert.acknowledged ? '✓ Acknowledged' : 'Acknowledge'}
                      </button>

                      <button
                        onClick={() => onInitiateTransferFromAlert(alert.phcId, alert.medicineOrResource)}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>{t('forecast.redistribute_btn', 'Initiate Transfer')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Time-Series Demand Forecaster & AI Epidemiological Advisor */}
        <div className="lg:col-span-7 space-y-5">
          {/* Facility & Drug Time-Series Forecaster Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-200">
                  Time-Series Demand Projection
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Historical consumption vs AI demand trajectory
                </p>
              </div>

              {/* Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedPhcId}
                  onChange={(e) => setSelectedPhcId(e.target.value)}
                  aria-label="Select Facility for Demand Projection"
                  className="bg-slate-950 border border-slate-700 text-xs text-white rounded px-2.5 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {phcs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.districtName})
                    </option>
                  ))}
                </select>

                <div className="flex items-center bg-slate-950 border border-slate-800 rounded p-0.5">
                  {(['7d', '14d', '30d'] as const).map((h) => (
                    <button
                      key={h}
                      onClick={() => setForecastHorizon(h)}
                      className={`px-2 py-1 text-[11px] font-mono rounded ${
                        forecastHorizon === h ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Drug Telemetry Summary */}
            {criticalDrug && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                  <div className="text-[11px] text-slate-500 font-mono">Current Stock</div>
                  <div className="text-base font-bold text-slate-200 font-mono tabular-nums">
                    {criticalDrug.currentStock} {criticalDrug.unitType}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                  <div className="text-[11px] text-slate-500 font-mono">Daily Burn Rate</div>
                  <div className="text-base font-bold text-amber-400 font-mono tabular-nums">
                    {criticalDrug.dailyBurnRate} units/d
                  </div>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                  <div className="text-[11px] text-slate-500 font-mono">Buffer Threshold</div>
                  <div className="text-base font-bold text-slate-300 font-mono tabular-nums">
                    {criticalDrug.minimumSafetyBuffer} units
                  </div>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                  <div className="text-[11px] text-slate-500 font-mono">Projected Depletion</div>
                  <div className="text-base font-bold text-rose-400 font-mono tabular-nums">
                    {criticalDrug.projectedDaysRemaining} days
                  </div>
                </div>
              </div>
            )}

            {/* Simulated Forecast Curve Graphic */}
            <div className="bg-slate-950 rounded-lg border border-slate-800/80 p-4">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-slate-400" /> Historical Consumption (D-14 to D0)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-rose-400 border-dashed" /> Projected Deficit Curve (D0 to D+{forecastHorizon.replace('d', '')})
                </span>
              </div>

              {/* Bar & Trend visualization */}
              <div className="h-44 flex items-end gap-1.5 pt-6 pb-2 px-2">
                {/* 10 Historical days */}
                {[22, 25, 24, 28, 29, 32, 34, 38, 41, 44].map((burn, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div
                      className="w-full bg-slate-700/80 hover:bg-slate-600 rounded-t"
                      style={{ height: `${(burn / 60) * 100}%` }}
                    />
                    <span className="text-[9px] font-mono text-slate-500 mt-1">D-{10 - i}</span>
                  </div>
                ))}

                {/* Vertical Divider for TODAY */}
                <div className="w-px h-full bg-emerald-500/80 relative">
                  <span className="absolute -top-4 -left-3 text-[9px] font-mono text-emerald-400 font-bold">
                    TODAY
                  </span>
                </div>

                {/* Forecasted days under surge */}
                {[48, 52, 55, 59, 62, 65, 70].map((proj, i) => (
                  <div key={`p-${i}`} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div
                      className="w-full bg-rose-500/60 border-t border-rose-400 border-dashed rounded-t hover:bg-rose-500"
                      style={{ height: `${(proj / 75) * 100}%` }}
                    />
                    <span className="text-[9px] font-mono text-rose-400 mt-1">+{i + 1}d</span>
                  </div>
                ))}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                <span>Confidence Interval: 94.2% (Gaussian Process Regression)</span>
                <span className="text-rose-400">Deficit breached at Day +{criticalDrug?.projectedDaysRemaining || 2}</span>
              </div>
            </div>

            {/* Run AI Advisor Button */}
            <div className="pt-2">
              <button
                onClick={runAiForecasting}
                disabled={isAiLoading}
                className="w-full py-2.5 px-4 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>
                  {isAiLoading
                    ? 'Synthesizing Epidemiological Intelligence via Gemini 3.8 Flash...'
                    : `Analyze Supply Shock & Contingency Plan for ${selectedPhc.name}`}
                </span>
              </button>
            </div>
          </div>

          {/* AI Advisor Response Panel */}
          {aiAnalysisResult && (
            <div className="bg-slate-900/90 border border-emerald-800/50 rounded-lg p-5 space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Gemini Clinical Supply Advisory · {selectedPhc.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setExplainerTarget({
                        title: `${t('forecast.title', 'Supply Advisory')}: ${selectedPhc.name}`,
                        details: `${aiAnalysisResult.clinicalRiskAssessment}. Actions: ${aiAnalysisResult.immediateBufferActions?.join('; ')}`,
                        phcName: selectedPhc.name,
                        district: selectedPhc.districtName,
                      })
                    }
                    className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 text-[11px] font-medium flex items-center gap-1"
                    title={t('btn.regional_explain', 'Explain in selected language')}
                  >
                    <Languages className="w-3 h-3 text-emerald-400" />
                    <span>{t('btn.regional_explain', 'Regional Explainer')}</span>
                  </button>
                  <button
                    onClick={() => speak(aiAnalysisResult.clinicalRiskAssessment)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 text-[11px] flex items-center gap-1"
                    title={t('btn.listen_audio', 'Listen to Advisory')}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-mono text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                    Risk: {aiAnalysisResult.riskLevel} (~{aiAnalysisResult.projectedStockoutHours}h)
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded border border-slate-800 font-sans">
                {aiAnalysisResult.clinicalRiskAssessment}
              </div>

              {/* Epidemiological Drivers & Action Lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/50 p-3 rounded border border-slate-800/80">
                  <div className="font-semibold text-slate-200 mb-2 font-mono text-[11px] flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    <span>Epidemiological Drivers</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-400 text-[11px]">
                    {aiAnalysisResult.epidemiologicalDrivers?.map((driver: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400">·</span>
                        <span>{driver}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-950/50 p-3 rounded border border-slate-800/80">
                  <div className="font-semibold text-slate-200 mb-2 font-mono text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Immediate Clinical Protocol</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-400 text-[11px]">
                    {aiAnalysisResult.immediateBufferActions?.map((action: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-400">✓</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Cold chain & Alternates */}
              <div className="bg-slate-950/50 p-3 rounded border border-slate-800/80 text-[11px] text-slate-400 font-mono space-y-1">
                <div>
                  <strong className="text-slate-300">Cold Chain Directive:</strong> {aiAnalysisResult.coldChainPreservationProtocol}
                </div>
                <div>
                  <strong className="text-slate-300">Alternate Clinical Therapies:</strong> {aiAnalysisResult.alternateMedications?.join(', ')}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Regional Language Clinical Explainer Modal */}
      <RegionalExplainerModal
        isOpen={!!explainerTarget}
        onClose={() => setExplainerTarget(null)}
        title={explainerTarget?.title || ''}
        details={explainerTarget?.details || ''}
        phcName={explainerTarget?.phcName}
        district={explainerTarget?.district}
      />
    </div>
  );
};
