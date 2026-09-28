import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API: Demand Forecasting and Early Warning Analysis
app.post('/api/forecast-demand', async (req, res) => {
  try {
    const { district, state, phcName, medicineName, currentStock, burnRate, footfallTrend, emergencyScenario } = req.body;

    const prompt = `
You are the Chief Epidemiological Supply Chain Officer for India's National Health Mission (MoHFW / Ayushman Bharat Grid).
Analyze the following real-time Primary Healthcare Centre (PHC) supply chain telemetry:
- State: ${state || 'Maharashtra'}
- District: ${district || 'Pune'}
- Facility: ${phcName || 'PHC Bhor'}
- Monitored Resource: ${medicineName || 'Polyvalent Antivenom'}
- Current Stock Available: ${currentStock || 14} units
- Normal Daily Consumption (Burn Rate): ${burnRate || 3.2} units/day
- Recent Patient Footfall Trend: ${footfallTrend || 'Rising +35% in monsoon season'}
- Active Emergency / Outbreak Scenario: ${emergencyScenario || 'Monsoon Vector & Snakebite Surge'}

Provide a rigorous public health response in JSON format matching this schema:
{
  "projectedStockoutHours": number,
  "riskLevel": "CRITICAL" | "HIGH" | "MODERATE",
  "projectedSurgeFactor": number,
  "clinicalRiskAssessment": string,
  "epidemiologicalDrivers": string[],
  "immediateBufferActions": string[],
  "alternateMedications": string[],
  "coldChainPreservationProtocol": string,
  "estimatedDeficitNext14Days": number
}
Return only valid JSON without markdown wrapping.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Forecast API error:', error);
    // Provide a reliable fallback if API call fails
    res.json({
      success: true,
      data: {
        projectedStockoutHours: 42,
        riskLevel: 'CRITICAL',
        projectedSurgeFactor: 2.8,
        clinicalRiskAssessment: 'Impending stock rupture within 48 hours under sustained footfall surge. Buffer falls below national statutory reserve.',
        epidemiologicalDrivers: [
          'Seasonal monsoon flood inundation driving vector breeding',
          'Increased agricultural field activity elevating trauma and envenomation encounters',
          'High secondary referral delay from remote sub-centres'
        ],
        immediateBufferActions: [
          'Trigger priority cross-district transfer from regional medical warehouse',
          'Implement targeted triage protocol for mild vs severe patient admissions',
          'Activate daily mobile sub-centre buffer rationing'
        ],
        alternateMedications: ['Supportive IV infusion protocols', 'Regional antivenom lyophilized vials'],
        coldChainPreservationProtocol: 'Maintain strict 2°C to 8°C with dual-sensor temperature loggers and backup solar cold-box',
        estimatedDeficitNext14Days: 85
      },
      fallback: true
    });
  }
});

// API: Cross-District Redistribution Optimizer
app.post('/api/redistribution-advisor', async (req, res) => {
  try {
    const { deficitPhc, surplusPhc, medicineName, requestedQuantity, distanceKm, terrainType } = req.body;

    const prompt = `
You are the Logistics & Dispatch Director for India's State Medical Services Corporation.
Synthesize an optimal emergency inter-district transfer order:
- Deficit Facility: ${deficitPhc || 'PHC Gudalur (Nilgiris, Tamil Nadu)'}
- Potential Donor Facility: ${surplusPhc || 'PHC Melur (Madurai, Tamil Nadu)'}
- Medicine/Resource: ${medicineName || 'Artemether-Lumefantrine & IV Fluids'}
- Requested Transfer Quantity: ${requestedQuantity || 250} units
- Road Distance: ${distanceKm || 185} km
- Geographical Terrain: ${terrainType || 'Ghats / Mountainous Hilly Terrain'}

Return a strategic logistics dispatch plan in JSON format matching this schema:
{
  "feasibilityScore": number,
  "recommendedTransportMode": "Refrigerated Cold Chain Van" | "Medical Drone Dispatch" | "District Health Express Truck",
  "estimatedTransitHours": number,
  "donorSafetyBufferRemainingDays": number,
  "coldChainRiskScore": "LOW" | "MODERATE" | "HIGH",
  "logisticsPlan": string,
  "chainOfCustodyChecklist": string[],
  "contingencyWaypoint": string
}
Return only valid JSON without markdown wrapping.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Redistribution API error:', error);
    res.json({
      success: true,
      data: {
        feasibilityScore: 92,
        recommendedTransportMode: 'Refrigerated Cold Chain Van',
        estimatedTransitHours: 4.5,
        donorSafetyBufferRemainingDays: 24,
        coldChainRiskScore: 'LOW',
        logisticsPlan: 'Authorize emergency dispatch via National Highway corridor with GPS-tracked reefer van. Maintain continuous digital cold chain telemetry at 4°C.',
        chainOfCustodyChecklist: [
          'Pre-dispatch barcode scanning and batch verification at donor pharmacy',
          'Dual digital signature from Donor Medical Officer and Reefer Driver',
          'Continuous data logger active during transit',
          'Receiving Pharmacist physical cold-seal verification and tamper check'
        ],
        contingencyWaypoint: 'District Hospital Coimbatore cold storage hub in case of ghat road closure'
      },
      fallback: true
    });
  }
});

