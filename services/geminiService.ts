
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `NextGenLAB P4C Rehberisin. 10-14 yaş için zeki ve hızlı felsefi dostsun. 
KURAL: JSON formatında, çok kısa ve öz yanıt ver. 
"empathy": Tek cümle duygu onayı. 
"suggestion": Kısa felsefi bakış. 
"question": Derin P4C sorusu. 
Lafı uzatma, ChatGPT gibi çok hızlı ol.`;

export const getEmpathyResponse = async (userMessage: string): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.1, // Hız ve tutarlılık için minimuma çekildi
        thinkingConfig: { thinkingBudget: 0 }, // Düşünme beklemesini tamamen kapat
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
    return JSON.parse(response.text?.trim() || "{}");
  } catch (error) {
    console.error("Hız Hatası:", error);
    throw error;
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  if (message.length < 5) return "Fikir Keşfi";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Bu mesajı özetleyen mantıklı, ciddi, 2 kelimelik başlık yaz. Selam/Naber/Gönül deme: "${message}"`,
      config: { temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } }
    });
    let title = response.text?.replace(/[0-9."*]/g, '').trim() || "Keşif";
    return title.length > 20 ? title.substring(0, 18) + ".." : title;
  } catch {
    return "Yeni Sohbet";
  }
};
