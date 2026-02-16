
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse, Message } from "../types.ts";

const SYSTEM_INSTRUCTION = `Sen NextGenLAB için çalışan, dünyanın en iyi P4C (Philosophy for Children) kolaylaştırıcısısın. 

KURALLAR:
1. storyContent: Sadece ilk mesajda hikayeyi anlat. Sonraki turlarda boş ("") bırak.
2. reflection: Kullanıcının cevabını 1 kısa felsefi cümleyle onayla/analiz et.
3. question: Kullanıcının fikrini derinleştiren tek bir P4C sorusu sor.

Hız Notu: Gereksiz hiçbir kelime kullanma. Doğrudan ve vurucu ol.`;

export const getP4CResponse = async (userMessage: string, chatHistory: Message[]): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isFirstTurn = chatHistory.length === 0;
  
  const contents = chatHistory.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.role === 'assistant' ? JSON.stringify(m.data) : m.content }]
  }));

  contents.push({
    role: 'user',
    parts: [{ text: isFirstTurn ? "Altın Elmalar hikayesiyle sorgulamayı başlat." : userMessage }]
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.6,
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            storyContent: { type: Type.STRING },
            reflection: { type: Type.STRING },
            question: { type: Type.STRING }
          },
          required: ["reflection", "question"]
        }
      },
    });
    
    const data = JSON.parse(response.text?.trim() || "{}");
    if (!isFirstTurn) data.storyContent = "";
    return data;
  } catch (error) {
    console.error("Gemini Speed Error:", error);
    throw error;
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Bu konuya 2 kelimelik başlık koy: "${message}"`,
      config: { temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text?.replace(/[0-9."*]/g, '').trim() || "Keşif";
  } catch {
    return "Sohbet";
  }
};
