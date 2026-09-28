import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check, Volume2, Sparkles, Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage } from '../types/languages';

interface LanguageSelectorDropdownProps {
  onOpenFullModal?: () => void;
  compact?: boolean;
}

export const LanguageSelectorDropdown: React.FC<LanguageSelectorDropdownProps> = ({
  onOpenFullModal,
  compact = false,
}) => {
  const { language, setLanguage, currentLanguageInfo, availableLanguages, speak } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelectLanguage = (code: SupportedLanguage) => {
    setLanguage(code);
    setIsOpen(false);
  };

  const handlePreviewAudio = (e: React.MouseEvent, code: SupportedLanguage, name: string) => {
    e.stopPropagation();
    if (code === 'ta') {
      speak('வணக்கம், பிராணாகிரிட் சுகாதார தளம்.', 'ta');
    } else if (code === 'en') {
      speak('PranaGrid National Health Logistics Network.', 'en');
    } else if (code === 'hi') {
      speak('नमस्ते, प्राणाग्रिड स्वास्थ्य पोर्टल।', 'hi');
    } else if (code === 'te') {
      speak('నమస్కారం, ప్రాణాగ్రిడ్ ఆరోగ్య వేదిక.', 'te');
    } else if (code === 'mr') {
      speak('नमस्कार, प्राणाग्रीड आरोग्य पोर्टल.', 'mr');
    } else if (code === 'bn') {
      speak('নমস্কার, প্রাণাগ্রিড স্বাস্থ্য পোর্টাল।', 'bn');
    } else if (code === 'kn') {
      speak('ನಮಸ್ಕಾರ, ಪ್ರಾಣಾಗ್ರಿಡ್ ಆರೋಗ್ಯ ಪೋರ್ಟಲ್.', 'kn');
    } else if (code === 'ml') {
      speak('നമസ്കാരം, പ്രാണാഗ്രിഡ് ആരോഗ്യ പോർട്ടൽ.', 'ml');
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 hover:bg-emerald-900/50 hover:text-white transition-all flex items-center gap-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        title="Switch Language / மொழியை மாற்றுக"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="font-bold tracking-wide">{currentLanguageInfo.nativeName}</span>
        {currentLanguageInfo.code !== 'en' && !compact && (
          <span className="hidden sm:inline text-[10px] text-emerald-400/90 font-mono">
            ({currentLanguageInfo.name})
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-emerald-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Menu Header */}
          <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Select Language / மொழி</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
              8 States & Vernaculars
            </span>
          </div>

          {/* Quick Toggle Bar: English <-> Tamil */}
          <div className="p-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Quick Switch:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSelectLanguage('en')}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
                  language === 'en'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleSelectLanguage('ta')}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
                  language === 'ta'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                தமிழ் (Tamil)
              </button>
            </div>
          </div>

          {/* Languages List */}
          <div className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-800/40">
            {availableLanguages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <div
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`px-3 py-2 flex items-center justify-between cursor-pointer transition-colors group ${
                    isSelected
                      ? 'bg-emerald-950/40 text-emerald-300'
                      : 'hover:bg-slate-800/70 text-slate-200'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                        {lang.nativeName}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ({lang.name})
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate">
                      {lang.region}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handlePreviewAudio(e, lang.code, lang.name)}
                      className="p-1 rounded text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                      title={`Audio sample in ${lang.name}`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
                        <Check className="w-3 h-3" />
                      </div>
                    ) : (
                      <div className="w-5 h-5" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer with modal trigger if provided */}
          {onOpenFullModal && (
            <div className="p-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenFullModal();
                }}
                className="w-full text-center py-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open Detailed Regional Guide & Audio</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
