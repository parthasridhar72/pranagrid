import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { NationalOverview } from './components/NationalOverview';
import { PHCInventoryView } from './components/PHCInventoryView';
import { DemandForecastingView } from './components/DemandForecastingView';
import { RedistributionView } from './components/RedistributionView';
import { FederatedLearningView } from './components/FederatedLearningView';
import { OfflineEdgeConsole } from './components/OfflineEdgeConsole';
import { OutbreakModal } from './components/OutbreakModal';
import { CryptoAuditModal } from './components/CryptoAuditModal';
import { FloatingLanguageSwitcher } from './components/FloatingLanguageSwitcher';

import { 
  StateNode, 
  District, 
  PHCCentre, 
  EarlyWarningAlert, 
  RedistributionTransfer, 
  FederatedTrainingRound, 
  OutbreakScenario, 
  BedCapacity 
} from './types';

import { 
  INITIAL_STATES, 
  INITIAL_DISTRICTS, 
  INITIAL_PHCS, 
  INITIAL_EARLY_WARNINGS, 
  INITIAL_TRANSFERS, 
  INITIAL_FEDERATED_ROUND, 
  OUTBREAK_SCENARIOS 
} from './services/mockData';

import { OfflineSyncService } from './services/offlineSync';

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Core Healthcare Entities
  const [states, setStates] = useState<StateNode[]>(INITIAL_STATES);
  const [selectedState, setSelectedState] = useState<StateNode>(INITIAL_STATES[0]);
  const [districts, setDistricts] = useState<District[]>(INITIAL_DISTRICTS);
  const [phcs, setPhcs] = useState<PHCCentre[]>(INITIAL_PHCS);
  const [selectedPhcId, setSelectedPhcId] = useState<string>(INITIAL_PHCS[0].id);

  // Early Warnings & Redistribution Transfers
  const [alerts, setAlerts] = useState<EarlyWarningAlert[]>(INITIAL_EARLY_WARNINGS);
  const [transfers, setTransfers] = useState<RedistributionTransfer[]>(INITIAL_TRANSFERS);
  
  // Federated AI Round State
  const [federatedRound, setFederatedRound] = useState<FederatedTrainingRound>(INITIAL_FEDERATED_ROUND);
  const [isTrainingRoundRunning, setIsTrainingRoundRunning] = useState<boolean>(false);

  // Connectivity & Offline Queue State
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);

  // Modals & Scenarios
  const [activeScenario, setActiveScenario] = useState<OutbreakScenario | null>(null);
  const [isOutbreakModalOpen, setIsOutbreakModalOpen] = useState<boolean>(false);
  const [isCryptoModalOpen, setIsCryptoModalOpen] = useState<boolean>(false);

  // Prefill transfer state when jumping from alerts/inventory
  const [prefillRecipientPhcId, setPrefillRecipientPhcId] = useState<string | undefined>(undefined);
  const [prefillMedicineName, setPrefillMedicineName] = useState<string | undefined>(undefined);

  // Load offline queue count on start
  useEffect(() => {
    refreshOfflineQueue();
  }, []);

  const refreshOfflineQueue = () => {
    const queue = OfflineSyncService.getPendingTransactions();
    setOfflineQueueCount(queue.length);
  };

  const toggleConnectivity = () => {
    setIsOnline((prev) => !prev);
  };

  // Handle Dispensing Medicine (Online or Offline)
  const handleDispenseMedicine = async (
    phcId: string,
    medicineId: string,
    quantity: number,
    patientId: string
  ) => {
    setPhcs((prevPhcs) =>
      prevPhcs.map((phc) => {
        if (phc.id !== phcId) return phc;

        const updatedInventory = phc.medicineInventory.map((med) => {
          if (med.id !== medicineId) return med;
          const newStock = Math.max(0, med.currentStock - quantity);
          const daysLeft = parseFloat((newStock / med.dailyBurnRate).toFixed(1));
          const newStatus =
            daysLeft < 2
              ? 'Critical Deficit'
              : daysLeft < 5
              ? 'Low Stock'
              : daysLeft > 25
              ? 'Surplus'
              : 'Adequate';

          return {
            ...med,
            currentStock: newStock,
            projectedDaysRemaining: daysLeft,
            status: newStatus as any,
          };
        });

        return {
          ...phc,
          medicineInventory: updatedInventory,
        };
      })
    );

    // If offline, record in cryptographic local queue
    if (!isOnline) {
      const phc = phcs.find((p) => p.id === phcId);
      if (phc) {
        await OfflineSyncService.recordTransaction(
          phcId,
          phc.name,
          'DISPENSE_MEDICINE',
          { phcId, medicineId, quantity, patientId, timestamp: new Date().toISOString() },
          `Dispensed ${quantity} units of medicine to ${patientId}`,
          'Medical Officer'
        );
        refreshOfflineQueue();
      }
    }
  };

  // Handle Bed Occupancy Updates
  const handleUpdateBeds = async (phcId: string, ward: keyof BedCapacity, delta: number) => {
    setPhcs((prevPhcs) =>
      prevPhcs.map((phc) => {
        if (phc.id !== phcId) return phc;
        const currentVal = phc.beds[ward];
        const updatedVal = Math.max(0, currentVal + delta);

        return {
          ...phc,
          beds: {
            ...phc.beds,
            [ward]: updatedVal,
          },
        };
      })
    );

    if (!isOnline) {
      const phc = phcs.find((p) => p.id === phcId);
      if (phc) {
        await OfflineSyncService.recordTransaction(
          phcId,
          phc.name,
          'ADMIT_PATIENT',
          { phcId, ward, delta, timestamp: new Date().toISOString() },
          `Updated ${ward} occupancy by ${delta > 0 ? `+${delta}` : delta}`,
          'Staff Nurse'
        );
        refreshOfflineQueue();
      }
    }
  };

  // Dispatch New Redistribution Transfer
  const handleDispatchTransfer = (newTransfer: RedistributionTransfer) => {
    setTransfers((prev) => [newTransfer, ...prev]);

    // Deduct stock from donor PHC
    setPhcs((prevPhcs) =>
      prevPhcs.map((phc) => {
        if (phc.id !== newTransfer.fromPhcId) return phc;
        return {
          ...phc,
          medicineInventory: phc.medicineInventory.map((med) => {
            if (med.medicineName.toLowerCase() === newTransfer.medicineName.toLowerCase()) {
              const newStock = Math.max(0, med.currentStock - newTransfer.quantityUnits);
              const daysLeft = parseFloat((newStock / med.dailyBurnRate).toFixed(1));
              return {
                ...med,
                currentStock: newStock,
                projectedDaysRemaining: daysLeft,
              };
            }
            return med;
          }),
        };
      })
    );
  };

  // Reconcile and Complete Transfer
  const handleReconcileTransfer = (transferId: string) => {
    const tr = transfers.find((t) => t.id === transferId);
    if (!tr) return;

    // Mark as reconciled
    setTransfers((prev) =>
      prev.map((t) => (t.id === transferId ? { ...t, status: 'Delivered & Reconciled' } : t))
    );

    // Increase stock at recipient PHC
    setPhcs((prevPhcs) =>
      prevPhcs.map((phc) => {
        if (phc.id !== tr.toPhcId) return phc;
        return {
          ...phc,
          medicineInventory: phc.medicineInventory.map((med) => {
            if (med.medicineName.toLowerCase() === tr.medicineName.toLowerCase()) {
              const newStock = med.currentStock + tr.quantityUnits;
              const daysLeft = parseFloat((newStock / med.dailyBurnRate).toFixed(1));
              const newStatus = daysLeft < 5 ? 'Low Stock' : 'Adequate';
              return {
                ...med,
                currentStock: newStock,
                projectedDaysRemaining: daysLeft,
                status: newStatus as any,
              };
            }
            return med;
          }),
        };
      })
    );

    // If an alert was open for this recipient & drug, mark acknowledged
    setAlerts((prevAlerts) =>
      prevAlerts.map((a) =>
        a.phcId === tr.toPhcId ? { ...a, acknowledged: true } : a
      )
    );
  };

  // Acknowledge Alert
  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
  };

  // Initiate Transfer from Alert directly
  const handleInitiateTransferFromAlert = (phcId: string, medicineName: string) => {
    setPrefillRecipientPhcId(phcId);
    setPrefillMedicineName(medicineName);
    setSelectedPhcId(phcId);
    setActiveTab('redistribution');
  };

  // Trigger Federated Training Round
  const handleTriggerTrainingRound = async () => {
    setIsTrainingRoundRunning(true);

    try {
      // Simulate gradient computation & secure aggregation steps
      await new Promise((r) => setTimeout(r, 1600));

      const nextRoundNum = federatedRound.roundNumber + 1;
      const nextAccuracy = parseFloat(Math.min(98.5, federatedRound.globalAccuracy + 0.6).toFixed(1));
      const nextLoss = parseFloat(Math.max(0.015, federatedRound.globalLoss - 0.005).toFixed(3));
      const nextEpsilon = parseFloat((federatedRound.privacyBudgetUsedEpsilon + 0.05).toFixed(2));

      const updatedClients = federatedRound.clientStates.map((cs) => ({
        ...cs,
        localLoss: parseFloat(Math.max(0.012, cs.localLoss - 0.004).toFixed(3)),
        status: 'Aggregated' as const,
      }));

      setFederatedRound({
        ...federatedRound,
        roundNumber: nextRoundNum,
        globalAccuracy: nextAccuracy,
        globalLoss: nextLoss,
        privacyBudgetUsedEpsilon: nextEpsilon,
        timestamp: 'Just now (Round complete)',
        clientStates: updatedClients,
        aiSynthesis: {
          summary: `Federated Round #${nextRoundNum} converged successfully. Global accuracy increased to ${nextAccuracy}% with DP epsilon bounded at ${nextEpsilon}.`,
          stateEpidemiologicalDrift: 'Cross-state gradient clustering indicates stabilizing demand variance across monsoon corridors.',
          privacyPreservationProof: `Differential Privacy guaranteed under (ε=${nextEpsilon}, δ=10^-5) bounds. No patient data centralized.`,
          modelGeneralizationGain: 'Cross-state out-of-distribution forecast error lowered by an additional 4.2%.',
          recommendedModelActions: [
            `Broadcast updated weights (v4.${nextRoundNum}) to all edge PHC instances`,
            'Maintain continuous telemetry verification on remote tribal sub-centres',
          ],
        },
      });

      // Update state nodes with new model version
      setStates((prev) =>
        prev.map((st) => ({
          ...st,
          federatedWeightVersion: `v4.${nextRoundNum}-${st.code}`,
          federatedLoss: parseFloat(Math.max(0.015, st.federatedLoss - 0.003).toFixed(3)),
        }))
      );
    } catch (e) {
      console.error('Federated training execution error:', e);
    } finally {
      setIsTrainingRoundRunning(false);
    }
  };

  // Emergency Outbreak Scenario Switcher
  const handleSelectScenario = (scenario: OutbreakScenario | null) => {
    setActiveScenario(scenario);

    if (scenario) {
      // Apply surge multiplier to affected PHCs and medicine burn rates
      setPhcs((prevPhcs) =>
        prevPhcs.map((phc) => {
          if (!scenario.affectedStates.includes(phc.stateCode)) return phc;

          const updatedInventory = phc.medicineInventory.map((med) => {
            if (scenario.affectedCategories.includes(med.category)) {
              const newBurnRate = parseFloat((med.dailyBurnRate * scenario.burnRateMultiplier).toFixed(1));
              const daysLeft = parseFloat((med.currentStock / newBurnRate).toFixed(1));
              const newStatus = daysLeft < 2 ? 'Critical Deficit' : daysLeft < 5 ? 'Low Stock' : med.status;
              return {
                ...med,
                dailyBurnRate: newBurnRate,
                projectedDaysRemaining: daysLeft,
                status: newStatus as any,
              };
            }
            return med;
          });

          return {
            ...phc,
            footfall: {
              ...phc.footfall,
              opdToday: Math.round(phc.footfall.opdToday * scenario.footfallMultiplier),
              feverOutbreakCases: Math.round(phc.footfall.feverOutbreakCases * scenario.footfallMultiplier),
            },
            medicineInventory: updatedInventory,
          };
        })
      );
    } else {
      // Reset back to initial baseline
      setPhcs(INITIAL_PHCS);
    }
  };

  // Navigation tab helper with state/phc preselection
  const handleNavigateTab = (tab: string, stateCode?: string, phcId?: string) => {
    if (stateCode) {
      const foundState = states.find((s) => s.code === stateCode);
      if (foundState) setSelectedState(foundState);
    }
    if (phcId) {
      setSelectedPhcId(phcId);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-white">
      {/* Header Bar following Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOnline={isOnline}
        toggleConnectivity={toggleConnectivity}
        offlineQueueCount={offlineQueueCount}
        activeScenario={activeScenario}
        onOpenScenarioModal={() => setIsOutbreakModalOpen(true)}
        onOpenCryptoInspector={() => setIsCryptoModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <NationalOverview
            states={states}
            selectedState={selectedState}
            onSelectState={setSelectedState}
            districts={districts}
            phcs={phcs}
            alerts={alerts}
            transfers={transfers}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {activeTab === 'inventory' && (
          <PHCInventoryView
            phcs={phcs}
            selectedPhcId={selectedPhcId}
            onSelectPhc={setSelectedPhcId}
            onDispenseMedicine={handleDispenseMedicine}
            onUpdateBeds={handleUpdateBeds}
            onRequestTransfer={(phcId, medicineName) => {
              setPrefillRecipientPhcId(phcId);
              setPrefillMedicineName(medicineName);
              setActiveTab('redistribution');
            }}
            isOnline={isOnline}
          />
        )}

        {activeTab === 'forecasting' && (
          <DemandForecastingView
            alerts={alerts}
            phcs={phcs}
            activeScenario={activeScenario}
            onSelectScenario={handleSelectScenario}
            availableScenarios={OUTBREAK_SCENARIOS}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onInitiateTransferFromAlert={handleInitiateTransferFromAlert}
          />
        )}

        {activeTab === 'redistribution' && (
          <RedistributionView
            transfers={transfers}
            phcs={phcs}
            onDispatchTransfer={handleDispatchTransfer}
            onReconcileTransfer={handleReconcileTransfer}
            prefillRecipientPhcId={prefillRecipientPhcId}
            prefillMedicineName={prefillMedicineName}
          />
        )}

        {activeTab === 'federated' && (
          <FederatedLearningView
            federatedRound={federatedRound}
            states={states}
            onTriggerTrainingRound={handleTriggerTrainingRound}
            isTrainingRoundRunning={isTrainingRoundRunning}
          />
        )}

        {activeTab === 'offline-edge' && (
          <OfflineEdgeConsole
            isOnline={isOnline}
            toggleConnectivity={toggleConnectivity}
            phcs={phcs}
            selectedPhcId={selectedPhcId}
            onSelectPhc={setSelectedPhcId}
            onRefreshOfflineQueue={refreshOfflineQueue}
          />
        )}
      </main>

      {/* Footer following Anti-Slop Discipline (No fake telemetry tickers or floating clutter) */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span>PranaGrid National Health Supply Chain</span>
            <span aria-hidden="true">·</span>
            <span>Ayushman Arogya Network</span>
          </div>
          <div className="flex items-center gap-3">
            <span>WebCrypto AES-256 GCM</span>
            <span aria-hidden="true">·</span>
            <span>DP-FedAvg (ε=1.2)</span>
            <span aria-hidden="true">·</span>
            <span>Offline-First Sync</span>
          </div>
        </div>
      </footer>

      {/* Outbreak Stress Drill Modal */}
      <OutbreakModal
        isOpen={isOutbreakModalOpen}
        onClose={() => setIsOutbreakModalOpen(false)}
        scenarios={OUTBREAK_SCENARIOS}
        activeScenario={activeScenario}
        onSelectScenario={handleSelectScenario}
      />

      {/* Cryptographic Inspector Modal */}
      <CryptoAuditModal
        isOpen={isCryptoModalOpen}
        onClose={() => setIsCryptoModalOpen(false)}
      />

      {/* Floating Vernacular Quick Switcher */}
      <FloatingLanguageSwitcher />
    </div>
  );
}
