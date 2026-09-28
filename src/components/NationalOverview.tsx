import React, { useState } from 'react';
import { 
  Building2, 
  Pill, 
  Bed, 
  UserCheck, 
  AlertTriangle, 
  ArrowUpRight, 
  Truck, 
  ShieldCheck, 
  Zap, 
  MapPin, 
  Thermometer, 
  ChevronRight,
  Volume2,
  Languages
} from 'lucide-react';
import { StateNode, District, PHCCentre, EarlyWarningAlert, RedistributionTransfer } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { RegionalExplainerModal } from './RegionalExplainerModal';

interface NationalOverviewProps {
  states: StateNode[];
  selectedState: StateNode;
  onSelectState: (state: StateNode) => void;
  districts: District[];
  phcs: PHCCentre[];
  alerts: EarlyWarningAlert[];
  transfers: RedistributionTransfer[];
  onNavigateTab: (tab: string, stateCode?: string, phcId?: string) => void;
}

export const NationalOverview: React.FC<NationalOverviewProps> = ({
  states,
  selectedState,
  onSelectState,
  districts,
  phcs,
  alerts,
  transfers,
  onNavigateTab,
}) => {
  const { t, currentLanguageInfo, speak } = useLanguage();
  const [explainerAlert, setExplainerAlert] = useState<EarlyWarningAlert | null>(null);

  // Aggregate KPI stats
  const totalMonitoredPhcs = states.reduce((acc, s) => acc + s.monitoredCohortPhcs, 0);
  const totalNationalPhcs = states.reduce((acc, s) => acc + s.totalPhcs, 0);
  const avgStockIndex = (states.reduce((acc, s) => acc + s.essentialStockIndexPercent, 0) / states.length).toFixed(1);
  const avgColdChain = (states.reduce((acc, s) => acc + s.coldChainCompliancePercent, 0) / states.length).toFixed(1);
  const avgAttendance = (states.reduce((acc, s) => acc + s.activeDoctorAttendancePercent, 0) / states.length).toFixed(1);
  const totalCriticalAlerts = alerts.filter(a => a.severity === 'CRITICAL').length;
  const inTransitTransfers = transfers.filter(t => t.status === 'In Transit' || t.status === 'Cold Chain Verified').length;

  // Filter districts for currently selected state
  const stateDistricts = districts.filter(d => d.stateCode === selectedState.code);
  const statePhcs = phcs.filter(p => p.stateCode === selectedState.code);

  const handleAudioOverview = () => {
    const text = `${t('app.title')}. ${selectedState.name} ${t('metric.stock_index')}: ${selectedState.essentialStockIndexPercent}%. ${t('metric.doctor_attendance')}: ${selectedState.activeDoctorAttendancePercent}%. ${selectedState.activeCriticalAlerts} ${t('metric.critical_alerts')}.`;
    speak(text);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Contextual Intro with Zero-Pill typography */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-1">
            <span>Republic of India</span>
            <span aria-hidden="true">·</span>
            <span>{t('app.network', 'Ministry of Health & Family Welfare')}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400">Ayushman Arogya Network</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {t('nav.overview', 'National Primary Healthcare Logistics & Resource Grid')}
            </h1>
            <button
              onClick={handleAudioOverview}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
              title="குரல் வடிவில் கேட்க / Listen to State Briefing"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            {t('app.tagline', 'Real-time decentralized telemetry for medicine inventory, cold chain compliance, bed capacity, and doctor attendance across India\'s PHC network.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('redistribution')}
            className="px-3.5 py-2 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <Truck className="w-4 h-4" />
            <span>{t('nav.redistribution', 'Cross-District Redistribution')}</span>
          </button>
          <button
            onClick={() => onNavigateTab('forecasting')}
            className="px-3.5 py-2 text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>{t('metric.critical_alerts', 'Early Warnings')} ({alerts.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Ribbons: High scannability, strict tabular numbers */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="text-xs text-slate-400 flex items-start justify-between gap-1.5 mb-1.5 min-h-[2.2rem]">
            <span className="line-clamp-2 leading-tight font-medium">{t('metric.total_phcs', 'Active PHCs')}</span>
            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono tabular-nums">
              {totalNationalPhcs.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              <span className="text-emerald-400 font-mono">{totalMonitoredPhcs}</span> pilot cohort live
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="text-xs text-slate-400 flex items-start justify-between gap-1.5 mb-1.5 min-h-[2.2rem]">
            <span className="line-clamp-2 leading-tight font-medium">{t('metric.stock_index', 'Essential Drug Index')}</span>
            <Pill className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
              {avgStockIndex}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              National EDL threshold: 85%
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="text-xs text-slate-400 flex items-start justify-between gap-1.5 mb-1.5 min-h-[2.2rem]">
            <span className="line-clamp-2 leading-tight font-medium">{t('metric.cold_chain', 'Cold-Chain Integrity')}</span>
            <Thermometer className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          </div>
          <div>
            <div className="text-xl font-bold text-cyan-400 font-mono tabular-nums">
              {avgColdChain}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              2°C - 8°C solar ILR verified
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="text-xs text-slate-400 flex items-start justify-between gap-1.5 mb-1.5 min-h-[2.2rem]">
            <span className="line-clamp-2 leading-tight font-medium">{t('metric.doctor_attendance', 'Doctor Attendance')}</span>
            <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
          </div>
          <div>
            <div className="text-xl font-bold text-indigo-400 font-mono tabular-nums">
              {avgAttendance}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Biometric & RFID geo-fenced
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="text-xs text-slate-400 flex items-start justify-between gap-1.5 mb-1.5 min-h-[2.2rem]">
            <span className="line-clamp-2 leading-tight font-medium">{t('metric.critical_alerts', 'Critical Deficits')}</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
          </div>
          <div>
            <div className="text-xl font-bold text-rose-400 font-mono tabular-nums">
              {totalCriticalAlerts}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Stockout projected &lt; 48 hrs
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="text-xs text-slate-400 flex items-start justify-between gap-1.5 mb-1.5 min-h-[2.2rem]">
            <span className="line-clamp-2 leading-tight font-medium">{t('redis.in_transit', 'Active Dispatches')}</span>
            <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          </div>
          <div>
            <div className="text-xl font-bold text-amber-400 font-mono tabular-nums">
              {inTransitTransfers}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Cross-district reefer routes
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: State Selector Bar & Topological Map & Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: State Selection & High-Density State Performance Matrix */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">
              State Edge Clusters & Telemetry Health
            </h2>
            <div className="text-xs text-slate-500 font-mono">
              7 Federated State Nodes Active
            </div>
          </div>

          {/* Interactive State Segmented Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {states.map((st) => {
              const isSelected = selectedState.code === st.code;
              return (
                <button
                  key={st.code}
                  onClick={() => onSelectState(st)}
                  className={`p-3 rounded-lg border text-left transition-all relative ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500/70 shadow-sm ring-1 ring-emerald-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-slate-200">{st.code}</span>
                    {st.activeCriticalAlerts > 0 && (
                      <span className="w-2 h-2 rounded-full bg-rose-500" title={`${st.activeCriticalAlerts} Critical Alerts`} />
                    )}
                  </div>
                  <div className="text-xs font-medium text-slate-300 truncate">{st.name}</div>
                  <div className="text-[11px] font-mono tabular-nums text-slate-400 mt-1">
                    {st.essentialStockIndexPercent}% EDL
                  </div>
                </button>
              );
            })}
          </div>

          {/* High-Density State Comparison Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-200">
                  Federated State Network Ledger
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Decentralized edge nodes transmitting encrypted demand gradients without centralizing patient records
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('federated')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 font-mono"
              >
                <span>Federated Round #18</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">State Node</th>
                    <th className="py-2.5 px-3">Monitored PHCs</th>
                    <th className="py-2.5 px-3 text-right">Avg Buffer (Days)</th>
                    <th className="py-2.5 px-3 text-right">Cold Chain</th>
                    <th className="py-2.5 px-3 text-right">Doctor Attendance</th>
                    <th className="py-2.5 px-3 text-center">Alerts</th>
                    <th className="py-2.5 px-3 text-right">Privacy Budget (ε)</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {states.map((st) => {
                    const isSelected = selectedState.code === st.code;
                    return (
                      <tr
                        key={st.code}
                        onClick={() => onSelectState(st)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-slate-800/40' : 'hover:bg-slate-800/20'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-medium text-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }} />
                            <span>{st.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-slate-400">
                          {st.monitoredCohortPhcs} / {st.totalPhcs}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right">
                          <span
                            className={
                              st.averageBufferDays < 15
                                ? 'text-rose-400 font-semibold'
                                : st.averageBufferDays < 20
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }
                          >
                            {st.averageBufferDays}d
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-300">
                          {st.coldChainCompliancePercent}%
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-300">
                          {st.activeDoctorAttendancePercent}%
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {st.activeCriticalAlerts > 0 ? (
                            <span className="text-rose-400 font-semibold font-mono">
                              {st.activeCriticalAlerts} critical
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-400">
                          {st.privacyBudgetEpsilon}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectState(st);
                              onNavigateTab('inventory', st.code);
                            }}
                            className="text-xs text-slate-300 hover:text-white underline decoration-slate-600 hover:decoration-slate-400 transition-colors"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* District Breakdown for Selected State */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-semibold text-slate-200">
                  {selectedState.name} District Buffer Status & Shortage Watchlist
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Monitored district healthcare clusters and emergency stock levels
                </p>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {stateDistricts.length} Districts Configured
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stateDistricts.map((d) => (
                <div
                  key={d.id}
                  className="bg-slate-950/50 border border-slate-800/80 rounded-md p-3 flex items-start justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200">{d.name} District</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          d.status === 'Critical'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : d.status === 'Warning'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1">
                      HQ: {d.headquarters} · Pop: {d.population} · {d.phcsCount} PHCs
                    </div>
                    {d.topShortageDrug && (
                      <div className="text-[11px] text-rose-400 mt-1 font-mono">
                        Shortage: {d.topShortageDrug}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Buffer</div>
                    <div
                      className={`text-sm font-bold font-mono tabular-nums ${
                        d.avgBufferDays < 10
                          ? 'text-rose-400'
                          : d.avgBufferDays < 20
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {d.avgBufferDays}d
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: India Topological Health Grid & High Priority Alerts */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Priority Alerts Box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-semibold text-slate-200">
                  Critical Stock-Out Watchlist
                </h3>
              </div>
              <span className="text-[11px] font-mono text-rose-400">
                {alerts.filter(a => a.severity === 'CRITICAL').length} High Urgency
              </span>
            </div>

            <div className="space-y-2.5">
              {alerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="bg-slate-950/70 border border-rose-900/40 rounded-md p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-rose-300">
                      {alert.phcName}
                    </span>
                    <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/50">
                      {alert.currentBufferDays}d buffer ({alert.projectedStockoutHours}h left)
                    </span>
                  </div>
                  <div className="text-xs text-slate-200 font-medium">
                    {alert.medicineOrResource}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {alert.reason}
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <button
                      onClick={() => setExplainerAlert(alert)}
                      className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
                      title={t('btn.regional_explain', 'Regional Translation & Audio')}
                    >
                      <Languages className="w-3 h-3" />
                      <span>{t('btn.regional_explain', 'Regional Explainer')}</span>
                    </button>
                    <button
                      onClick={() => onNavigateTab('redistribution')}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5"
                    >
                      <span>{t('nav.redistribution', 'Redistribute')}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigateTab('forecasting')}
              className="w-full mt-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded border border-slate-700 transition-colors text-center"
            >
              View All Early Warnings & Forecasts
            </button>
          </div>

          {/* India Regional Supply Corridors Topology */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-slate-200">
                  National Supply Corridors
                </h3>
              </div>
              <span className="text-[11px] font-mono text-cyan-400">
                Live Rebalancing
              </span>
            </div>

            {/* Interactive SVG Network Map */}
            <div className="relative h-64 bg-slate-950/80 rounded-md border border-slate-800 flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full p-4" viewBox="0 0 320 280">
                {/* Background Grid Lines */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(51, 65, 85, 0.2)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Simulated Logistical Inter-District Routes */}
                {/* UP to Gorakhpur */}
                <line x1="160" y1="110" x2="200" y2="90" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,3" opacity="0.7" />
                {/* MH to Pune/Bhor */}
                <line x1="100" y1="165" x2="115" y2="185" stroke="#0284c7" strokeWidth="2" strokeDasharray="3,3" opacity="0.7" />
                {/* Madurai to Nilgiris TN */}
                <line x1="140" y1="240" x2="110" y2="225" stroke="#10b981" strokeWidth="2" strokeDasharray="3,3" opacity="0.7" />
                {/* Rajasthan Barmer corridor */}
                <line x1="75" y1="120" x2="60" y2="135" stroke="#f97316" strokeWidth="2" strokeDasharray="3,3" opacity="0.7" />
                {/* Assam Majuli river corridor */}
                <line x1="260" y1="85" x2="280" y2="95" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="3,3" opacity="0.7" />

                {/* State Nodes */}
                {/* RJ Node */}
                <g transform="translate(60, 130)" className="cursor-pointer" onClick={() => onSelectState(states.find(s => s.code === 'RJ')!)}>
                  <circle r="9" fill="#f97316" fillOpacity="0.2" stroke="#f97316" strokeWidth="1.5" />
                  <circle r="4" fill="#f97316" />
                  <text y="-12" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="monospace">RJ</text>
                </g>

                {/* UP Node */}
                <g transform="translate(160, 105)" className="cursor-pointer" onClick={() => onSelectState(states.find(s => s.code === 'UP')!)}>
                  <circle r="9" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="1.5" />
                  <circle r="4" fill="#f59e0b" />
                  <text y="-12" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="monospace">UP</text>
                </g>

                {/* AS Node */}
                <g transform="translate(265, 88)" className="cursor-pointer" onClick={() => onSelectState(states.find(s => s.code === 'AS')!)}>
                  <circle r="9" fill="#8b5cf6" fillOpacity="0.2" stroke="#8b5cf6" strokeWidth="1.5" />
                  <circle r="4" fill="#8b5cf6" />
                  <text y="-12" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="monospace">AS</text>
                </g>

                {/* MH Node */}
                <g transform="translate(105, 175)" className="cursor-pointer" onClick={() => onSelectState(states.find(s => s.code === 'MH')!)}>
                  <circle r="9" fill="#0284c7" fillOpacity="0.2" stroke="#0284c7" strokeWidth="1.5" />
                  <circle r="4" fill="#0284c7" />
                  <text y="-12" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="monospace">MH</text>
                </g>

                {/* OD Node */}
                <g transform="translate(200, 170)" className="cursor-pointer" onClick={() => onSelectState(states.find(s => s.code === 'OD')!)}>
                  <circle r="9" fill="#ec4899" fillOpacity="0.2" stroke="#ec4899" strokeWidth="1.5" />
                  <circle r="4" fill="#ec4899" />
                  <text y="-12" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="monospace">OD</text>
                </g>

                {/* KL Node */}
                <g transform="translate(110, 245)" className="cursor-pointer" onClick={() => onSelectState(states.find(s => s.code === 'KL')!)}>
                  <circle r="9" fill="#06b6d4" fillOpacity="0.2" stroke="#06b6d4" strokeWidth="1.5" />
                  <circle r="4" fill="#06b6d4" />
                  <text y="-12" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="monospace">KL</text>
                </g>

                {/* TN Node */}
                <g transform="translate(135, 235)" className="cursor-pointer" onClick={() => onSelectState(states.find(s => s.code === 'TN')!)}>
                  <circle r="9" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="1.5" />
                  <circle r="4" fill="#10b981" />
                  <text y="-12" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="monospace">TN</text>
                </g>

                {/* Central Federated Aggregator Hub in New Delhi */}
                <g transform="translate(135, 70)">
                  <circle r="12" fill="#10b981" fillOpacity="0.1" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />
                  <circle r="5" fill="#10b981" />
                  <text y="-14" textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="bold" fontFamily="monospace">NATIONAL HUB</text>
                </g>
              </svg>
            </div>

            <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Selected Node: <strong className="text-slate-200">{selectedState.name}</strong></span>
              <span className="font-mono text-emerald-400">GPS & IoT Active</span>
            </div>
          </div>
        </div>

      </div>

      {/* Regional Explainer Modal for alerts */}
      <RegionalExplainerModal
        isOpen={!!explainerAlert}
        onClose={() => setExplainerAlert(null)}
        title={explainerAlert ? `${explainerAlert.phcName}: ${explainerAlert.title}` : ''}
        details={explainerAlert ? `${explainerAlert.medicineOrResource}. ${explainerAlert.reason}. Action: ${explainerAlert.recommendedAction}` : ''}
        phcName={explainerAlert?.phcName}
        district={explainerAlert?.district}
      />
    </div>
  );
};