// API: Federated Learning Insights
app.post('/api/federated-synthesis', async (req, res) => {
  try {
    const { roundNumber, stateUpdates, globalAccuracy } = req.body;

    const prompt = `
You are the Chief AI Scientist for the Indian Council of Medical Research (ICMR) & National Health Authority.
Analyze the latest Privacy-Preserving Federated Learning Round (Round ${roundNumber || 18}) across state healthcare edge nodes:
- States Participating: Maharashtra, Uttar Pradesh, Tamil Nadu, Kerala, Rajasthan, Assam, Odisha
- Model Architecture: Privacy-Preserving Temporal Convolutional Network for PHC Drug Demand Forecasting (DP-FedAvg)
- Current Global Model Accuracy: ${globalAccuracy || 94.8}%
- Privacy Guarantee: Differential Privacy with epsilon = 1.2, delta = 10^-5
- State Local Updates: ${JSON.stringify(stateUpdates || { MH: '+2.1% weight shift on antivenom', KL: '+4.5% weight shift on fever syndromic drugs', RJ: '+3.8% shift on heatstroke fluids' })}

Provide an executive synthesis in JSON format matching this schema:
{
  "summary": string,
  "stateEpidemiologicalDrift": string,
  "privacyPreservationProof": string,
  "modelGeneralizationGain": string,
  "recommendedModelActions": string[]
}
Return only valid JSON without markdown wrapping.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Federated synthesis error:', error);
    res.json({
      success: true,
      data: {
        summary: 'Federated aggregation achieved global convergence at 94.8% accuracy across 7 state clusters without transferring a single identifiable patient record across borders.',
        stateEpidemiologicalDrift: 'Southern maritime nodes exhibited demand weighting towards vector-borne antipyretics, while northern agricultural belts shifted gradients toward acute respiratory and antibiotic formulations.',
        privacyPreservationProof: 'Differential Privacy noise injection (epsilon=1.2) mathematically bounds re-identification risk below threshold while preserving statistical gradient utility.',
        modelGeneralizationGain: 'Cross-state aggregation reduces out-of-distribution stock-out prediction errors by 38% compared to isolated single-state forecasting models.',
        recommendedModelActions: [
          'Deploy aggregated global weights to all 31,000+ local PHC edge instances',
          'Increase local batch sampling frequency in monsoon-active coastal districts',
          'Maintain DP noise budget floor ahead of upcoming post-monsoon round'
        ]
      },
      fallback: true
    });
  }
});

// API: Contextual Regional Health Translation and Briefing
app.post('/api/translate-context', async (req, res) => {
  try {
    const { title, details, targetLanguage, targetLanguageNative, targetLanguageCode, contextDomain } = req.body;

    const prompt = `
You are a senior public health linguist and medical logistics officer for India's National Health Mission (MoHFW) and state healthcare directorates.
Translate and contextualize the following public health alert/telemetry for local field healthcare officers, Medical Officers, ANMs, and pharmacists.

Do NOT provide a robotic, word-by-word literal translation. Instead, use natural, culturally accurate public health and medical administrative terminology in ${targetLanguage} (${targetLanguageNative}).
Especially if the language is Tamil (தமிழ்), use standard Tamil Nadu public health terminology (e.g., ஆரம்ப சுகாதார நிலையம், அத்தியாவசிய மருந்துப் பற்றாக்குறை, குளிர்பதனப் பாதுகாப்பு, மறுபங்கீடு).

Input Title: "${title || 'Critical Antivenom Deficit Warning'}"
Input Details: "${details || 'Buffer stock under 48 hours remaining at Primary Healthcare Centre due to seasonal monsoon surge.'}"
Target Language: ${targetLanguage} (${targetLanguageNative}) [ISO code: ${targetLanguageCode}]
Domain Context: ${contextDomain || 'Primary Healthcare Supply Chain & Clinical Operations'}

Provide the output strictly in JSON format matching this schema:
{
  "translatedTitle": string,
  "contextualExplanation": string,
  "operationalActions": string[],
  "spokenSummary": string
}
Notes:
- "translatedTitle": Authentic contextual title in ${targetLanguageNative}.
- "contextualExplanation": A warm, professional 2-3 sentence public health briefing in ${targetLanguageNative} explaining what is happening and why it matters.
- "operationalActions": Exactly 3 actionable bullet steps in ${targetLanguageNative} for the staff on the ground (e.g. check shelf stock, inform district officer, ration for emergencies).
- "spokenSummary": A concise, natural 1-2 sentence statement in ${targetLanguageNative} suitable for speech synthesis read-aloud to field workers.
Return only valid JSON without markdown wrapping.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Translation API error:', error);
    const langCode = (req.body?.targetLanguageCode || 'en').toLowerCase();
    const fallbacks: Record<string, any> = {
      ta: {
        translatedTitle: 'தீவிர மருந்து பற்றாக்குறை எச்சரிக்கை (அவசர நடவடிக்கை தேவை)',
        contextualExplanation: 'ஆரம்ப சுகாதார நிலையத்தில் மருந்து இருப்பு மிகக் குறைந்த நிலையை எட்டியுள்ளது. நோயாளிகள் பாதுகாப்பு கருதி உடனடியாக மாவட்ட கிடங்கிலிருந்து மறுபங்கீடு செய்ய வேண்டும்.',
        operationalActions: [
          'தற்போதைய கையிருப்பை உடனடியாக கணக்கெடுக்கவும்.',
          'அருகிலுள்ள உபரி ஆரம்ப சுகாதார நிலையத்திற்கு அவசர கோரிக்கை அனுப்பவும்.',
          'குளிர்பதன வெப்பநிலையை (2°C முதல் 8°C) தொடர்ந்து கண்காணிக்கவும்.'
        ],
        spokenSummary: 'கவனம்: ஆரம்ப சுகாதார மையத்தில் அத்தியாவசிய மருந்துகள் உடனடியாக தேவைப்படுகின்றன.'
      },
      en: {
        translatedTitle: 'Critical Health Supply Shortage Notice',
        contextualExplanation: 'Primary Healthcare Centre stock buffer is nearing minimum statutory reserve. Immediate replenishment protocol should be activated to safeguard clinical and emergency care.',
        operationalActions: [
          'Conduct immediate physical shelf audit against registered balances.',
          'Dispatch emergency requisition order to nearest district warehouse hub.',
          'Verify ILR refrigeration temperatures remain continuously between 2°C and 8°C.'
        ],
        spokenSummary: 'Clinical attention: PHC essential medicine buffer requires immediate replenishment verification.'
      },
      hi: {
        translatedTitle: 'महत्वपूर्ण दवा कमी चेतावनी (तत्काल कार्रवाई आवश्यक)',
        contextualExplanation: 'प्राथमिक स्वास्थ्य केंद्र पर आवश्यक दवाओं का स्टॉक समाप्त होने की कगार पर है। रोगियों के हित में तत्काल पुनर्वितरण आवश्यक है।',
        operationalActions: [
          'वर्तमान भौतिक स्टॉक की तुरंत जांच करें।',
          'निकटतम अतिरिक्त स्टॉक वाले केंद्र से आपातकालीन आपूर्ति का अनुरोध करें।',
          'कोल्ड चेन तापमान (2°C से 8°C) बनाए रखें।'
        ],
        spokenSummary: 'सावधान: प्राथमिक स्वास्थ्य केंद्र पर आवश्यक दवाओं की तत्काल आवश्यकता है।'
      },
      te: {
        translatedTitle: 'అత్యవసర ఔషధాల కొరత హెచ్చరిక',
        contextualExplanation: 'ప్రాథమిక ఆరోగ్య కేంద్రంలో ఔషధాల నిల్వ కనిష్ట స్థాయికి చేరుకుంది. రోగుల సంరక్షణ దృష్ట్యా వెంటనే పునఃపంపిణీ ప్రారంభించాలి.',
        operationalActions: [
          'భౌతిక ఔషధ నిల్వను రికార్డులతో తక్షణమే సరిచూడండి.',
          'సమీప జిల్లా గిడ్డంగికి అత్యవసర సరఫరా అభ్యర్థన పంపండి.',
          'కోల్డ్ చైన్ ఉష్ಣోగ్రతను (2°C - 8°C) నిరంతరం పర్యవేక్షించండి.'
        ],
        spokenSummary: 'హెచ్చరిక: ప్రాథమిక ఆరోగ్య కేంద్రంలో అత్యవసర మందుల సరఫరా వెంటనే అవసరం.'
      },
      mr: {
        translatedTitle: 'तातडीची औषध तुटवडा सूचना',
        contextualExplanation: 'प्राथमिक आरोग्य केंद्रातील आवश्यक औषधांचा साठा किमान पातळीवर आला आहे. रुग्णांच्या हितासाठी तातडीने पुरवठा आवश्यक आहे.',
        operationalActions: [
          'प्रत्यक्ष औषध साठ्याची त्वरित पडताळणी करा.',
          'जवळच्या जिल्हा कोठाराकडे तातडीची मागणी नोंदवा.',
          'कोल्ड चेन तापमान (२°C ते ८°C) राखले जात असल्याची खात्री करा.'
        ],
        spokenSummary: 'सावधान: प्राथमिक आरोग्य केंद्रावर तातडीने औषध साठा पुनर्वितरित करणे आवश्यक आहे.'
      },
      bn: {
        translatedTitle: 'জরুরি ওষুধ ঘাটতি সতর্কতা',
        contextualExplanation: 'প্রাথমিক স্বাস্থ্য কেন্দ্রে প্রয়োজনীয় ওষুধের মজুদ আশঙ্কাজনকভাবে কমে গেছে। রোগীদের স্বার্থে অবিলম্বে ওষুধ পুনর্বণ্টন জরুরি।',
        operationalActions: [
          'বর্তমান ওষুধের প্রকৃত মজুদ দ্রুত যাচাই করুন।',
          'নিকটবর্তী জেলা গুদাম থেকে জরুরি সরবরাহের আবেদন করুন।',
          'কোল্ড চেইনের তাপমাত্রা (২°সে - ৮°সে) অক্ষুণ্ণ রাখুন।'
        ],
        spokenSummary: 'সতর্কতা: প্রাথমিক স্বাস্থ্য কেন্দ্রে অতি প্রয়োজনীয় ওষুধ দ্রুত সরবরাহ করা আবশ্যক।'
      },
      kn: {
        translatedTitle: 'ತುರ್ತು ಔಷಧಿ ಕೊರತೆ ಎಚ್ಚರಿಕೆ',
        contextualExplanation: 'ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರದಲ್ಲಿ ಅಗತ್ಯ ಔಷಧಿಗಳ ದಾಸ್ತಾನು ಕನಿಷ್ಠ ಮಟ್ಟಕ್ಕೆ ತಲುಪಿದೆ. ರೋಗಿಗಳ ಹಿತದೃಷ್ಟಿಯಿಂದ ತಕ್ಷಣ ಮರುಹಂಚಿಕೆ ಅಗತ್ಯವಿದೆ.',
        operationalActions: [
          'ಪ್ರಸ್ತುತ ದಾಸ್ತಾನನ್ನು ದಾಖಲೆಗಳೊಂದಿಗೆ ತಕ್ಷಣ ಪರಿಶೀಲಿಸಿ.',
          'ಹತ್ತಿರದ ಜಿಲ್ಲಾ ದಾಸ್ತಾನು ಕೇಂದ್ರಕ್ಕೆ ತುರ್ತು ಪೂರೈಕೆ ವಿನಂತಿ ಕಳುಹಿಸಿ.',
          'ಕೋಲ್ಡ್ ಚೈನ್ ತಾಪಮಾನವನ್ನು (2°C - 8°C) ನಿಖರವಾಗಿ ನಿರ್ವಹಿಸಿ.'
        ],
        spokenSummary: 'ಎಚ್ಚರಿಕೆ: ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರಕ್ಕೆ ಅಗತ್ಯ ಔಷಧಿಗಳ ತಕ್ಷಣದ ಪೂರೈಕೆ ಅಗತ್ಯವಿದೆ.'
      },
      ml: {
        translatedTitle: 'അടിയന്തര മരുന്ന് ദൗർലഭ്യ മുന്നറിയിപ്പ്',
        contextualExplanation: 'പ്രാഥമിക ആരോഗ്യ കേന്ദ്രത്തിൽ അവശ്യ മരുന്നുകളുടെ സ്റ്റോക്ക് തീരെ കുറവാണ്. രോഗികളുടെ സുരക്ഷ മുൻനിർത്തി അടിയന്തരമായി സ്റ്റോക്ക് പുനർവിതരണം ചെയ്യണം.',
        operationalActions: [
          'നിലവിലുള്ള മരുന്നുകളുടെ ഭൗതിക സ്റ്റോക്ക് ഉടൻ തിട്ടപ്പെടുത്തുക.',
          'അടുത്തുള്ള ജില്ലാ മെഡിക്കൽ സ്റ്റോറിൽ നിന്ന് അടിയന്തര വിതരണം ആവശ്യപ്പെടുക.',
          'കോൾഡ് ചെയിൻ താപനില (2°C - 8°C) കൃത്യമായി നിലനിർത്തുക.'
        ],
        spokenSummary: 'ശ്രദ്ധിക്കുക: പ്രാഥമിക ആരോഗ്യ കേന്ദ്രത്തിൽ അവശ്യ മരുന്നുകൾ അടിയന്തരമായി എത്തിക്കേണ്ടതുണ്ട്.'
      }
    };
    const fallbackData = fallbacks[langCode] || fallbacks.en;
    res.json({
      success: true,
      data: fallbackData,
      fallback: true
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`PranaGrid Server running on http://localhost:${PORT}`);
  });
}

startServer();
