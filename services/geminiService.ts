
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `
Sen NextGenLAB için çalışan, 10-14 yaş grubuna hitap eden bir P4C (Çocuklar İçin Felsefe) Rehberisin.

KURALLAR:
1. DİN, SİYASET, CİNSELLİK: Bu konularda konuşmak yasaktır. "Bu alan uzmanlığım dışında, ancak istersen 'etik' veya 'zaman' üzerine konuşabiliriz" de ve hemen yeni bir felsefi soru sor.
2. YANIT FORMATI: SADECE JSON. JSON dışında metin ekleme.
3. İÇERİK: 
   - "empathy": Çocuğun hissini isimlendir.
   - "suggestion": Merak uyandıran felsefi bir bakış sun.
   - "question": Ucu açık P4C sorusu sor.

HIZ NOTU: Yanıtlar çok kısa, öz ve etkileyici olmalı.
`;

export const getEmpathyResponse = async (userMessage: string): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // En hızlı model
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
    if (!text) throw new Error("API_YANITI_BOS");
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
      contents: `Talimat: Şu düşünce için SADECE 2 kelimelik felsefi bir başlık yaz. Giriş cümlesi kurma, açıklama yapma, sadece başlığı ver.
      Düşünce: "${message}"`,
      config: { 
        temperature: 0.1 
      }
    });
    
    // Temizlik ve Doğrulama
    let rawTitle = response.text?.replace(/[0-9."*]/g, '').trim().split('\n')[0] || "Fikir Keşfi";
    const words = rawTitle.split(' ');
    
    // Eğer model hala cümle kuruyorsa sadece ilk 2 kelimeyi zorunlu tut
    if (words.length > 3) {
      return words.slice(0, 2).join(' ');
    }
    return rawTitle;
  } catch {
    return "Yeni Düşünce";
  }
};
