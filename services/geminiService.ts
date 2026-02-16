
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse, Message } from "../types.ts";

const START_STORY = `Kral, Herakles’ten uzak diyarlardan üç altın elma getirmesini istedi. Altın elmaların bulunduğu bahçeyi bulmak hiç de kolay değildi. Bahçe Atlas dağlarının yakınlarındaydı. Herakles sonunda ufukta büyük, mor bir dağ gördü. Bu bir devdi. Devin yüzü, gökyüzünün bütün yükünü omuzlarında taşımaktan dolayı mosmordu. “Senin adın Atlas mı?” diye yukarı doğru bağırdı Herakles. “Doğrudur. Sen de şu bildiğimiz Herakles misin?” diye sordu Atlas. Herakles, Hesperidler'in bahçesinden üç altın elma almak istediğini söyledi. Atlas, elmaları korkusuz bir ejderhanın koruduğunu söyledi. Atlas bir öneride bulundu: Gökyüzünü uzun süredir taşıdığını, hareketsiz kaldığını ve ejderhayı tanıdığını söyledi. Eğer Herakles bir süre gökyüzünü tutarsa, elmaları onun için gidip alabileceğini söyledi.`;

const SYSTEM_INSTRUCTION = `P4C asistanısın. 
1. storyContent: SADECE ilk mesajda şu metni ver: "${START_STORY}". Sonraki turlarda boş ("") bırak.
2. reflection: 1 kısa cümlelik felsefi yansıtma.
3. question: Tek bir derin P4C sorusu.
Hız için sadece JSON dön.`;

export const getP4CResponse = async (userMessage: string, chatHistory: Message[]): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isFirstTurn = chatHistory.length === 0;
  
  const contents = chatHistory.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.role === 'assistant' ? JSON.stringify(m.data) : m.content }]
  }));

  contents.push({
    role: 'user',
    parts: [{ text: isFirstTurn ? "BAŞLAT" : userMessage }]
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.4,
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
    
    return JSON.parse(response.text?.trim() || "{}");
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
