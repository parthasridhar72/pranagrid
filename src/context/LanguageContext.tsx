import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLanguage, LanguageOption, SUPPORTED_LANGUAGES } from '../types/languages';
import { TRANSLATIONS } from '../services/translations';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  switchToEnglish: () => void;
  toggleTamilEnglish: () => void;
  t: (key: string, fallback?: string) => string;
  currentLanguageInfo: LanguageOption;
  availableLanguages: LanguageOption[];
  speak: (text: string, langCode?: SupportedLanguage) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  translateClinicalContext: (
    title: string,
    details: string,
    targetLang?: SupportedLanguage
  ) => Promise<{
    translatedTitle: string;
    contextualExplanation: string;
    operationalActions: string[];
    spokenSummary: string;
  }>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'pranagrid_lang_preference';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Check localStorage; default to 'en' (English) so user starts clean and can easily switch to Tamil/Hindi/etc.
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['ta', 'en', 'hi', 'te', 'mr', 'bn', 'kn', 'ml'].includes(saved)) {
      return saved as SupportedLanguage;
    }
    return 'en'; // Default to English with instant vernacular toggles
  });

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const switchToEnglish = () => {
    setLanguage('en');
  };

  const toggleTamilEnglish = () => {
    if (language === 'en') {
      setLanguage('ta');
    } else {
      setLanguage('en');
    }
  };

  const currentLanguageInfo =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[1]; // default English info

  // Contextual translation lookup with fallback hierarchy
  const t = (key: string, fallback?: string): string => {
    const currentDict = TRANSLATIONS[language];
    if (currentDict && currentDict[key]) {
      return currentDict[key];
    }
    // Fallback to English
    const enDict = TRANSLATIONS['en'];
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return fallback || key;
  };

  // Text-To-Speech using Web Speech API with regional Indian language voices
  const speak = (text: string, langCode?: SupportedLanguage) => {
    if (!('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis is not supported on this browser.');
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const targetLang = langCode || language;
      const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang) || currentLanguageInfo;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langInfo.speechCode;
      utterance.rate = 0.95; // Clear pace for medical terminology
      utterance.pitch = 1.0;

      // Try to find the closest matched voice
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(
        (v) => v.lang.startsWith(targetLang) || v.lang.includes(langInfo.speechCode)
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech synthesis error:', err);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // AI-powered Contextual Regional Medical Explainer
  const translateClinicalContext = async (
    title: string,
    details: string,
    targetLang?: SupportedLanguage
  ) => {
    const chosenLang = targetLang || language;
    const chosenLangInfo = SUPPORTED_LANGUAGES.find((l) => l.code === chosenLang) || currentLanguageInfo;

    try {
      const response = await fetch('/api/translate-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          details,
          targetLanguage: chosenLangInfo.name,
          targetLanguageNative: chosenLangInfo.nativeName,
          targetLanguageCode: chosenLang,
          contextDomain: 'Primary Healthcare Centre (PHC) Clinical & Supply Chain Operations',
        }),
      });

      if (!response.ok) {
        throw new Error('Translation API network error');
      }

      const resJson = await response.json();
      if (resJson.success && resJson.data && resJson.data.translatedTitle) {
        return resJson.data;
      }
      throw new Error('Translation API returned invalid structure');
    } catch (error) {
      console.error('Error fetching clinical context translation:', error);

      // Context-aware fallback if offline or API error for all 8 Indian languages
      if (chosenLang === 'ta') {
        return {
          translatedTitle: `[தமிழ் மருத்துவ வழிகாட்டி] ${title}`,
          contextualExplanation: `ஆரம்ப சுகாதார நிலையத்திற்கான கள நிலவரம்: ${details}. அத்தியாவசிய மருந்துகள் மற்றும் படுக்கைகள் தட்டுப்பாட்டைத் தவிர்த்து நோயாளிகள் சேவையை உறுதி செய்ய உடனடி நடவடிக்கைகள் எடுக்கப்பட வேண்டும்.`,
          operationalActions: [
            'மருந்துக் கிடங்கு இருப்பு மற்றும் பதிவேட்டை உடனடியாக நேரில் சரிபார்க்கவும்.',
            'அருகிலுள்ள மாவட்ட மருந்துக் கிடங்கு அல்லது உபரி மையத்திலிருந்து அவசர மறுபங்கீடு பெறவும்.',
            'குளிர்பதனப் பெட்டியின் வெப்பநிலையை (2°C முதல் 8°C வரை) உறுதி செய்யவும்.'
          ],
          spokenSummary: `பிராணாகிரிட் சுகாதார எச்சரிக்கை: ${title}. ஆரம்ப சுகாதார நிலைய மருந்துக் கையிருப்பை உடனடியாக சரிபார்க்கவும்.`
        };
      }

      if (chosenLang === 'hi') {
        return {
          translatedTitle: `[स्वास्थ्य परामर्श] ${title}`,
          contextualExplanation: `प्राथमिक स्वास्थ्य केंद्र परिचालन सूचना: ${details}। रोगियों के निर्बाध उपचार हेतु आवश्यक दवाओं का स्टॉक सुनिश्चित करें।`,
          operationalActions: [
            'भौतिक स्टॉक व डिजिटल रिकॉर्ड का तत्काल मिलान करें।',
            'निकटतम जिला वेयरहाउस अथवा अतिरिक्त स्टॉक वाले केंद्र से आपातकालीन आपूर्ति का अनुरोध करें।',
            'कोल्ड चेन तापमान (2°C से 8°C) का नियमित निरीक्षण सुनिश्चित करें।'
          ],
          spokenSummary: `प्राणाग्रिड स्वास्थ्य चेतावनी: ${title}। कृपया पीएचसी पर दवाओं और कोल्ड चेन की तत्काल जांच करें।`
        };
      }

      if (chosenLang === 'te') {
        return {
          translatedTitle: `[వైద్య సమాచారం] ${title}`,
          contextualExplanation: `ప్రాథమిక ఆరోగ్య కేంద్ర కార్యాచరణ సమాచారం: ${details}. రోగులకు అంతరాయం లేని వైద్య సేవలు అందించడానికి తక్షణ చర్యలు అవసరం.`,
          operationalActions: [
            'ప్రస్తుత భౌతిక ఔషధ నిల్వను రికార్డులతో సరిచూసుకోండి.',
            'సమీప జిల్లా మందుల గిడ్డంగి నుండి అత్యవసర సరఫరాను కోరండి.',
            'కోల్డ్ చైన్ ఉష్ణోగ్రత 2°C నుండి 8°C మధ్య ఉండేలా నిర్ధారించండి.'
          ],
          spokenSummary: `ప్రాణాగ్రిడ్ ఆరోగ్య హెచ్చరిక: ${title}. తక్షణమే పీహెచ్‌సీ నిల్వలను ధృవీకరించండి.`
        };
      }

      if (chosenLang === 'mr') {
        return {
          translatedTitle: `[वैद्यकीय सल्ला] ${title}`,
          contextualExplanation: `प्राथमिक आरोग्य केंद्र परिचालन सूचना: ${details}. रुग्णांच्या सेवेत कोणताही व्यत्यय येऊ नये म्हणून त्वरित उपाययोजना करणे आवश्यक आहे.`,
          operationalActions: [
            'औषधांच्या प्रत्यक्ष साठ्याची नोंदवहीशी पडताळणी करा.',
            'जवळच्या जिल्हा औषध कोठारातून तातडीने अतिरिक्त साठा मागवा.',
            'कोल्ड स्टोरेजचे तापमान (२°C ते ८°C) अचूक असल्याचे तपासा.'
          ],
          spokenSummary: `प्राणाग्रीड आरोग्य सूचना: ${title}. पीएचसीवरील साठा त्वरित तपासा.`
        };
      }

      if (chosenLang === 'bn') {
        return {
          translatedTitle: `[চিকিৎসা পরামর্শ] ${title}`,
          contextualExplanation: `প্রাথমিক স্বাস্থ্য কেন্দ্র পরিচালন বিজ্ঞপ্তি: ${details}। রোগীদের নিরবচ্ছিন্ন স্বাস্থ্যসেবা বজায় রাখতে অবিলম্বে ব্যবস্থা গ্রহণ প্রয়োজন।`,
          operationalActions: [
            'বর্তমান ওষুধের প্রকৃত মজুদের সাথে রেজিস্টারের হিসাব মিলিয়ে নিন।',
            'নিকটস্থ জেলা চিকিৎসা গুদাম থেকে জরুরি সরবরাহের আবেদন জানান।',
            'কোল্ড চেইনের তাপমাত্রা (২°সে থেকে ৮°সে) অক্ষুণ্ণ রাখা নিশ্চিত করুন।'
          ],
          spokenSummary: `প্রাণাগ্রিড স্বাস্থ্য সতর্কতা: ${title}। অবিলম্বে স্বাস্থ্যকেন্দ্রের ওষুধ মজুদ যাচাই করুন।`
        };
      }

      if (chosenLang === 'kn') {
        return {
          translatedTitle: `[ವೈದ್ಯಕೀಯ ಮಾಹಿತಿ] ${title}`,
          contextualExplanation: `ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರ ಕಾರ್ಯಾಚರಣೆ ಸೂಚನೆ: ${details}. ರೋಗಿಗಳಿಗೆ ತಡೆರಹಿತ ಸೇವೆ ಒದಗಿಸಲು ತಕ್ಷಣದ ಕ್ರಮ ಅಗತ್ಯವಿದೆ.`,
          operationalActions: [
            'ಪ್ರಸ್ತುತ ಔಷಧ ದಾಸ್ತಾನನ್ನು ದಾಖಲೆಗಳೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ.',
            'ಹತ್ತಿರದ ಜಿಲ್ಲಾ ದಾಸ್ತಾನು ಕೇಂದ್ರದಿಂದ ತುರ್ತು ಪೂರೈಕೆಯನ್ನು ಕೋರಿ.',
            'ಕೋಲ್ಡ್ ಚೈನ್ ತಾಪಮಾನವನ್ನು (2°C ನಿಂದ 8°C) ನಿಖರವಾಗಿ ಕಾಪಾಡಿಕೊಳ್ಳಿ.'
          ],
          spokenSummary: `ಪ್ರಾಣಾಗ್ರಿಡ್ ಆರೋಗ್ಯ ಎಚ್ಚರಿಕೆ: ${title}. ತಕ್ಷಣವೇ ಪಿಹೆಚ್‌ಸಿ ದಾಸ್ತಾನನ್ನು ಪರಿಶೀಲಿಸಿ.`
        };
      }

      if (chosenLang === 'ml') {
        return {
          translatedTitle: `[ക്ലിനിക്കൽ അറിയിപ്പ്] ${title}`,
          contextualExplanation: `പ്രാഥമിക ആരോഗ്യ കേന്ദ്രം പ്രവർത്തന വിവരണം: ${details}. രോഗികൾക്ക് തടസ്സമില്ലാത്ത ചികിത്സ ഉറപ്പാക്കാൻ അടിയന്തര നടപടികൾ സ്വീകരിക്കുക.`,
          operationalActions: [
            'നിലവിലുള്ള മരുന്നുകളുടെ സ്റ്റോക്ക് നേരിട്ട് പരിശോധിക്കുക.',
            'അടുത്തുള്ള ജില്ലാ മെഡിക്കൽ വെയർഹൗസിൽ നിന്ന് അടിയന്തര സ്റ്റോക്ക് ആവശ്യപ്പെടുക.',
            'കോൾഡ് ചെയിൻ താപനില 2°C മുതൽ 8°C വരെ കൃത്യമായി നിലനിർത്തുക.'
          ],
          spokenSummary: `പ്രാണാഗ്രിഡ് ആരോഗ്യ മുന്നറിയിപ്പ്: ${title}. പി.എച്ച്.സിയിലെ സ്റ്റോക്ക് ഉടൻ പരിശോധിക്കുക.`
        };
      }

      // Default English fallback
      return {
        translatedTitle: `[Clinical Advisory] ${title}`,
        contextualExplanation: `Operational notification for field healthcare officers: ${details}. Immediate physical stock audit recommended to verify cold chain integrity and local shelf reserve.`,
        operationalActions: [
          'Perform physical stock count against digital ledger balance.',
          'Request emergency buffer replenishment from nearest district warehouse or surplus hub.',
          'Ensure vaccine & cold chain storage temperatures remain strictly between 2°C and 8°C.'
        ],
        spokenSummary: `PranaGrid Clinical Alert: ${title}. Verify local PHC stocks and cold chain parameters immediately.`
      };
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        switchToEnglish,
        toggleTamilEnglish,
        t,
        currentLanguageInfo,
        availableLanguages: SUPPORTED_LANGUAGES,
        speak,
        stopSpeaking,
        isSpeaking,
        translateClinicalContext,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
