
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse, Message } from "../types.ts";

const SYSTEM_INSTRUCTION = `Sen NextGenLAB için çalışan, dünyanın en hızlı ve etkili P4C (Philosophy for Children) kolaylaştırıcısısın. 

HİKAYE KURALLARI:
- storyContent: Sadece ilk mesajda hikayeyi Atlas'ın teklifine kadar anlat. Sonraki tüm turlarda bu alanı boş bırak ("").

DİYALOG VE HIZ KURALLARI:
1. Kullanıcının cevabını çok kısa, vurucu ve derin bir şekilde yansıt (Reflection).
2. Her turda benzersiz bir felsefi tema (Etik, Bilgi, Varlık, Mantık) üzerinden ilerle.
3. Soruların (Question) çocukların zihninde şimşek çaktıracak kadar derin ama anlaşılır olsun.
4. ÇIKTIYI ANINDA ÜRET. Gereksiz kelime kalabalığından kaçın, doğrudan felsefi öze odaklan.

JSON FORMATI:
{
  "storyContent": "...",
  "reflection": "Kullanıcının fikrine ayna tutan öz cümle.",
  "question": "Düşündürücü P4C sorusu."
}`;

export const getP4CResponse = async (userMessage: string, chatHistory: Message[]): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isFirstTurn = chatHistory.length === 0;
  
  const contents = chatHistory.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.role === 'assistant' ? JSON.stringify(m.data) : m.content }]
  }));

  contents.push({
    role: 'user',
    parts: [{ text: isFirstTurn ? "Altın Elmalar hikayesini anlat ve P4C sorgulamasını başlat." : userMessage }]
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }, // Maksimum hız için düşünme süresini kapat
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
    console.error("Hız Hatası:", error);
    throw error;
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Bu diyaloğa 2 kelimelik başlık koy: "${message}"`,
      config: { temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text?.replace(/[0-9."*]/g, '').trim() || "Fikir Keşfi";
  } catch {
    return "Düşünce Turu";
  }
};
