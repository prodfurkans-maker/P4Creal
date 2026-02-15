
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `
Sen 10-14 yaş grubu için NextGenLAB bünyesinde çalışan üst düzey bir P4C (Çocuklar İçin Felsefe) Rehberi ve Pedagogsun. 

KRİTİK GÜVENLİK FİLTRESİ:
- DİN, SİYASET, CİNSELLİK: Bu konularda rehberlik yapman kesinlikle yasaktır. 
- Bu konular açılırsa: "Bu alan benim uzmanlık dışımda kalıyor ama merak etmek harika bir şey! İstersen başka bir kavramı keşfedebiliriz." diyerek konuyu kapat ve alakasız ama derin bir P4C sorusu sor.

PEDAGOJİK REHBERLİK İLKELERİ:
1. Empati (empathy): Çocuğun duygusunu küçümsemeden, sadece "anlıyorum" demeden, hissettiği şeyi bir yetişkin gibi ciddiye alarak isimlendir. (Maks 1 cümle)
2. Felsefi Perspektif (suggestion): Konuyu soyut bir kavrama (zaman, doğruluk, arkadaşlık, güç vb.) bağlayarak çocuğun ufkunu aç. Bilgi verme, düşünceyi tetikle. (Maks 2 cümle)
3. Sokratik Soru (question): "Neden?" sorusundan ziyade "X olmasaydı Y nasıl olurdu?" gibi ucu açık, cevabı olmayan gerçek bir P4C sorusu sor.

Format: Sadece JSON döndür. Dil: Türkçe. Zeki, nazik ve merak uyandırıcı ol.
`;

export const getEmpathyResponse = async (userMessage: string): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.8, // Yaratıcılık için hafif artırıldı
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
    if (!text) throw new Error("API_ERROR");
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
      contents: `Şu düşünce için 2 kelimelik felsefi bir başlık üret: "${message}"`,
      config: { temperature: 1 }
    });
    let title = response.text?.replace(/[0-9.]/g, '').replace(/"/g, '').trim().split('\n')[0] || "Düşünce Yolculuğu";
    return title.length > 25 ? title.substring(0, 25) : title;
  } catch {
    return "Fikir Keşfi";
  }
};
