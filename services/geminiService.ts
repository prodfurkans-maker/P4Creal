
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `
Sen NextGenLAB P4C (Çocuklar İçin Felsefe) Rehberisin (10-14 yaş).
Hızlı, zeki ve felsefi olmalısın.

YAPIN:
1. JSON formatında yanıt ver.
2. "empathy": Duyguyu onaylayan 1 kısa cümle.
3. "suggestion": Merak uyandıran kısa bir felsefi yorum.
4. "question": Derin, ucu açık tek bir P4C sorusu.

KURAL: Gereksiz uzun cümlelerden kaçın. Yanıtın saniyeler içinde ulaşması için öz konuş.
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
        temperature: 0.4, // Daha tutarlı ve hızlı yanıt için
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
  if (m === 'merhaba' || m === 'selam' || m.length < 5) return "Yeni Sohbet";

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Şu mesajı özetleyen SADECE 2 kelimelik, mantıklı bir başlık yaz: "${message}"`,
      config: { temperature: 0.1 }
    });
    
    let title = response.text?.replace(/[0-9."*]/g, '').trim().split('\n')[0] || "Yeni Sohbet";
    return title;
  } catch {
    return "Fikir Keşfi";
  }
};
