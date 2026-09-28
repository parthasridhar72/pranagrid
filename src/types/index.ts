export type StateCode = 'MH' | 'UP' | 'TN' | 'KL' | 'RJ' | 'AS' | 'OD';

export interface StateNode {
  code: StateCode;
  name: string;
  capital: string;
  totalPhcs: number;
  monitoredCohortPhcs: number;
  populationServedMillions: number;
  essentialStockIndexPercent: number;
  averageBufferDays: number;
  coldChainCompliancePercent: number;
  activeDoctorAttendancePercent: number;
  activeCriticalAlerts: number;
  federatedWeightVersion: string;
  federatedLoss: number;
  privacyBudgetEpsilon: number;
  color: string;
}

export interface District {
  id: string;
  stateCode: StateCode;
  name: string;
  headquarters: string;
  population: string;
  phcsCount: number;
  status: 'Nominal' | 'Warning' | 'Critical';
  avgBufferDays: number;
  topShortageDrug?: string;
}

export type TerrainType = 'Plains' | 'Hilly / Ghats' | 'Remote Tribal' | 'Riverine Island' | 'Arid / Desert';
export type ConnectivityStatus = 'Online' | 'Intermittent 2G' | 'Offline';

export interface MedicineStock {
  id: string;
  medicineName: string;
  genericName: string;
  category: 'Antibiotic' | 'Antimalarial' | 'Vaccine' | 'Chronic / NCD' | 'Maternal Health' | 'Emergency / Antivenom' | 'IV Fluids';
  currentStock: number; // units
  unitType: 'Vials' | 'Tablets' | 'Ampoules' | 'Bottles';
  minimumSafetyBuffer: number; // units
  dailyBurnRate: number; // units per day
  projectedDaysRemaining: number;
  batchNumber: string;
  expiryDate: string;
  coldChainRequired: boolean;
  idealTempRange: string;
  currentStorageTemp: number; // in °C
  coldChainOk: boolean;
  status: 'Surplus' | 'Adequate' | 'Low Stock' | 'Critical Deficit';
}

export interface BedCapacity {
  generalTotal: number;
  generalOccupied: number;
  maternalTotal: number;
  maternalOccupied: number;
  oxygenTotal: number;
  oxygenOccupied: number;
  pediatricTotal: number;
  pediatricOccupied: number;
  emergencyTotal: number;
  emergencyOccupied: number;
}

export interface PersonnelAttendance {
  role: 'Medical Officer (MBBS)' | 'Staff Nurse' | 'Auxiliary Nurse Midwife (ANM)' | 'Pharmacist' | 'Lab Technician';
  sanctioned: number;
  present: number;
  onFieldOutreach: number;
  onLeave: number;
  biometricVerified: boolean;
  shiftLead: string;
}

export interface PatientFootfall {
  opdToday: number;
  emergencyAdmissions: number;
  feverOutbreakCases: number;
  highRiskAntenatal: number;
  historical7Days: number[];
}

export interface PHCCentre {
  id: string;
  code: string;
  name: string;
  districtId: string;
  districtName: string;
  stateCode: StateCode;
  stateName: string;
  tier: 'Primary Health Centre (PHC)' | 'Community Health Centre (CHC)' | 'Health & Wellness Sub-Centre';
  terrain: TerrainType;
  coordinates: { lat: number; lng: number };
  connectivity: ConnectivityStatus;
  lastSyncTime: string;
  powerSource: 'Dual Solar Grid + Battery' | 'State Grid with Diesel Generator' | 'Solar Micro-Array';
  medicineInventory: MedicineStock[];
  beds: BedCapacity;
  personnel: PersonnelAttendance[];
  footfall: PatientFootfall;
  activeAlertsCount: number;
}

export interface EarlyWarningAlert {
  id: string;
  phcId: string;
  phcName: string;
  district: string;
  stateCode: StateCode;
  severity: 'CRITICAL' | 'WARNING' | 'ADVISORY';
  title: string;
  medicineOrResource: string;
  currentBufferDays: number;
  projectedStockoutHours: number;
  surgeFactor: string;
  reason: string;
  recommendedAction: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface RedistributionTransfer {
  id: string;
  transferNumber: string;
  fromPhcId: string;
  fromPhcName: string;
  fromDistrict: string;
  toPhcId: string;
  toPhcName: string;
  toDistrict: string;
  medicineName: string;
  category: string;
  quantityUnits: number;
  transportMode: 'Refrigerated Cold Chain Van' | 'Medical Drone Dispatch' | 'District Health Express Truck';
  distanceKm: number;
  etaHours: number;
  status: 'Proposed' | 'Authorized' | 'In Transit' | 'Cold Chain Verified' | 'Delivered & Reconciled';
  currentTempReading: number; // °C
  authSignToken: string;
  tamperProofHash: string;
  createdAt: string;
  deliveredAt?: string;
}

export interface FederatedClientState {
  stateCode: StateCode;
  stateName: string;
  localSamples: number;
  localEpochs: number;
  localLoss: number;
  gradientNorm: number;
  privacyNoiseAdded: number; // in sigma
  weightDivergencePercent: number;
  status: 'Ready' | 'Computing Gradients' | 'DP Noise Applied' | 'Aggregated';
}

export interface FederatedTrainingRound {
  roundNumber: number;
  globalAccuracy: number;
  globalLoss: number;
  totalClientNodes: number;
  privacyBudgetUsedEpsilon: number; // e.g. 1.2
  deltaPrivacy: number; // e.g. 1e-5
  timestamp: string;
  status: 'Completed' | 'In Progress' | 'Converged';
  clientStates: FederatedClientState[];
  aiSynthesis?: {
    summary: string;
    stateEpidemiologicalDrift: string;
    privacyPreservationProof: string;
    modelGeneralizationGain: string;
    recommendedModelActions: string[];
  };
}

export interface OfflineQueueTransaction {
  id: string;
  phcId: string;
  phcName: string;
  actionType: 'DISPENSE_MEDICINE' | 'ADMIT_PATIENT' | 'RECORD_ATTENDANCE' | 'ACCEPT_DELIVERY';
  details: string;
  recordedOfflineAt: string;
  aesIvBase64: string;
  cipherTextBase64: string;
  sha256Hash: string;
  digitalSignature: string;
  status: 'QUEUED_LOCAL' | 'VERIFYING' | 'RECONCILED';
}

export interface OutbreakScenario {
  id: string;
  name: string;
  tagline: string;
  affectedStates: StateCode[];
  affectedCategories: ('Antibiotic' | 'Antimalarial' | 'Vaccine' | 'Chronic / NCD' | 'Maternal Health' | 'Emergency / Antivenom' | 'IV Fluids')[];
  footfallMultiplier: number;
  burnRateMultiplier: number;
  description: string;
}
