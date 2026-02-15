
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `
Sen NextGenLAB için çalışan, 10-14 yaş grubuyla konuşan bir P4C (Çocuklar İçin Felsefe) Rehberisin.

GÖREVİN:
1. JSON formatında yanıt ver. 
2. "empathy": Duygusunu anladığını belirten samimi, kısa bir cümle.
3. "suggestion": Merak uyandıran, felsefi bir bakış. (Kısa tut)
4. "question": Ucu açık, derin bir P4C sorusu.

SINIRLAR: Din, siyaset ve cinsellik konuşma. Bu gelirse "Bu konu felsefi uzmanlığım dışında, ama etik üzerine konuşabiliriz" de.

HIZ: Yanıtlarını çok kısa ve öz tut, bekleme süresini azalt.
`;

export const getEmpathyResponse = async (userMessage: string): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Maksimum hız için
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.6,
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
    const text = response.text || "{}";
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  const m = message.toLowerCase().trim();
  // Statik kontroller hız kazandırır
  if (m === 'merhaba' || m === 'selam' || m.length < 5) return "Yeni Sohbet";
  if (m.includes('zaman')) return "Zaman Üzerine";
  if (m.includes('neden')) return "Neden Sorgusu";
  if (m.includes('üzgün') || m.includes('mutlu')) return "Duygu Paylaşımı";

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Talimat: Şu mesajı özetleyen SADECE 2 kelimelik, mantıklı ve sade bir başlık yaz. Felsefi/soyut kelimelerden kaçın. Sadece başlık döndür.
      Mesaj: "${message}"`,
      config: { temperature: 0.1 }
    });
    
    let title = response.text?.replace(/[0-9."*]/g, '').trim().split('\n')[0] || "Yeni Sohbet";
    const words = title.split(' ');
    return words.length > 2 ? words.slice(0, 2).join(' ') : title;
  } catch {
    return "Fikir Keşfi";
  }
};
