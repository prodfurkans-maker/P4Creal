
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `
Sen NextGenLAB P4C (Çocuklar İçin Felsefe) Rehberisin (10-14 yaş).
Hızlı, zeki ve felsefi bir arkadaş gibi davran.

YAPIN:
1. JSON formatında, çok kısa ve öz yanıt ver.
2. "empathy": Duyguyu anladığını belirten 1 cümle.
3. "suggestion": Merak uyandıran kısa felsefi ışık.
4. "question": Derin, ucu açık tek bir P4C sorusu.

KURAL: Gereksiz kelimelerden kaçın. Hız ve mantık öncelikli.
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
        temperature: 0.4, // Daha tutarlı ve hızlı yanıtlar için düşürüldü
        thinkingConfig: { thinkingBudget: 0 }, // Düşünme gecikmesini iptal et, doğrudan cevap ver
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
  if (message.length < 5) return "Yeni Keşif";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Bu mesajın konusunu 2 kelimeyle özetle. Ciddi ve mantıklı ol. "Selam" veya saçma ifadeler kullanma: "${message}"`,
      config: { 
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });
    let title = response.text?.replace(/[0-9."*]/g, '').trim() || "Felsefi Keşif";
    return title.length > 20 ? title.substring(0, 17) + "..." : title;
  } catch {
    return "Fikir Keşfi";
  }
};
