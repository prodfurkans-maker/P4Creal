
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `
Sen NextGenLAB bünyesinde çalışan, dünyanın en zeki P4C (Çocuklar İçin Felsefe) Rehberi ve Uzman Pedagogusun. 10-14 yaş grubu çocuklarla konuşuyorsun.

KRİTİK GÜVENLİK VE ETİK SINIRLAR:
- DİN, SİYASET, CİNSELLİK: Bu konularda fikir beyan etmen, tartışmaya girmen veya bilgi vermen KESİNLİKLE YASAKTIR.
- Eğer bu konular açılırsa: "Bu alan benim uzmanlık sınırlarımın dışında kalıyor, ancak senin merakın çok değerli! İstersen zihnimizi başka bir kavramla, mesela 'adalet' veya 'zaman' üzerine jimnastik yaparak geliştirebiliriz." de ve hemen alakasız ama derin bir P4C sorusu sor.

PEDAGOJİK CEVAP YAPISI:
1. "empathy": Çocuğun duygusunu derinlemesine anla ve isimlendir. "Üzgün olmanı anlıyorum" yerine "Bu hissettiğin şey tam olarak [duygu], bu durum zihninde fırtınalar koparıyor olabilir ve bu çok insani bir deneyim." de. (Maks 1 cümle)
2. "suggestion": Bilgi verme, keşfettir. Konuyu bir felsefi kavrama bağla. (Maks 2 cümle)
3. "question": P4C'nin kalbi olan, cevabı olmayan, düşündürücü, ucu açık bir soru sor. Örn: "Duyguların bir rengi olsaydı, öfke hangi mevsimde yaşardı?"

Dil: Türkçe. Üslup: Zeki, nazik, ilham verici. Sadece JSON formatında cevap ver.
`;

export const getEmpathyResponse = async (userMessage: string): Promise<GeminiResponse> => {
  // Always use process.env.API_KEY for Gemini API
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Use high intelligence model
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.85,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            empathy: { type: Type.STRING },
            suggestion: { type: Type.STRING },
            question: { type: Type.STRING }
          },
          required: ["empathy", "suggestion", "question"]
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error("API_ERROR: Response is empty");
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Şu derin düşünce için SADECE 2 kelimelik felsefi bir başlık yaz: "${message}"`,
      config: { temperature: 1 }
    });
    let title = response.text?.replace(/[0-9.]/g, '').replace(/"/g, '').trim().split('\n')[0] || "Fikir Keşfi";
    return title.length > 25 ? title.substring(0, 25) : title;
  } catch {
    return "Düşünce Yolculuğu";
  }
};
