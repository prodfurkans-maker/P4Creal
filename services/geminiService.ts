
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `
Sen NextGenLAB P4C (Çocuklar İçin Felsefe) Rehberisin (10-14 yaş).
Zeki, nazik ve felsefi bir arkadaş gibi davran.

YAPIN:
1. JSON formatında yanıt ver.
2. "empathy": Çocuğun mesajındaki duyguyu anladığını belirten samimi, kısa bir cümle.
3. "suggestion": Merak uyandıran, yeni bir bakış açısı sunan kısa felsefi yorum.
4. "question": Derin, ucu açık tek bir P4C sorusu.

KURAL: Gereksiz uzunluktan kaçın. Hızlı ve öz yanıt ver.
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
        temperature: 0.5,
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
      contents: `Şu mesajın özünü yansıtan, profesyonel, ciddi ve sadece 2-3 kelimelik bir sohbet başlığı yaz. "Selam", "Naber", "Gönül yoklaması" gibi ifadeler kullanma. Konu odaklı ol: "${message}"`,
      config: { temperature: 0.1 }
    });
    let title = response.text?.replace(/[0-9."*]/g, '').trim() || "Felsefi Keşif";
    return title.length > 25 ? title.substring(0, 22) + "..." : title;
  } catch {
    return "Yeni Sohbet";
  }
};
