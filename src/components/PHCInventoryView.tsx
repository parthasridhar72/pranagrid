import React, { useState } from 'react';
import { 
  Building2, 
  Pill, 
  Bed, 
  UserCheck, 
  Thermometer, 
  Search, 
  Filter, 
  Plus, 
  Minus, 
  AlertTriangle, 
  MapPin, 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  SunMedium, 
  Truck, 
  Check, 
  X,
  Clock,
  Volume2,
  Languages
} from 'lucide-react';
import { PHCCentre, MedicineStock, BedCapacity, PersonnelAttendance } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { RegionalExplainerModal } from './RegionalExplainerModal';

interface PHCInventoryViewProps {
  phcs: PHCCentre[];
  selectedPhcId: string;
  onSelectPhc: (phcId: string) => void;
  onDispenseMedicine: (phcId: string, medicineId: string, quantity: number, patientId: string) => void;
  onUpdateBeds: (phcId: string, ward: keyof BedCapacity, delta: number) => void;
  onRequestTransfer: (phcId: string, medicineName: string) => void;
  isOnline: boolean;
}

export const PHCInventoryView: React.FC<PHCInventoryViewProps> = ({
  phcs,
  selectedPhcId,
  onSelectPhc,
  onDispenseMedicine,
  onUpdateBeds,
  onRequestTransfer,
  isOnline,
}) => {
  const { t, currentLanguageInfo, speak } = useLanguage();
  const currentPhc = phcs.find((p) => p.id === selectedPhcId) || phcs[0];

  const [activeSection, setActiveSection] = useState<'inventory' | 'beds' | 'personnel' | 'footfall'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Dispense modal state
  const [dispenseModalDrug, setDispenseModalDrug] = useState<MedicineStock | null>(null);
  const [dispenseQty, setDispenseQty] = useState(1);
  const [patientIdInput, setPatientIdInput] = useState('');
  const [dispenseSuccessMsg, setDispenseSuccessMsg] = useState('');

  // Regional explainer modal state
  const [explainerTarget, setExplainerTarget] = useState<{
    title: string;
    details: string;
    phcName?: string;
    district?: string;
  } | null>(null);

  // Categories list
  const categories = ['All', 'Antibiotic', 'Antimalarial', 'Vaccine', 'Chronic / NCD', 'Maternal Health', 'Emergency / Antivenom', 'IV Fluids'];

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'Antibiotic': return t('cat.antibiotic', 'Antibiotic');
      case 'Antimalarial': return t('cat.antimalarial', 'Antimalarial');
      case 'Vaccine': return t('cat.vaccine', 'Vaccine');
      case 'Chronic / NCD': return t('cat.chronic', 'Chronic / NCD');
      case 'Maternal Health': return t('cat.maternal', 'Maternal Health');
      case 'Emergency / Antivenom': return t('cat.antivenom', 'Emergency / Antivenom');
      case 'IV Fluids': return t('cat.iv_fluids', 'IV Fluids');
      default: return cat;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Critical Deficit': return t('status.critical_deficit', 'Critical Deficit');
      case 'Low Stock': return t('status.low_stock', 'Low Stock');
      case 'Adequate': return t('status.adequate', 'Adequate');
      case 'Surplus': return t('status.surplus', 'Surplus');
      default: return status;
    }
  };

  const handleFacilityAudio = () => {
    const totalBedsOcc = currentPhc.beds.generalOccupied + currentPhc.beds.maternalOccupied + currentPhc.beds.oxygenOccupied;
    const text = `${currentPhc.name}, ${currentPhc.districtName}. ${t('inv.current_stock')}: ${currentPhc.medicineInventory.length}. ${t('inv.bed_title')}: ${totalBedsOcc}. ${t('status.online')}.`;
    speak(text);
  };

  // Filtered medicines
  const filteredMedicines = currentPhc.medicineInventory.filter((med) => {
    const matchesCategory = selectedCategory === 'All' || med.category === selectedCategory;
    const matchesSearch = med.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          med.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          med.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDispenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispenseModalDrug || dispenseQty <= 0) return;
    
    const patientCode = patientIdInput.trim() || `OPD-${Math.floor(1000 + Math.random() * 9000)}`;
    onDispenseMedicine(currentPhc.id, dispenseModalDrug.id, dispenseQty, patientCode);
    
    setDispenseSuccessMsg(`Dispensed ${dispenseQty} ${dispenseModalDrug.unitType} of ${dispenseModalDrug.medicineName} to patient ${patientCode}.`);
    setTimeout(() => {
      setDispenseModalDrug(null);
      setDispenseQty(1);
      setPatientIdInput('');
      setDispenseSuccessMsg('');
    }, 1400);
  };

  return (
    <div className="space-y-6">
      {/* Top Header: PHC Selector & Facility Details */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Facility Selector Dropdown & Identification */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="text-slate-300 font-bold">{currentPhc.code}</span>
              <span aria-hidden="true">·</span>
              <span>{currentPhc.tier}</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400">{currentPhc.terrain}</span>
              <span aria-hidden="true">·</span>
              <span>{currentPhc.stateName}</span>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={currentPhc.id}
                onChange={(e) => onSelectPhc(e.target.value)}
                aria-label="Select Primary Healthcare Centre"
                className="bg-slate-950 border border-slate-700 text-white font-bold text-lg rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {phcs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.districtName}, {p.stateCode}) — {p.terrain}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleFacilityAudio}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
                title="மையத்தின் நிலவரத்தை குரல் வடிவில் கேட்க / Listen to Facility Telemetry"
              >
                <Volume2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const criticalMeds = currentPhc.medicineInventory.filter(m => m.status === 'Critical Deficit' || m.status === 'Low Stock');
                  const criticalMedsList = criticalMeds.map(m => `${m.medicineName}: ${m.currentStock} units (${m.projectedDaysRemaining} days buffer)`).join(', ');
                  const staffPresent = currentPhc.personnel.reduce((acc, p) => acc + p.present, 0);
                  const staffSanctioned = currentPhc.personnel.reduce((acc, p) => acc + p.sanctioned, 0);
                  setExplainerTarget({
                    title: `${currentPhc.name} — ${t('modal.explainer_title', 'Facility Briefing')}`,
                    details: `${currentPhc.name} (${currentPhc.districtName}, ${currentPhc.stateName}). Terrain: ${currentPhc.terrain}. Power: ${currentPhc.powerSource}. Connectivity: ${currentPhc.connectivity}. Essential drug lines: ${currentPhc.medicineInventory.length}. Urgent shortages: ${criticalMedsList || 'All stocks adequate'}. Total Bed Occupancy: ${currentPhc.beds.generalOccupied + currentPhc.beds.maternalOccupied + currentPhc.beds.oxygenOccupied}/${currentPhc.beds.generalTotal + currentPhc.beds.maternalTotal + currentPhc.beds.oxygenTotal}. Staff on duty: ${staffPresent}/${staffSanctioned}.`,
                    phcName: currentPhc.name,
                    district: currentPhc.districtName,
                  });
                }}
                className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-emerald-950/40 border border-emerald-600/50 text-emerald-300 hover:bg-emerald-900/40 transition-colors flex items-center gap-1.5"
                title={t('btn.regional_explain', 'Explain in selected language')}
              >
                <Languages className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">{t('btn.regional_explain', 'Regional Explainer')}</span>
              </button>

              {currentPhc.activeAlertsCount > 0 && (
                <span className="text-xs font-mono font-medium text-rose-300 bg-rose-950/80 border border-rose-800 px-2.5 py-1 rounded-md flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>{currentPhc.activeAlertsCount} {t('metric.critical_alerts', 'Active Warnings')}</span>
                </span>
              )}
            </div>
          </div>

          {/* Facility Infrastructure Badges */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="bg-slate-950/60 border border-slate-800 rounded px-2.5 py-1.5 flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentPhc.coordinates.lat.toFixed(3)}°N, {currentPhc.coordinates.lng.toFixed(3)}°E</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded px-2.5 py-1.5 flex items-center gap-1.5 text-slate-300">
              <SunMedium className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentPhc.powerSource}</span>
            </div>

            <div className={`border rounded px-2.5 py-1.5 flex items-center gap-1.5 ${
              currentPhc.connectivity === 'Online'
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : currentPhc.connectivity === 'Intermittent 2G'
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
            }`}>
              {currentPhc.connectivity === 'Offline' ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span>{currentPhc.connectivity}</span>
            </div>
          </div>
        </div>

        {/* Section Sub-Navigation Tabs */}
        <div className="flex items-center gap-1.5 mt-5 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setActiveSection('inventory')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeSection === 'inventory'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Pill className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('nav.inventory', 'Essential Medicines & Cold Chain')} ({currentPhc.medicineInventory.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('beds')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeSection === 'beds'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Bed className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t('inv.bed_title', 'Bed Capacity')} ({currentPhc.beds.generalOccupied + currentPhc.beds.maternalOccupied + currentPhc.beds.oxygenOccupied + currentPhc.beds.pediatricOccupied + currentPhc.beds.emergencyOccupied})</span>
          </button>

          <button
            onClick={() => setActiveSection('personnel')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeSection === 'personnel'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('staff.title', 'Medical Personnel & Attendance')}</span>
          </button>

          <button
            onClick={() => setActiveSection('footfall')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeSection === 'footfall'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Patient Footfall & Triage</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: MEDICINE INVENTORY & COLD CHAIN */}
      {activeSection === 'inventory' && (
        <div className="space-y-4">
          {/* Search and Category Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search drug, generic, batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Medicine Inventory High-Density Grid */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Medicine & Category</th>
                    <th className="py-2.5 px-3">Batch & Expiry</th>
                    <th className="py-2.5 px-3 text-right">{t('inv.current_stock', 'Available Stock')}</th>
                    <th className="py-2.5 px-3 text-right">{t('inv.burn_rate', 'Burn Rate')}</th>
                    <th className="py-2.5 px-3 text-right">{t('inv.days_left', 'Buffer Remaining')}</th>
                    <th className="py-2.5 px-3">{t('inv.cold_chain_status', 'Cold Chain Telemetry')}</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredMedicines.map((med) => {
                    const isDeficit = med.status === 'Critical Deficit';
                    const isLow = med.status === 'Low Stock';
                    return (
                      <tr
                        key={med.id}
                        className={`hover:bg-slate-850/40 transition-colors ${
                          isDeficit ? 'bg-rose-950/10' : ''
                        }`}
                      >
                        {/* Medicine info */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-200">{med.medicineName}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const audioMsg = `${med.medicineName}. ${t('inv.current_stock')}: ${med.currentStock} ${med.unitType}. ${med.projectedDaysRemaining} ${t('metric.days')}. ${getStatusLabel(med.status)}.`;
                                speak(audioMsg);
                              }}
                              className="p-0.5 rounded text-slate-500 hover:text-emerald-400 transition-colors"
                              title="ஒலி வடிவில் கேட்க / Listen"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 flex-wrap">
                            <span>{med.genericName}</span>
                            <span>·</span>
                            <span className="text-emerald-400/90 font-sans">{getCategoryLabel(med.category)}</span>
                          </div>
                        </td>

                        {/* Batch & Expiry */}
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                          <div>Batch: {med.batchNumber}</div>
                          <div className="text-slate-500">Exp: {med.expiryDate}</div>
                        </td>

                        {/* Current Stock */}
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          <span className="font-bold text-slate-200 text-sm">
                            {med.currentStock.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-slate-500 ml-1">{med.unitType}</span>
                          <div className="text-[10px] text-slate-500">Buffer: {med.minimumSafetyBuffer}</div>
                        </td>

                        {/* Burn Rate */}
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">
                          <span>{med.dailyBurnRate}</span>
                          <span className="text-[10px] text-slate-500 block">units/day</span>
                        </td>

                        {/* Buffer Days Remaining */}
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          <span
                            className={`font-bold text-sm ${
                              med.projectedDaysRemaining < 2
                                ? 'text-rose-400'
                                : med.projectedDaysRemaining < 5
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {med.projectedDaysRemaining} {t('metric.days', 'days')}
                          </span>
                          <span
                            className={`text-[10px] block font-sans font-medium ${
                              isDeficit
                                ? 'text-rose-400'
                                : isLow
                                ? 'text-amber-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {getStatusLabel(med.status)}
                          </span>
                        </td>

                        {/* Cold Chain Status */}
                        <td className="py-3 px-3">
                          {med.coldChainRequired ? (
                            <div className="flex items-center gap-1.5 font-mono text-[11px]">
                              <Thermometer className={`w-3.5 h-3.5 ${med.coldChainOk ? 'text-cyan-400' : 'text-rose-400'}`} />
                              <span className={med.coldChainOk ? 'text-cyan-300' : 'text-rose-300 font-bold'}>
                                {med.currentStorageTemp}°C
                              </span>
                              <span className="text-slate-500 text-[10px]">({med.idealTempRange})</span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 font-mono">
                              Ambient ({med.currentStorageTemp}°C)
                            </div>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setDispenseModalDrug(med)}
                              className="px-2.5 py-1 text-xs font-medium rounded bg-emerald-700/60 hover:bg-emerald-600 text-white transition-colors"
                              title="Dispense to Patient"
                            >
                              {t('inv.dispense_action', 'Dispense')}
                            </button>
                            {isDeficit && (
                              <button
                                onClick={() => onRequestTransfer(currentPhc.id, med.medicineName)}
                                className="px-2 py-1 text-xs font-medium rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/60 transition-colors flex items-center gap-1"
                                title="Request Inter-District Transfer"
                              >
                                <Truck className="w-3 h-3" />
                                <span>Restock</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: BED CAPACITY & OCCUPANCY */}
      {activeSection === 'beds' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">
                Inpatient & Critical Bed Occupancy Roster
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time bed availability across clinical wards with triage overflow tracking
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* General Ward */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">General Ward</span>
                <span className="text-xs font-mono text-slate-400">
                  {currentPhc.beds.generalOccupied} / {currentPhc.beds.generalTotal}
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${(currentPhc.beds.generalOccupied / currentPhc.beds.generalTotal) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 font-mono">
                  {currentPhc.beds.generalTotal - currentPhc.beds.generalOccupied} free
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateBeds(currentPhc.id, 'generalOccupied', -1)}
                    disabled={currentPhc.beds.generalOccupied <= 0}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                    title="Discharge patient"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onUpdateBeds(currentPhc.id, 'generalOccupied', 1)}
                    disabled={currentPhc.beds.generalOccupied >= currentPhc.beds.generalTotal}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                    title="Admit patient"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Maternal / Delivery Ward */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Maternal & Labor</span>
                <span className="text-xs font-mono text-slate-400">
                  {currentPhc.beds.maternalOccupied} / {currentPhc.beds.maternalTotal}
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all"
                  style={{ width: `${(currentPhc.beds.maternalOccupied / currentPhc.beds.maternalTotal) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 font-mono">
                  {currentPhc.beds.maternalTotal - currentPhc.beds.maternalOccupied} free
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateBeds(currentPhc.id, 'maternalOccupied', -1)}
                    disabled={currentPhc.beds.maternalOccupied <= 0}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onUpdateBeds(currentPhc.id, 'maternalOccupied', 1)}
                    disabled={currentPhc.beds.maternalOccupied >= currentPhc.beds.maternalTotal}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Oxygen Supported Beds */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Oxygen Supported</span>
                <span className="text-xs font-mono text-cyan-400">
                  {currentPhc.beds.oxygenOccupied} / {currentPhc.beds.oxygenTotal}
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all"
                  style={{ width: `${(currentPhc.beds.oxygenOccupied / currentPhc.beds.oxygenTotal) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 font-mono">
                  {currentPhc.beds.oxygenTotal - currentPhc.beds.oxygenOccupied} free
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateBeds(currentPhc.id, 'oxygenOccupied', -1)}
                    disabled={currentPhc.beds.oxygenOccupied <= 0}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onUpdateBeds(currentPhc.id, 'oxygenOccupied', 1)}
                    disabled={currentPhc.beds.oxygenOccupied >= currentPhc.beds.oxygenTotal}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Pediatric Ward */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Pediatric Care</span>
                <span className="text-xs font-mono text-slate-400">
                  {currentPhc.beds.pediatricOccupied} / {currentPhc.beds.pediatricTotal}
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${(currentPhc.beds.pediatricOccupied / currentPhc.beds.pediatricTotal) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 font-mono">
                  {currentPhc.beds.pediatricTotal - currentPhc.beds.pediatricOccupied} free
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateBeds(currentPhc.id, 'pediatricOccupied', -1)}
                    disabled={currentPhc.beds.pediatricOccupied <= 0}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onUpdateBeds(currentPhc.id, 'pediatricOccupied', 1)}
                    disabled={currentPhc.beds.pediatricOccupied >= currentPhc.beds.pediatricTotal}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Emergency Stabilization */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Emergency Trauma</span>
                <span className="text-xs font-mono text-rose-400">
                  {currentPhc.beds.emergencyOccupied} / {currentPhc.beds.emergencyTotal}
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all"
                  style={{ width: `${(currentPhc.beds.emergencyOccupied / currentPhc.beds.emergencyTotal) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 font-mono">
                  {currentPhc.beds.emergencyTotal - currentPhc.beds.emergencyOccupied} free
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateBeds(currentPhc.id, 'emergencyOccupied', -1)}
                    disabled={currentPhc.beds.emergencyOccupied <= 0}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onUpdateBeds(currentPhc.id, 'emergencyOccupied', 1)}
                    disabled={currentPhc.beds.emergencyOccupied >= currentPhc.beds.emergencyTotal}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: MEDICAL PERSONNEL & ATTENDANCE */}
      {activeSection === 'personnel' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">
                Clinical Personnel & Field Outreach Attendance Roster
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Biometric & RFID geo-verified check-in logs under National Health Mission guidelines
              </p>
            </div>
            <div className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Biometric Sync Nominal</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Role Cadre</th>
                  <th className="py-2.5 px-3">Shift Lead</th>
                  <th className="py-2.5 px-3 text-right">Sanctioned</th>
                  <th className="py-2.5 px-3 text-right">On Duty (Facility)</th>
                  <th className="py-2.5 px-3 text-right">Outreach / Sub-centre</th>
                  <th className="py-2.5 px-3 text-right">On Leave</th>
                  <th className="py-2.5 px-3 text-center">Biometric Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {currentPhc.personnel.map((staff, idx) => (
                  <tr key={idx} className="hover:bg-slate-850/40">
                    <td className="py-3 px-3 font-semibold text-slate-200">{staff.role}</td>
                    <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">{staff.shiftLead}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-400">{staff.sanctioned}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-400 font-bold">{staff.present}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-indigo-400">{staff.onFieldOutreach}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-500">{staff.onLeave}</td>
                    <td className="py-3 px-3 text-center font-mono">
                      {staff.biometricVerified ? (
                        <span className="text-emerald-400 text-xs font-mono">Verified</span>
                      ) : (
                        <span className="text-amber-400 text-xs font-mono">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: PATIENT FOOTFALL & TRIAGE */}
      {activeSection === 'footfall' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5">
              <div className="text-xs text-slate-400 mb-1">Today's OPD Patients</div>
              <div className="text-xl font-bold text-white font-mono tabular-nums">
                {currentPhc.footfall.opdToday}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Historical avg: ~120/day
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5">
              <div className="text-xs text-slate-400 mb-1">Emergency Triage</div>
              <div className="text-xl font-bold text-rose-400 font-mono tabular-nums">
                {currentPhc.footfall.emergencyAdmissions}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Trauma, envenomation, dehydration
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5">
              <div className="text-xs text-slate-400 mb-1">Fever & Syndromic Surveillance</div>
              <div className="text-xl font-bold text-amber-400 font-mono tabular-nums">
                {currentPhc.footfall.feverOutbreakCases}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                IDSP portal synced
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5">
              <div className="text-xs text-slate-400 mb-1">High-Risk Antenatal</div>
              <div className="text-xl font-bold text-indigo-400 font-mono tabular-nums">
                {currentPhc.footfall.highRiskAntenatal}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                RCH registry tracked
              </div>
            </div>
          </div>

          {/* 7-Day Trend Visualizer */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-slate-200 mb-2">
              7-Day OPD Footfall Velocity
            </h3>
            <div className="flex items-end gap-3 h-32 pt-4 px-2">
              {currentPhc.footfall.historical7Days.map((val, idx) => {
                const maxVal = Math.max(...currentPhc.footfall.historical7Days, 150);
                const heightPercent = (val / maxVal) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-mono text-slate-400 tabular-nums">{val}</span>
                    <div
                      className="w-full bg-emerald-500/80 hover:bg-emerald-400 rounded-t transition-all"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[10px] font-mono text-slate-500">D-{7 - idx}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DISPENSE MEDICINE MODAL */}
      {dispenseModalDrug && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Dispense Prescription</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{currentPhc.name}</p>
              </div>
              <button
                onClick={() => setDispenseModalDrug(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {dispenseSuccessMsg ? (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded text-emerald-300 text-xs font-mono flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{dispenseSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleDispenseSubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Medication</label>
                  <div className="text-sm font-semibold text-slate-200">
                    {dispenseModalDrug.medicineName}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Batch: {dispenseModalDrug.batchNumber} · Current Stock: {dispenseModalDrug.currentStock} {dispenseModalDrug.unitType}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Patient ID / OPD Slip No.</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OPD-2026-8912"
                    value={patientIdInput}
                    onChange={(e) => setPatientIdInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Quantity ({dispenseModalDrug.unitType})</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={dispenseModalDrug.currentStock}
                      value={dispenseQty}
                      onChange={(e) => setDispenseQty(parseInt(e.target.value) || 1)}
                      className="w-24 bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-slate-400">{dispenseModalDrug.unitType}</span>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-400 font-mono">
                  {isOnline ? (
                    <span className="text-emerald-400">✓ Grid Online: Transaction will sync immediately</span>
                  ) : (
                    <span className="text-amber-400">⚠ Offline Mode: Transaction will be cryptographically signed and queued locally</span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDispenseModalDrug(null)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
                  >
                    Confirm Dispensation
                  </button>
                </div>
              </form>
            )}
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
          contextDomain="clinical_forecasting"
        />
      )}
    </div>
  );
};
