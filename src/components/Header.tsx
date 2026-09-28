import React, { useState } from 'react';
import { Activity, Wifi, WifiOff, AlertTriangle, KeyRound, Globe, Volume2, VolumeX } from 'lucide-react';
import { OutbreakScenario } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelectorModal } from './LanguageSelectorModal';
import { LanguageSelectorDropdown } from './LanguageSelectorDropdown';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOnline: boolean;
  toggleConnectivity: () => void;
  offlineQueueCount: number;
  activeScenario: OutbreakScenario | null;
  onOpenScenarioModal: () => void;
  onOpenCryptoInspector: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isOnline,
  toggleConnectivity,
  offlineQueueCount,
  activeScenario,
  onOpenScenarioModal,
  onOpenCryptoInspector,
}) => {
  const { language, setLanguage, switchToEnglish, t, currentLanguageInfo, speak, stopSpeaking, isSpeaking } = useLanguage();
  const [isLangModalOpen, setIsLangModalOpen] = useState<boolean>(false);

  const navItems = [
    { id: 'overview', label: t('nav.overview', 'National Grid') },
    { id: 'inventory', label: t('nav.inventory', 'PHC Inventory & Beds') },
    { id: 'forecasting', label: t('nav.forecasting', 'Demand & Early Warnings') },
    { id: 'redistribution', label: t('nav.redistribution', 'Redistribution') },
    { id: 'federated', label: t('nav.federated', 'Federated Learning') },
    { id: 'offline-edge', label: t('nav.offline', 'Offline Edge & Vault') },
  ];

  const handleHeaderAudio = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      const summaryText = `${t('app.title')}. ${t('app.subtitle')}. ${t('status.online')}.`;
      speak(summaryText);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 lg:gap-4">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('overview');
                }}
                className="text-base font-bold tracking-tight text-white hover:text-emerald-400 transition-colors flex items-center gap-1.5"
              >
                <span>{t('app.title', 'PranaGrid')}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-normal">
                  {currentLanguageInfo.nativeName}
                </span>
              </a>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                <span className="truncate max-w-[180px] sm:max-w-[260px] lg:max-w-none" title={t('app.subtitle')}>
                  {t('app.subtitle', 'National PHC Logistics Network')}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400 shrink-0">MoHFW</span>
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 shrink-0">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Actions and Vernacular Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 shrink-0">
            {/* Quick Switch to English / Tamil Single-Click Pill */}
            {language !== 'en' ? (
              <button
                type="button"
                onClick={switchToEnglish}
                className="px-2 py-1 text-xs font-bold rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/40 transition-all flex items-center gap-1 shadow-sm whitespace-nowrap"
                title="Instant switch back to English / ஆங்கிலத்திற்கு மாறுக"
              >
                <span>🇬🇧 English</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setLanguage('ta')}
                className="px-2 py-1 text-xs font-bold rounded-md bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-600/50 transition-all flex items-center gap-1 shadow-sm whitespace-nowrap"
                title="தமிழுக்கு மாறுக / Switch to Tamil"
              >
                <span>🇮🇳 தமிழ்</span>
              </button>
            )}

            {/* Vernacular Language Dropdown with all 8 regional languages */}
            <LanguageSelectorDropdown
              onOpenFullModal={() => setIsLangModalOpen(true)}
            />

            {/* Audio Readout Toggle */}
            <button
              onClick={handleHeaderAudio}
              className={`p-1.5 lg:px-2 lg:py-1.5 text-xs font-medium rounded-md border transition-all flex items-center gap-1 ${
                isSpeaking
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 animate-pulse'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title={isSpeaking ? t('btn.speaking', 'Playing Audio...') : t('btn.listen_audio', 'Listen to page briefing')}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden lg:inline text-[10px] font-medium">{t('btn.speaking', 'Speaking...')}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden lg:inline text-[10px] font-medium">{t('label.audio_readout', 'Voice')}</span>
                </>
              )}
            </button>


            {/* Active Emergency Scenario indicator button */}
            <button
              onClick={onOpenScenarioModal}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 border whitespace-nowrap ${
                activeScenario
                  ? 'bg-amber-950/40 border-amber-600/50 text-amber-300 hover:bg-amber-900/50'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
              title="Configure Outbreak & Emergency Drill"
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${activeScenario ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">
                {activeScenario ? activeScenario.name.split(' ')[0] + ' Surge' : t('btn.emergency_drills', 'Emergency Drills')}
              </span>
            </button>

            {/* Cryptographic Vault button */}
            <button
              onClick={onOpenCryptoInspector}
              className="p-1.5 lg:px-2.5 lg:py-1.5 text-xs font-medium rounded-md bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-1.5"
              title="Inspect AES-256 & SHA-256 Telemetry Encryption"
            >
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden lg:inline font-mono">{t('btn.crypto_audit', 'Crypto Audit')}</span>
            </button>

            {/* Network Connectivity Toggle (Online vs Offline Simulator) */}
            <button
              onClick={toggleConnectivity}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 border whitespace-nowrap ${
                isOnline
                  ? 'bg-emerald-950/30 border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/40'
                  : 'bg-rose-950/40 border-rose-600/60 text-rose-300 hover:bg-rose-900/50'
              }`}
              title={isOnline ? 'Online mode. Click to simulate remote edge network disconnection.' : 'Offline mode active. Click to reconnect and synchronize.'}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono text-[11px]">{t('status.online', 'Grid Online')}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  <span className="font-mono text-[11px]">
                    {t('status.offline', 'Edge Offline')} {offlineQueueCount > 0 ? `(${offlineQueueCount})` : ''}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Responsive Horizontal Navigation Row */}
        <div className="lg:hidden mt-2.5 pt-2.5 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto pb-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />
    </>
  );
};

