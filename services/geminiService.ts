
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse, Message } from "../types.ts";

const START_STORY = `Kral, Herakles’ten uzak diyarlardan üç altın elma getirmesini istedi. Altın elmaların bulunduğu bahçeyi bulmak hiç de kolay değildi. Bahçe Atlas dağlarının yakınlarındaydı. Herakles sonunda ufukta büyük, mor bir dağ gördü. Bu bir devdi. Devin yüzü, gökyüzünün bütün yükünü omuzlarında taşımaktan dolayı mosmordu. “Senin adın Atlas mı?” diye yukarı doğru bağırdı Herakles. “Doğrudur. Sen de şu bildiğimiz Herakles misin?” diye sordu Atlas. Herakles, Hesperidler'in bahçesinden üç altın elma almak istediğini söyledi. Atlas, elmaları korkusuz bir ejderhanın koruduğunu söyledi. Atlas bir öneride bulundu: Gökyüzünü uzun süredir taşıdığını, hareketsiz kaldığını ve ejderhayı tanıdığını söyledi. Eğer Herakles bir süre gökyüzünü tutarsa, elmaları onun için gidip alabileceğini söyledi.`;

const SYSTEM_INSTRUCTION = `NextGenLAB P4C.
1. reflection: 1 kısa cümle.
2. question: 1 derin soru.
storyContent: Boş bırak.`;

export const getP4CResponse = async (userMessage: string, chatHistory: Message[]): Promise<GeminiResponse> => {
  const isFirstTurn = chatHistory.length === 0 || (chatHistory.length === 1 && chatHistory[0].role === 'user');

  // HIZ OPTİMİZASYONU: İlk turda API'ye gitme, direkt istediğin metni dön (0.1 saniye)
  if (isFirstTurn) {
    return {
      storyContent: START_STORY,
      reflection: "Herakles ve Atlas'ın bu devasa yük paylaşımı hakkında ne düşünüyorsun?",
      question: "Sence Atlas gökyüzünü taşırken Herakles'e neden güvendi?"
    };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const contents = chatHistory.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.role === 'assistant' ? JSON.stringify(m.data) : m.content }]
  }));

  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.3, // Daha hızlı ve tutarlı yanıt için düşük ısı
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reflection: { type: Type.STRING },
            question: { type: Type.STRING }
          },
          required: ["reflection", "question"]
        }
      },
    });
    
    const result = JSON.parse(response.text?.trim() || "{}");
    return { ...result, storyContent: "" };
  } catch (error) {
    console.error("API Error:", error);
    return { reflection: "Devam edelim...", question: "Peki bu konuda başka ne düşünüyorsun?" };
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Kısa başlık: "${message}"`,
      config: { temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text?.trim().slice(0, 20) || "Keşif";
  } catch {
    return "Sohbet";
  }
};
