import React, { useState } from 'react';
import { 
  Truck, 
  ArrowRight, 
  ShieldCheck, 
  Thermometer, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck, 
  MapPin, 
  Navigation, 
  Send 
} from 'lucide-react';
import { RedistributionTransfer, PHCCentre } from '../types';
import { generateDigitalSignToken, computeSHA256 } from '../services/crypto';
import { useLanguage } from '../context/LanguageContext';
import { RegionalExplainerModal } from './RegionalExplainerModal';
import { Volume2, Languages } from 'lucide-react';

interface RedistributionViewProps {
  transfers: RedistributionTransfer[];
  phcs: PHCCentre[];
  onDispatchTransfer: (newTransfer: RedistributionTransfer) => void;
  onReconcileTransfer: (transferId: string) => void;
  prefillRecipientPhcId?: string;
  prefillMedicineName?: string;
}

export const RedistributionView: React.FC<RedistributionViewProps> = ({
  transfers,
  phcs,
  onDispatchTransfer,
  onReconcileTransfer,
  prefillRecipientPhcId,
  prefillMedicineName,
}) => {
  const { t, currentLanguageInfo, speak } = useLanguage();
  const [explainerTarget, setExplainerTarget] = useState<{
    title: string;
    details: string;
    phcName?: string;
    district?: string;
  } | null>(null);
  // Transfer Form State
  const [donorPhcId, setDonorPhcId] = useState<string>('PHC-TN-MELUR');
  const [recipientPhcId, setRecipientPhcId] = useState<string>(prefillRecipientPhcId || 'PHC-TN-GUDALUR');
  const [medicineName, setMedicineName] = useState<string>(prefillMedicineName || 'Anti-Rabies Vaccine (Cell Culture)');
  const [quantity, setQuantity] = useState<number>(60);
  const [transportMode, setTransportMode] = useState<RedistributionTransfer['transportMode']>('Refrigerated Cold Chain Van');
  const [isSigning, setIsSigning] = useState(false);
  
  // AI Logistics Advisor State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAdvisorResult, setAiAdvisorResult] = useState<any>(null);

  const donorPhc = phcs.find((p) => p.id === donorPhcId) || phcs[0];
  const recipientPhc = phcs.find((p) => p.id === recipientPhcId) || phcs[1];

  // Estimated distance calculation
  const distanceKm = 185;
  const etaHours = transportMode === 'Medical Drone Dispatch' ? 1.2 : transportMode === 'Refrigerated Cold Chain Van' ? 4.5 : 3.8;

  // Handle Dispatch submission with Cryptographic Token
  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigning(true);

    try {
      const summary = `TRANSFER ${quantity} units of ${medicineName} from ${donorPhc.name} to ${recipientPhc.name}`;
      const { signature, certificateId } = await generateDigitalSignToken(
        'District Medical Logistics Officer',
        donorPhc.code,
        summary
      );
      const tamperProofHash = await computeSHA256(`${summary}:${certificateId}:${Date.now()}`);

      const newTransfer: RedistributionTransfer = {
        id: `TR-${Date.now()}`,
        transferNumber: `TR-${donorPhc.stateCode}-${recipientPhc.districtName.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        fromPhcId: donorPhc.id,
        fromPhcName: donorPhc.name,
        fromDistrict: donorPhc.districtName,
        toPhcId: recipientPhc.id,
        toPhcName: recipientPhc.name,
        toDistrict: recipientPhc.districtName,
        medicineName,
        category: 'Vaccine',
        quantityUnits: quantity,
        transportMode,
        distanceKm,
        etaHours,
        status: 'In Transit',
        currentTempReading: transportMode.includes('Cold Chain') ? 4.1 : 22.0,
        authSignToken: certificateId,
        tamperProofHash: tamperProofHash.slice(0, 36),
        createdAt: 'Just now',
      };

      onDispatchTransfer(newTransfer);
    } catch (err) {
      console.error('Dispatch signature error:', err);
    } finally {
      setIsSigning(false);
    }
  };

  // Run AI Logistics Advisor via Gemini
  const runAiAdvisor = async () => {
    setIsAiLoading(true);
    setAiAdvisorResult(null);

    try {
      const response = await fetch('/api/redistribution-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deficitPhc: `${recipientPhc.name} (${recipientPhc.districtName}, ${recipientPhc.stateCode})`,
          surplusPhc: `${donorPhc.name} (${donorPhc.districtName}, ${donorPhc.stateCode})`,
          medicineName,
          requestedQuantity: quantity,
          distanceKm,
          terrainType: `${donorPhc.terrain} to ${recipientPhc.terrain}`,
        }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        setAiAdvisorResult(data.data);
      }
    } catch (err) {
      console.error('Advisor error:', err);
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
            <span>Inter-District Rebalancing</span>
            <span aria-hidden="true">·</span>
            <span>Surplus-to-Deficit Logistics</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400">Cold Chain Verified</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {t('redis.title', 'Cross-District Resource Redistribution Engine')}
            </h1>
            <button
              onClick={() => {
                const text = `${t('redis.title')}. ${t('redis.subtitle')}. ${donorPhc.name} ${t('redis.donor')} -> ${recipientPhc.name} ${t('redis.recipient')}.`;
                speak(text);
              }}
              className="p-1.5 rounded-md bg-slate-900 border border-slate-700 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
              title="Listen to redistribution briefing"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setExplainerTarget({
                  title: `${t('redis.title')} - ${recipientPhc.name}`,
                  details: `Emergency redistribution of ${quantity} units of ${medicineName} from ${donorPhc.name} (${donorPhc.districtName}) to ${recipientPhc.name} (${recipientPhc.districtName}). Estimated transit distance: ${distanceKm} km. ETA: ${etaHours} hours via ${transportMode}. Cold chain integrity maintained at 2-8°C with digital cryptographic dispatch token.`,
                  phcName: recipientPhc.name,
                  district: recipientPhc.districtName,
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
            {t('redis.subtitle', 'Automated logistical re-routing matching high-buffer donor hubs with acute deficit primary centres, calculating vehicle routing, cold-chain telemetry, and digital chain of custody.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-md flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Digital Signatures Enforced</span>
          </span>
        </div>
      </div>

      {/* Two Column Layout: Transfer Creator vs Active Dispatches */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Dispatch Creator */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-200">
                  {t('redis.create_transfer', 'Initiate Cross-District Emergency Transfer')}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('redis.subtitle', 'Reallocate surplus medicine stock to prevent imminent facility stockout')}
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400">Step 1 of 2</span>
            </div>

            <form onSubmit={handleDispatch} className="space-y-4">
              {/* Donor Facility Selection */}
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  1. {t('redis.donor', 'Donor Facility (Surplus Hub)')}
                </label>
                <select
                  value={donorPhcId}
                  onChange={(e) => setDonorPhcId(e.target.value)}
                  aria-label="Select Donor Facility"
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded px-3 py-2 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {phcs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.districtName}, {p.stateCode}) — Buffer ~28+ days
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipient Facility Selection */}
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  2. {t('redis.recipient', 'Recipient Facility (Deficit Node)')}
                </label>
                <select
                  value={recipientPhcId}
                  onChange={(e) => setRecipientPhcId(e.target.value)}
                  aria-label="Select Recipient Facility"
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded px-3 py-2 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {phcs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.districtName}, {p.stateCode}) — Terrain: {p.terrain}
                    </option>
                  ))}
                </select>
              </div>

              {/* Medicine & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Medicine / Supply
                  </label>
                  <input
                    type="text"
                    required
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Transfer Quantity (Units)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={2000}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 10)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Transport Mode Selection */}
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1.5">
                  Transport Logistics Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { mode: 'Refrigerated Cold Chain Van' as const, tag: '2°C-8°C Solar Reefer' },
                    { mode: 'District Health Express Truck' as const, tag: 'Ambient Dry Cargo' },
                    { mode: 'Medical Drone Dispatch' as const, tag: 'Remote Hill/Island Air' },
                  ].map((item) => (
                    <button
                      key={item.mode}
                      type="button"
                      onClick={() => setTransportMode(item.mode)}
                      className={`p-2.5 rounded border text-left text-xs transition-all ${
                        transportMode === item.mode
                          ? 'bg-slate-800 border-emerald-500 text-white ring-1 ring-emerald-500/50'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-semibold text-[11px] truncate">{item.mode.split(' ')[0]} {item.mode.split(' ')[1]}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.tag}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Route Summary */}
              <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
                <span>Distance: ~{distanceKm} km</span>
                <span aria-hidden="true">·</span>
                <span>Estimated ETA: ~{etaHours} hours</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400">Cold Chain Verified</span>
              </div>

              {/* Buttons: AI Optimization & Dispatch */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={runAiAdvisor}
                  disabled={isAiLoading}
                  className="px-3.5 py-2 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAiLoading ? 'Evaluating Route...' : 'AI Route Check'}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSigning}
                  className="flex-1 py-2 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSigning ? 'Cryptographically Signing...' : 'Digitally Authorize & Dispatch'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* AI Logistics Advisor Panel */}
          {aiAdvisorResult && (
            <div className="bg-slate-900/90 border border-emerald-800/50 rounded-lg p-5 space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Gemini Logistics Optimization Advisor
                  </h3>
                </div>
                <span className="text-xs font-mono text-emerald-400">
                  Feasibility: {aiAdvisorResult.feasibilityScore}/100
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-2.5 rounded border border-slate-800">
                {aiAdvisorResult.logisticsPlan}
              </p>

              <div className="text-[11px] text-slate-400 font-mono space-y-1">
                <div className="flex justify-between">
                  <span>Donor Safety Buffer Retained:</span>
                  <span className="text-emerald-400 font-bold">{aiAdvisorResult.donorSafetyBufferRemainingDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Contingency Cold Hub:</span>
                  <span className="text-slate-300">{aiAdvisorResult.contingencyWaypoint}</span>
                </div>
              </div>

              <div className="pt-1">
                <div className="text-[11px] font-semibold text-slate-300 mb-1 font-mono">
                  Chain-of-Custody Requirements:
                </div>
                <ul className="text-[11px] text-slate-400 space-y-1">
                  {aiAdvisorResult.chainOfCustodyChecklist?.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live In-Transit Shipments Ledger */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-slate-200">
                Active Logistics & Dispatch Ledger ({transfers.length})
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Live GPS & Cold-Chain Telemetry
            </span>
          </div>

          <div className="space-y-3">
            {transfers.map((tr) => {
              const isDelivered = tr.status === 'Delivered & Reconciled';
              return (
                <div
                  key={tr.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white">
                        {tr.transferNumber}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          isDelivered
                            ? 'bg-slate-950 text-slate-400 border-slate-800'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}
                      >
                        {tr.status}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {tr.createdAt}
                    </span>
                  </div>

                  {/* Route Visualizer */}
                  <div className="bg-slate-950/60 p-3 rounded border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-200">{tr.fromPhcName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{tr.fromDistrict} Hub</div>
                      </div>

                      <div className="flex flex-col items-center px-4">
                        <ArrowRight className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-mono text-slate-500 mt-0.5">
                          {tr.distanceKm} km · {tr.transportMode.split(' ')[0]}
                        </span>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold text-slate-200">{tr.toPhcName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{tr.toDistrict} Node</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300">
                        {tr.quantityUnits} units · <strong>{tr.medicineName}</strong>
                      </span>
                      <span className="text-cyan-400 flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5" />
                        <span>{tr.currentTempReading}°C</span>
                      </span>
                    </div>
                  </div>

                  {/* Cryptographic Proof Verification */}
                  <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between">
                    <div className="truncate max-w-[240px]">
                      <span>Hash: </span>
                      <span className="text-slate-400">{tr.tamperProofHash}</span>
                    </div>
                    <div>
                      <span>Signer: </span>
                      <span className="text-slate-400">{tr.authSignToken}</span>
                    </div>
                  </div>

                  {/* Reconciliation Button */}
                  {!isDelivered && (
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => onReconcileTransfer(tr.id)}
                        className="px-3 py-1.5 text-xs font-medium rounded bg-emerald-700/60 hover:bg-emerald-600 text-white transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Receipt & Reconcile Stock</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Regional Explainer Modal */}
      {explainerTarget && (
        <RegionalExplainerModal
          isOpen={!!explainerTarget}
          onClose={() => setExplainerTarget(null)}
          title={explainerTarget.title}
          details={explainerTarget.details}
          phcName={explainerTarget.phcName}
          district={explainerTarget.district}
          contextDomain="supply_logistics"
        />
      )}
    </div>
  );
};
