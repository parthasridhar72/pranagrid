export type SupportedLanguage = 'ta' | 'en' | 'hi' | 'te' | 'mr' | 'bn' | 'kn' | 'ml';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  region: string;
  speechCode: string;
  direction?: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    region: 'தமிழ்நாடு / புதுச்சேரி (Tamil Nadu)',
    speechCode: 'ta-IN',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    region: 'National / Official',
    speechCode: 'en-IN',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    region: 'उत्तर भारत (North & Central India)',
    speechCode: 'hi-IN',
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    region: 'ఆంధ్రప్రదేశ్ / తెలంగాణ (AP & Telangana)',
    speechCode: 'te-IN',
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    region: 'महाराष्ट्र (Maharashtra)',
    speechCode: 'mr-IN',
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    region: 'পশ্চিমবঙ্গ / আসাম (West Bengal & Assam)',
    speechCode: 'bn-IN',
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    region: 'ಕರ್ನಾಟಕ (Karnataka)',
    speechCode: 'kn-IN',
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    region: 'കേരളം (Kerala)',
    speechCode: 'ml-IN',
  },
];
