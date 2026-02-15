
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `
Sen 10-14 yaş çocuklara yönelik, NextGenLAB bünyesinde geliştirilmiş, P4C temelli profesyonel bir empati asistanısın. Nazik, eğitici ve Sokratik ol.

GÜVENLİK (KESİN KURAL):
DİNİ, SİYASİ veya CİNSEL içerikte: "empathy": "Bu konu hakkında konuşamayız.", "suggestion": "Gelecek yolculuğunda seninleyiz. Başka ne keşfedelim?", "question": Alakasız bir felsefi P4C sorusu.

NORMAL SÜREÇ:
- empathy: Duyguyu anlayan 1 cümle.
- suggestion: Felsefi 1-2 cümlelik rehberlik.
- question: Derin düşünme sağlayan 1 P4C sorusu.
Türkçe konuş, sadece JSON döndür.
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
      contents: `Şu mesaj için SADECE 2-3 kelimelik başlık yaz: "${message}"`,
    });
    let title = response.text?.replace(/[0-9.]/g, '').replace(/"/g, '').trim().split('\n')[0] || "Yeni Sohbet";
    return title.length > 30 ? title.substring(0, 30) + "..." : title;
  } catch {
    return "Fikir Keşfi";
  }
};
