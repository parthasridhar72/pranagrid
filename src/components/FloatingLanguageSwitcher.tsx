import React, { useState } from 'react';
import { Globe, ArrowLeftRight, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage } from '../types/languages';

export const FloatingLanguageSwitcher: React.FC = () => {
  const { language, setLanguage, switchToEnglish, currentLanguageInfo, availableLanguages } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end">
      {/* Expanded Menu */}
      {isExpanded && (
        <div className="mb-2 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-64 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Vernacular Switcher</span>
            </span>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>

          {/* Instant English button */}
          <button
            onClick={() => {
              switchToEnglish();
              setIsExpanded(false);
            }}
            className={`w-full mb-2 px-2.5 py-1.5 text-xs rounded-md font-semibold flex items-center justify-between transition-colors ${
              language === 'en'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40'
            }`}
          >
            <span>🇬🇧 Switch to English</span>
            {language === 'en' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          {/* Regional Languages list */}
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {availableLanguages.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLanguage(l.code);
                  setIsExpanded(false);
                }}
                className={`w-full px-2 py-1 text-xs rounded text-left flex items-center justify-between transition-colors ${
                  language === l.code
                    ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-600/40'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{l.nativeName} ({l.name})</span>
                {language === l.code && <Check className="w-3 h-3 text-emerald-400" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Pill Dock */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/95 border border-slate-700 rounded-full shadow-xl backdrop-blur-md">
        {/* Instant Toggle: English <-> Tamil */}
        {language !== 'en' ? (
          <button
            type="button"
            onClick={switchToEnglish}
            className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/40 transition-all flex items-center gap-1 shadow-sm"
            title="Instant switch back to English"
          >
            <span>🇬🇧 English</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setLanguage('ta')}
            className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 transition-all flex items-center gap-1 shadow-sm"
            title="தமிழுக்கு மாறுக / Switch to Tamil"
          >
            <span>🇮🇳 தமிழ்</span>
          </button>
        )}

        {/* Menu Expand Button */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-2 py-1 text-xs font-medium rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1"
          title="More Indian Languages"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-[11px] hidden sm:inline">{currentLanguageInfo.nativeName}</span>
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-slate-400" />
          ) : (
            <ChevronUp className="w-3 h-3 text-slate-400" />
          )}
        </button>
      </div>
    </div>
  );
};
