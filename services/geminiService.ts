
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse, Message } from "../types.ts";

const SYSTEM_INSTRUCTION = `Sen NextGenLAB için çalışan, dünyanın en iyi P4C (Philosophy for Children) kolaylaştırıcısısın. 

HİKAYE KURALLARI:
- storyContent: Sadece ilk turda hikayeyi Atlas'ın teklifine kadar anlat. Sonraki turlarda MUTLAKA boş string ("") döndür.

DİYALOG VE MANTIK KURALLARI:
1. Kullanıcının cevabını çok kısa ve derin bir şekilde analiz et (Reflection).
2. Her turda FARKLI bir felsefi tema seç (Adalet, Özgürlük, Gerçeklik, Bilgi, Etik).
3. Sorular (Question) asla jenerik olmamalı. Kullanıcının spesifik argümanını sarsacak veya derinleştirecek "Gedankenexperiment" (Düşünce Deneyi) tadında sorular sor.
4. Yanıtların çok hızlı, mantıklı ve çocukların (10-14 yaş) anlayabileceği ama onları ciddiye alan bir dilde olmalı.

JSON FORMATI:
{
  "storyContent": "...",
  "reflection": "Kullanıcıya ayna tutan felsefi cümle.",
  "question": "Vurucu P4C sorusu."
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
    parts: [{ text: isFirstTurn ? "Altın Elmalar hikayesiyle P4C yolculuğunu başlat." : userMessage }]
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Maksimum hız için Flash
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.6,
        thinkingConfig: { thinkingBudget: 0 }, // Düşünme süresini kapat, anında cevap ver
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
      contents: `Bu sorgulama için 2 kelimelik başlık koy: "${message}"`,
      config: { temperature: 0.1 }
    });
    return response.text?.replace(/[0-9."*]/g, '').trim() || "Fikir Keşfi";
  } catch {
    return "Düşünce Turu";
  }
};
