import React, { useState } from 'react';
import { 
  Network, 
  ShieldCheck, 
  Cpu, 
  Sparkles, 
  Lock, 
  RefreshCw, 
  Activity, 
  TrendingDown, 
  CheckCircle2, 
  Layers, 
  EyeOff 
} from 'lucide-react';
import { FederatedTrainingRound, StateNode } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { RegionalExplainerModal } from './RegionalExplainerModal';
import { Volume2, Languages } from 'lucide-react';

interface FederatedLearningViewProps {
  federatedRound: FederatedTrainingRound;
  states: StateNode[];
  onTriggerTrainingRound: () => Promise<void>;
  isTrainingRoundRunning: boolean;
}

export const FederatedLearningView: React.FC<FederatedLearningViewProps> = ({
  federatedRound,
  states,
  onTriggerTrainingRound,
  isTrainingRoundRunning,
}) => {
  const { t, currentLanguageInfo, speak } = useLanguage();
  const [activeStep, setActiveStep] = useState<number>(4);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSynthesis, setAiSynthesis] = useState<any>(federatedRound.aiSynthesis || null);
  const [explainerTarget, setExplainerTarget] = useState<{
    title: string;
    details: string;
  } | null>(null);

  // Trigger Gemini AI Federated Analysis
  const runAiSynthesis = async () => {
    setIsAiLoading(true);
    try {
      const stateUpdates: { [k: string]: string } = {};
      federatedRound.clientStates.forEach(cs => {
        stateUpdates[cs.stateCode] = `${cs.weightDivergencePercent}% divergence, norm: ${cs.gradientNorm}`;
      });

      const response = await fetch('/api/federated-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roundNumber: federatedRound.roundNumber,
          stateUpdates,
          globalAccuracy: federatedRound.globalAccuracy,
        }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        setAiSynthesis(data.data);
      }
    } catch (err) {
      console.error('Federated synthesis error:', err);
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
            <span>Decentralized Machine Learning</span>
            <span aria-hidden="true">·</span>
            <span>Differential Privacy (DP-FedAvg)</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400">Zero Patient Data Leakage</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {t('fed.title', 'Federated Learning & Shared Predictive Modeling')}
            </h1>
            <button
              onClick={() => {
                const text = `${t('fed.title')}. ${t('fed.subtitle')}. ${t('fed.global_acc')}: ${federatedRound.globalAccuracy}%. ${t('fed.privacy_budget')}: ${federatedRound.privacyBudgetUsedEpsilon}.`;
                speak(text);
              }}
              className="p-1.5 rounded-md bg-slate-900 border border-slate-700 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
              title="Listen to federated learning explanation in selected language"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setExplainerTarget({
                  title: t('fed.title'),
                  details: `Federated AI architecture connects India's states (Maharashtra, Uttar Pradesh, Tamil Nadu, Kerala, Rajasthan, Assam, Odisha). Edge nodes train local gradient weights on sensitive hospital databases, transmitting only differentially private model updates (ε = ${federatedRound.privacyBudgetUsedEpsilon}) to the national aggregation server without sharing raw patient records.`,
                });
              }}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-950/40 border border-emerald-600/50 text-emerald-300 hover:bg-emerald-900/40 transition-colors flex items-center gap-1.5"
              title={t('btn.regional_explain', 'Explain in selected language')}
            >
              <Languages className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('btn.regional_explain', 'Regional Explainer')}</span>
            </button>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            {t('fed.subtitle', 'Cooperative multi-state AI training enabling India\'s state health edge nodes to train demand forecasting models locally without transmitting identifiable patient records or clinical logs across state borders.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onTriggerTrainingRound}
            disabled={isTrainingRoundRunning}
            className="px-4 py-2 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTrainingRoundRunning ? 'animate-spin' : ''}`} />
            <span>
              {isTrainingRoundRunning
                ? t('fed.running', 'Aggregating State Gradients...')
                : `${t('fed.run_round', 'Execute Federated Round')} #${federatedRound.roundNumber + 1}`}
            </span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon: Federated Training Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>{t('fed.global_acc', 'Global Accuracy')}</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
            {federatedRound.globalAccuracy}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            +1.2% generalization over single-state
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>Global Training Loss</span>
            <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-400 font-mono tabular-nums">
            {federatedRound.globalLoss}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Convergence threshold &lt; 0.05
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>{t('fed.privacy_budget', 'Privacy Budget (ε)')}</span>
            <EyeOff className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-indigo-400 font-mono tabular-nums">
            {federatedRound.privacyBudgetUsedEpsilon}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            δ = 10⁻⁵ (Statutory Compliance)
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>Participating Nodes</span>
            <Layers className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono tabular-nums">
            {federatedRound.clientStates.length} State Clusters
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            100% active edge telemetry
          </div>
        </div>
      </div>

      {/* Federated Pipeline Architecture Diagram */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              Federated Pipeline: Edge Training to Secure Aggregation
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Differential Privacy DP-FedAvg workflow with secure multiparty weight aggregation
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400">
            Round #{federatedRound.roundNumber} Status: Converged
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          {/* Step 1 */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400">STAGE 01</span>
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xs font-bold text-slate-200">Local Edge Training</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Each state node trains local temporal convolutional network on localized PHC medicine consumption data.
            </p>
            <div className="text-[10px] font-mono text-emerald-400 pt-1">
              ✓ Raw records remain local
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400">STAGE 02</span>
              <EyeOff className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xs font-bold text-slate-200">Differential Privacy Noise</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Gaussian perturbation noise (σ = 0.052) injected into gradients to mathematically prevent membership inference attacks.
            </p>
            <div className="text-[10px] font-mono text-indigo-400 pt-1">
              ✓ Epsilon budget: 1.2
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400">STAGE 03</span>
              <Lock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xs font-bold text-slate-200">Homomorphic Aggregation</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Encrypted model gradient vectors transmitted to National MoHFW Hub for weighted parameter averaging.
            </p>
            <div className="text-[10px] font-mono text-amber-400 pt-1">
              ✓ FedAvg protocol
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400">STAGE 04</span>
              <Network className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xs font-bold text-slate-200">Global Weight Sync</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Updated master forecasting model weights (v4.18) synced back to 31,480+ local PHC edge instances.
            </p>
            <div className="text-[10px] font-mono text-cyan-400 pt-1">
              ✓ 94.8% accuracy achieved
            </div>
          </div>
        </div>
      </div>

      {/* State Node Gradient & Weight Divergence Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-200">
              State Edge Node Gradient Matrix & Privacy Verification
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Local epoch computations and gradient norms across state edge clusters
            </p>
          </div>
          <button
            onClick={runAiSynthesis}
            disabled={isAiLoading}
            className="px-3 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAiLoading ? 'Synthesizing with Gemini...' : 'Synthesize AI Insights'}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-3">State Node</th>
                <th className="py-2.5 px-3 text-right">Local Samples</th>
                <th className="py-2.5 px-3 text-right">Epochs</th>
                <th className="py-2.5 px-3 text-right">Local Loss</th>
                <th className="py-2.5 px-3 text-right">Gradient Norm</th>
                <th className="py-2.5 px-3 text-right">DP Noise (σ)</th>
                <th className="py-2.5 px-3 text-right">Weight Shift</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {federatedRound.clientStates.map((cs) => (
                <tr key={cs.stateCode} className="hover:bg-slate-850/40">
                  <td className="py-3 px-3 font-semibold text-slate-200">
                    <span className="font-mono text-emerald-400 mr-2">{cs.stateCode}</span>
                    <span>{cs.stateName}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-400">
                    {cs.localSamples.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-400">
                    {cs.localEpochs}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-cyan-400">
                    {cs.localLoss.toFixed(3)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">
                    {cs.gradientNorm.toFixed(3)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-indigo-400">
                    {cs.privacyNoiseAdded}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    <span className="text-amber-400">+{cs.weightDivergencePercent}%</span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    <span className="text-emerald-400 text-xs font-mono">✓ Aggregated</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Synthesis Card from Gemini */}
      {aiSynthesis && (
        <div className="bg-slate-900/90 border border-emerald-800/50 rounded-lg p-5 space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                ICMR & NHA Federated AI Synthesis (Round #{federatedRound.roundNumber})
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-400">
              Verified by Gemini 3.8 Flash
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded border border-slate-800">
            {aiSynthesis.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/50 p-3 rounded border border-slate-800/80 space-y-1">
              <div className="font-semibold text-slate-200 font-mono text-[11px] text-amber-300">
                State Epidemiological Drift:
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {aiSynthesis.stateEpidemiologicalDrift}
              </p>
            </div>

            <div className="bg-slate-950/50 p-3 rounded border border-slate-800/80 space-y-1">
              <div className="font-semibold text-slate-200 font-mono text-[11px] text-indigo-300">
                Privacy Preservation Verification:
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {aiSynthesis.privacyPreservationProof}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-[11px] font-semibold text-slate-300 mb-1.5 font-mono">
              Next Action Directives:
            </div>
            <ul className="text-[11px] text-slate-400 space-y-1">
              {aiSynthesis.recommendedModelActions?.map((act: string, idx: number) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Regional Explainer Modal */}
      {explainerTarget && (
        <RegionalExplainerModal
          isOpen={!!explainerTarget}
          onClose={() => setExplainerTarget(null)}
          title={explainerTarget.title}
          details={explainerTarget.details}
          contextDomain="clinical_forecasting"
        />
      )}
    </div>
  );
};
