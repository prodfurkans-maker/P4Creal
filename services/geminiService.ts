
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse, Message } from "../types.ts";

const SYSTEM_INSTRUCTION = `Sen NextGenLAB P4C asistanısın. Görevin çocuklarla felsefi sorgulama yapmak.

KURALLAR:
1. storyContent: Sadece ilk mesajda hikayeyi anlat (kısa ve öz). Sonraki turlarda boş ("") bırak.
2. reflection: Kullanıcının fikrini 1-2 cümleyle felsefi olarak onayla/yansıt.
3. question: Tek bir derin P4C sorusu sor.

Hız için: Gereksiz detaydan kaçın, JSON formatına sadık kal.`;

export const getP4CResponse = async (userMessage: string, chatHistory: Message[]): Promise<GeminiResponse> => {
  // Her çağrıda yeni instance oluşturmak güncel API key kullanımını garanti eder.
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
      model: "gemini-3-flash-preview", // En hızlı model
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.6,
        thinkingConfig: { thinkingBudget: 0 }, // Düşünme süresini kapatarak hızı artırıyoruz
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
    
    // .text özelliği üzerinden veriyi alıyoruz
    const data = JSON.parse(response.text?.trim() || "{}");
    if (!isFirstTurn) data.storyContent = "";
    return data;
  } catch (error) {
    console.error("Hız Hatası:", error);
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
