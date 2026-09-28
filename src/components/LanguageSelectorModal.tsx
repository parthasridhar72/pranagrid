import React from 'react';
import { X, Check, Globe, Volume2, Sparkles, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage } from '../types/languages';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { language, setLanguage, availableLanguages, speak, isSpeaking } = useLanguage();

  if (!isOpen) return null;

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    // Play a friendly contextual greeting or phrase
    if (code === 'ta') {
      speak('வணக்கம், பிராணாகிரிட் சுகாதார தளத்திற்கு வரவேற்கிறோம்.');
    } else if (code === 'hi') {
      speak('नमस्ते, प्राणाग्रिड स्वास्थ्य पोर्टल में आपका स्वागत है।');
    } else if (code === 'te') {
      speak('నమస్కారం, ప్రాణాగ్రిడ్ ఆరోగ్య వేదికకు స్వాగతం.');
    } else if (code === 'mr') {
      speak('नमस्कार, प्राणाग्रीड आरोग्य पोर्टलमध्ये आपले स्वागत आहे.');
    } else if (code === 'bn') {
      speak('নমস্কার, প্রাণাগ্রিড স্বাস্থ্য পোর্টালে আপনাকে স্বাগতম।');
    } else if (code === 'kn') {
      speak('ನಮಸ್ಕಾರ, ಪ್ರಾಣಾಗ್ರಿಡ್ ಆರೋಗ್ಯ ಪೋರ್ಟಲ್‌ಗೆ ಸ್ವಾಗತ.');
    } else if (code === 'ml') {
      speak('നമസ്കാരം, പ്രാണാഗ്രിഡ് ആരോഗ്യ പോർട്ടലിലേക്ക് സ്വാഗതം.');
    } else {
      speak('Welcome to PranaGrid National Health Logistics Network.');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>மொழியைத் தேர்ந்தெடுக்கவும் / Select Regional Language</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Contextual public health translations & audio briefings across India's states
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Grid */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Context-Aware Clinical & Logistics Localization:</span>
              <p className="mt-0.5 text-emerald-200/90 leading-relaxed">
                Translations use administrative public health vocabulary tailored to Indian state health departments, Primary Healthcare Centres (PHCs), cold chain management, and triage operations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableLanguages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <div
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between group ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50 shadow-md'
                      : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {lang.nativeName}
                        </span>
                        <span className="text-xs font-medium text-slate-400 font-mono">
                          ({lang.name})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{lang.region}</span>
                      </div>
                    </div>
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (lang.code === 'ta') {
                            speak('தமிழ் மொழி தேர்வு செய்யப்படுகிறது.', 'ta');
                          } else if (lang.code === 'hi') {
                            speak('हिंदी भाषा का चयन।', 'hi');
                          } else {
                            speak(`${lang.name} language audio test`, lang.code);
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-cyan-400 rounded transition-colors"
                        title="Sample Audio Pronunciation"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono text-[10px]">
                      {lang.code === 'ta' && 'ஆரம்ப சுகாதார மருந்துகள்'}
                      {lang.code === 'hi' && 'दवाएं एवं बिस्तर प्रबंधन'}
                      {lang.code === 'te' && 'ఔషధాల నిల్వ & పడకలు'}
                      {lang.code === 'mr' && 'औषध साठा व खाटा व्यवस्थापन'}
                      {lang.code === 'bn' && 'ওষুধ ও শয্যা পর্যবেক্ষণ'}
                      {lang.code === 'kn' && 'ಔಷಧಿ ದಾಸ್ತಾನು & ಹಾಸಿಗೆಗಳು'}
                      {lang.code === 'ml' && 'മരുന്നുകളും കിടക്കകളും'}
                      {lang.code === 'en' && 'Clinical Stock & Logistics'}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {isSelected ? 'Active' : 'Select'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span>Audio readout enabled for field ANMs & health workers</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md font-medium transition-colors"
          >
            {language === 'ta' ? 'சரி / முடிந்தது' : 'Done / Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
