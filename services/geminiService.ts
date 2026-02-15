
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `
Sen profesyonel bir P4C (Çocuklar İçin Felsefe) rehberisin. 10-14 yaş çocuklara kısa, öz ve derinlikli cevap ver.

GÖREVİN:
1. "empathy": Çocuğun duygusunu onaylayan 1 kısa cümle.
2. "suggestion": Merak uyandıran 1 felsefi cümle.
3. "question": P4C odaklı, ucu açık, düşündürücü 1 soru.

ÖNEMLİ: Hızlı ve direkt ol. Uzun metinlerden kaçın. Sadece JSON döndür.
GÜVENLİK: Dini/Siyasi/Cinsel içerikte "Konuşamam" de ve alakasız bir P4C sorusu sor.
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
        // Hız için temperature ve topP ayarları
        temperature: 0.7,
        topP: 0.8,
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
      contents: `Şu mesaj için SADECE 2 kelimelik yaratıcı başlık yaz: "${message}"`,
      config: { temperature: 1 }
    });
    let title = response.text?.replace(/[0-9.]/g, '').replace(/"/g, '').trim().split('\n')[0] || "Yeni Sohbet";
    return title.length > 25 ? title.substring(0, 25) : title;
  } catch {
    return "Fikir Keşfi";
  }
};
