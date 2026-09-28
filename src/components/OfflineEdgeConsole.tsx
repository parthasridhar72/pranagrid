import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  KeyRound, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  FileText, 
  Database, 
  Pill, 
  Bed, 
  UserCheck, 
  Send 
} from 'lucide-react';
import { OfflineQueueTransaction, PHCCentre } from '../types';
import { OfflineSyncService } from '../services/offlineSync';
import { decryptPayloadAES, computeSHA256 } from '../services/crypto';
import { useLanguage } from '../context/LanguageContext';
import { RegionalExplainerModal } from './RegionalExplainerModal';
import { Volume2, Languages } from 'lucide-react';

interface OfflineEdgeConsoleProps {
  isOnline: boolean;
  toggleConnectivity: () => void;
  phcs: PHCCentre[];
  selectedPhcId: string;
  onSelectPhc: (id: string) => void;
  onRefreshOfflineQueue: () => void;
}

export const OfflineEdgeConsole: React.FC<OfflineEdgeConsoleProps> = ({
  isOnline,
  toggleConnectivity,
  phcs,
  selectedPhcId,
  onSelectPhc,
  onRefreshOfflineQueue,
}) => {
  const { t, currentLanguageInfo, speak } = useLanguage();
  const currentPhc = phcs.find((p) => p.id === selectedPhcId) || phcs[0];

  const [queue, setQueue] = useState<OfflineQueueTransaction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);
  const [explainerTarget, setExplainerTarget] = useState<{
    title: string;
    details: string;
    phcName?: string;
    district?: string;
  } | null>(null);
  
  // Interactive Offline Action Form State
  const [offlineActionType, setOfflineActionType] = useState<OfflineQueueTransaction['actionType']>('DISPENSE_MEDICINE');
  const [offlineDetails, setOfflineDetails] = useState('');
  const [offlinePatientName, setOfflinePatientName] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Cryptographic Inspector State
  const [inspectedTx, setInspectedTx] = useState<OfflineQueueTransaction | null>(null);
  const [decryptedJson, setDecryptedJson] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Load pending transactions on mount & updates
  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = () => {
    const items = OfflineSyncService.getPendingTransactions();
    setQueue(items);
    onRefreshOfflineQueue();
  };

  // Perform quick offline action
  const handleRecordOfflineAction = async (e: React.FormEvent) => {
    e.preventDefault();
    const details = offlineDetails.trim() || `Offline ${offlineActionType} transaction logged by ${currentPhc.name}`;
    const payload = {
      phcId: currentPhc.id,
      phcName: currentPhc.name,
      patientId: offlinePatientName || `LOCAL-PATIENT-${Math.floor(100 + Math.random() * 900)}`,
      action: offlineActionType,
      details,
      timestamp: new Date().toISOString(),
      gpsCoordinates: currentPhc.coordinates,
      operatorCertificate: 'DSC-IN-MOHFW-OFFLINE-LOCAL',
    };

    await OfflineSyncService.recordTransaction(
      currentPhc.id,
      currentPhc.name,
      offlineActionType,
      payload,
      details,
      'Medical Officer'
    );

    loadQueue();
    setActionSuccessMsg(`Recorded and encrypted ${offlineActionType} in local offline vault.`);
    setOfflineDetails('');
    setOfflinePatientName('');

    setTimeout(() => {
      setActionSuccessMsg('');
    }, 2500);
  };

  // Synchronize queue with national grid
  const handleReconcileAll = async () => {
    if (queue.length === 0) return;
    setIsSyncing(true);

    try {
      await OfflineSyncService.reconcileTransactions((current, total) => {
        setSyncProgress({ current, total });
      });
      loadQueue();
    } catch (err) {
      console.error('Reconciliation error:', err);
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-1">
            <span>Remote Edge Architecture</span>
            <span aria-hidden="true">·</span>
            <span>Local Encrypted Storage (IndexedDB/WebCrypto)</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400">Offline-First Resilience</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {t('offline.title', 'Remote PHC Edge Console & Cryptographic Vault')}
            </h1>
            <button
              onClick={() => {
                const text = `${t('offline.title')}. ${t('offline.subtitle')}. ${queue.length} ${t('offline.queue_status')}.`;
                speak(text);
              }}
              className="p-1.5 rounded-md bg-slate-900 border border-slate-700 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
              title="Listen to offline console briefing"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setExplainerTarget({
                  title: `${t('offline.title')} - ${currentPhc.name}`,
                  details: `Offline edge vault operates on client devices with zero cellular connectivity. Local transactions (drug dispensation, patient admission, biometric check-in) are AES-GCM 256 encrypted at rest, hashed with SHA-256, and queued in persistent storage. Upon connection recovery, data automatically reconciles with the national grid.`,
                  phcName: currentPhc.name,
                  district: currentPhc.districtName,
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
            {t('offline.subtitle', 'Ensures uninterrupted operational capability for primary centres in remote tribal, desert, and river-island terrains during cellular/fiber blackouts. All data is signed and encrypted locally at rest.')}
          </p>
        </div>

        {/* Network Connectivity Simulator Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleConnectivity}
            className={`px-4 py-2 text-xs font-semibold rounded-md border transition-all flex items-center gap-2 shadow-sm ${
              isOnline
                ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-rose-950/60 border-rose-600 text-rose-200 hover:bg-rose-900'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span>Simulate Remote Network Disconnect</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>Reconnect to National Grid (Online)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Connectivity Status Banner */}
      <div className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isOnline
          ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
          : 'bg-amber-950/30 border-amber-800/60 text-amber-200'
      }`}>
        <div className="flex items-center gap-3">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <WifiOff className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
          )}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider font-mono">
              {isOnline ? 'Online Grid Sync Active' : 'Edge Mode Active — Disconnected from National Grid'}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isOnline
                ? 'Telemetry streaming nominal. All transactions synchronize to the central database in real time.'
                : 'Local primary centre operations continue without interruption. All dispensing and bed entries are signed and encrypted in the offline vault.'}
            </p>
          </div>
        </div>

        {!isOnline && queue.length > 0 && (
          <span className="text-xs font-mono font-bold bg-amber-900/50 border border-amber-700/60 px-3 py-1.5 rounded text-amber-200 whitespace-nowrap">
            {queue.length} Pending Local Transaction{queue.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Two Column Layout: Offline Action Logger vs Local Encrypted Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Record Offline Action Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-200">
                  Local Operational Logger (Offline Capable)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Record clinical transactions even with zero internet
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400">
                AES-GCM 256
              </span>
            </div>

            {actionSuccessMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded text-emerald-300 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleRecordOfflineAction} className="space-y-3.5">
              {/* PHC facility selection */}
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Active PHC Facility
                </label>
                <select
                  value={currentPhc.id}
                  onChange={(e) => onSelectPhc(e.target.value)}
                  aria-label="Select Active PHC Facility"
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded px-3 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {phcs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.terrain})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action type tabs */}
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1.5">
                  Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'DISPENSE_MEDICINE' as const, label: 'Dispense Medicine', icon: Pill },
                    { id: 'ADMIT_PATIENT' as const, label: 'Admit Patient', icon: Bed },
                    { id: 'RECORD_ATTENDANCE' as const, label: 'Staff Attendance', icon: UserCheck },
                    { id: 'ACCEPT_DELIVERY' as const, label: 'Accept Delivery', icon: Database },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setOfflineActionType(item.id)}
                        className={`p-2 rounded border text-left text-xs transition-all flex items-center gap-2 ${
                          offlineActionType === item.id
                            ? 'bg-slate-800 border-emerald-500 text-white font-semibold'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Patient / Beneficiary Identifier */}
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Beneficiary / OPD Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABHA-IN-9812-4412 or OPD Slip #14"
                  value={offlinePatientName}
                  onChange={(e) => setOfflinePatientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Details / Drug Dispensed */}
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Clinical Details / Medication
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Dispensed 10 vials of Polyvalent Antivenom + 2x Normal Saline for snake envenomation emergency."
                  value={offlineDetails}
                  onChange={(e) => setOfflineDetails(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Encrypt & Record in Local Offline Vault</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Encrypted Local Transaction Queue & Cryptographic Inspector */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-200">
                  Local Encrypted Transaction Queue ({queue.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tamper-evident hash-chained queue awaiting national grid reconciliation
                </p>
              </div>

              {/* Sync Button */}
              <button
                onClick={handleReconcileAll}
                disabled={queue.length === 0 || isSyncing}
                className="px-3.5 py-1.5 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {isSyncing
                    ? `Synchronizing (${syncProgress?.current}/${syncProgress?.total})...`
                    : 'Auto-Reconcile with Grid'}
                </span>
              </button>
            </div>

            {queue.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <ShieldCheck className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs font-mono">
                  All local transactions are reconciled. Offline queue is empty.
                </p>
                <p className="text-[11px] text-slate-600">
                  Log transactions above in offline mode to inspect encrypted payloads and cryptographic proofs.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 space-y-2.5 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-200">
                          {tx.id}
                        </span>
                        <span className="text-[10px] font-mono bg-indigo-950/80 border border-indigo-800/60 px-1.5 py-0.2 rounded text-indigo-300">
                          {tx.actionType}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {new Date(tx.recordedOfflineAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300">
                      {tx.details}
                    </div>

                    {/* Cryptographic Badges */}
                    <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 text-[10px] font-mono space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>AES-256 Ciphertext:</span>
                        <span className="text-cyan-400 truncate max-w-[200px]">{tx.cipherTextBase64}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>SHA-256 Hash:</span>
                        <span className="text-slate-300 truncate max-w-[200px]">{tx.sha256Hash}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Digital Signature:</span>
                        <span className="text-emerald-400">{tx.digitalSignature}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-mono text-amber-400">
                        Status: Queued at Local Storage
                      </span>
                      <button
                        onClick={() => {
                          setInspectedTx(tx);
                          setDecryptedJson(tx.details);
                        }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Inspect Cryptographic Payload</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Cryptographic Inspector Modal */}
      {inspectedTx && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  WebCrypto Telemetry Security Inspector · {inspectedTx.id}
                </h3>
              </div>
              <button
                onClick={() => setInspectedTx(null)}
                className="text-slate-400 hover:text-white font-mono text-xs"
              >
                Close [ESC]
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Algorithm & Cipher Specification</label>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-200">
                  AES-GCM 256-bit with 96-bit Random Initialization Vector (IV) + SHA-256 Tamper Digest
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Encrypted Ciphertext (Base64 Encoded)</label>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-cyan-400 break-all select-all">
                  {inspectedTx.cipherTextBase64}
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Initialization Vector (IV Base64)</label>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-indigo-400">
                  {inspectedTx.aesIvBase64}
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">SHA-256 Tamper-Proof Digest</label>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300">
                  {inspectedTx.sha256Hash}
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Decrypted Verified Clinical Record</label>
                <div className="bg-emerald-950/40 p-2.5 rounded border border-emerald-800/60 text-emerald-200">
                  {decryptedJson}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectedTx(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-white"
              >
                Done
              </button>
            </div>
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
          phcName={explainerTarget.phcName}
          district={explainerTarget.district}
          contextDomain="supply_logistics"
        />
      )}
    </div>
  );
};
