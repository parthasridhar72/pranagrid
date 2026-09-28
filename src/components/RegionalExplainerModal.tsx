import React, { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, Sparkles, CheckCircle2, Languages, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage } from '../types/languages';

interface RegionalExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  details: string;
  phcName?: string;
  district?: string;
  contextDomain?: string;
}

export const RegionalExplainerModal: React.FC<RegionalExplainerModalProps> = ({
  isOpen,
  onClose,
  title,
  details,
  phcName,
  district,
  contextDomain,
}) => {
  const { 
    language, 
    setLanguage, 
    availableLanguages, 
    translateClinicalContext, 
    speak, 
    stopSpeaking, 
    isSpeaking,
    t 
  } = useLanguage();

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<{
    translatedTitle: string;
    contextualExplanation: string;
    operationalActions: string[];
    spokenSummary: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTranslation(language);
    } else {
      stopSpeaking();
    }
  }, [isOpen, title, details, language]);

  const loadTranslation = async (targetLang: SupportedLanguage) => {
    setLoading(true);
    try {
      const fullContext = `${details}. Facility: ${phcName || 'PHC'}, District: ${district || 'State'}.`;
      const result = await translateClinicalContext(title, fullContext, targetLang);
      if (result && result.translatedTitle) {
        setData(result);
      } else {
        throw new Error('Empty translation response');
      }
    } catch (err) {
      console.error('Translation loading error:', err);
      // Resilient local fallback so modal is NEVER empty or blank
      const langOption = availableLanguages.find((l) => l.code === targetLang) || availableLanguages[0];
      setData({
        translatedTitle: `[${langOption.nativeName}] ${title}`,
        contextualExplanation: `${details} (Facility: ${phcName || 'PHC'}, District: ${district || 'State'}). Essential buffer review required to prevent clinical stock rupture.`,
        operationalActions: [
          'Verify shelf stock against physical inventory count',
          'Coordinate emergency buffer replenishment from nearest district medical store',
          'Inspect cold chain refrigerator temperature (maintain strictly between 2°C - 8°C)'
        ],
        spokenSummary: `Clinical alert: ${title}. Please audit local medical inventory immediately.`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else if (data?.spokenSummary) {
      speak(data.spokenSummary, language);
    }
  };

  if (!isOpen) return null;

  const currentLang = availableLanguages.find((l) => l.code === language) || availableLanguages[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  {t('modal.explainer_title', 'Regional Public Health Explainer')}
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-semibold">
                  {currentLang.nativeName} ({currentLang.name})
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('modal.context_subtitle', 'Contextual Healthcare & Supply Chain Translation for Field Staff')}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Language Switcher Pills */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] text-slate-400 font-medium shrink-0 mr-1">
            {t('btn.language_select', 'Language')}:
          </span>
          {availableLanguages.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLanguage(l.code);
                loadTranslation(l.code);
              }}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all whitespace-nowrap ${
                language === l.code
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {l.nativeName}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-xs font-medium text-slate-300">
                Contextualizing medical telemetry in {currentLang.nativeName} ({currentLang.name})...
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                AI Public Health Localization Engine Active
              </p>
            </div>
          ) : data ? (
            <>
              {/* Original Alert vs Contextual Title */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                  {t('modal.original_alert', 'Original System Alert')}
                </span>
                <p className="text-xs text-slate-300 font-medium">{title}</p>
                <div className="mt-3 pt-3 border-t border-slate-700/60">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block mb-1">
                    {currentLang.nativeName} — {t('modal.localized_title', 'Clinical Heading')}
                  </span>
                  <p className="text-base font-bold text-white tracking-tight">
                    {data.translatedTitle}
                  </p>
                </div>
              </div>

              {/* Contextual Public Health Explanation */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('modal.context_heading', 'Clinical & Operational Context')}</span>
                  </h4>
                  {data.spokenSummary && (
                    <button
                      onClick={handleSpeak}
                      className={`px-2.5 py-1 text-xs rounded-md flex items-center gap-1.5 font-medium transition-all ${
                        isSpeaking
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      }`}
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>{t('modal.stop', 'Stop Audio')}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{t('modal.listen', 'Listen Audio')}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {data.contextualExplanation}
                </p>
              </div>

              {/* Actionable Recommendations for Staff */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  {t('modal.actions_heading', 'Immediate Ground-Level Actions for Staff')}
                </h4>
                <div className="space-y-2">
                  {data.operationalActions.map((action, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-emerald-100 font-medium leading-relaxed">
                        {action}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Ayushman Arogya Network · Contextual Public Health Linguistics</span>
          </div>
          <button
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-xs font-medium transition-colors"
          >
            {t('modal.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};
