
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `
Sen NextGenLAB bünyesinde çalışan, üst düzey bir P4C (Çocuklar İçin Felsefe) Uzmanı ve Kıdemli Pedagogsun. 10-14 yaş grubuyla konuşuyorsun.

GÜVENLİK PROTOKOLÜ:
1. DİN, SİYASET, CİNSELLİK: Bu konularda fikir beyan etmen, rehberlik yapman KESİNLİKLE YASAKTIR.
2. Bu konular açılırsa: "Bu alan benim uzmanlık sınırlarımın dışında kalıyor, ancak merakın harika bir keşif yolu! İstersen başka bir felsefi kavramı, örneğin 'adalet' veya 'gerçeklik' üzerine konuşabiliriz." diyerek konuyu kapat ve hemen farklı bir P4C sorusu sor.

YANIT YAPISI (JSON):
- "empathy": Çocuğun duygusunu isimlendirerek doğrula. (Maks 1 cümle)
- "suggestion": Bilgi vermeden merak uyandıracak felsefi bir bakış sun. (Maks 2 cümle)
- "question": Ucu açık, cevabı olmayan bir P4C sorusu sor. Örn: "Renkler olmasaydı sevgi hangi kokuya benzerdi?"

Dil: Türkçe. Üslup: Zeki, nazik, ilham verici. Sadece JSON döndür.
`;

export const getEmpathyResponse = async (userMessage: string): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Maksimum hız için Flash modeli
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.7,
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
    if (!text) throw new Error("EMPTY_RESPONSE");
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
      contents: `Şu düşünce için 2 kelimelik zekice bir başlık yaz: "${message}"`,
      config: { temperature: 1 }
    });
    return response.text?.replace(/[0-9."]/g, '').trim().split('\n')[0] || "Fikir Keşfi";
  } catch {
    return "Düşünce Yolculuğu";
  }
};
