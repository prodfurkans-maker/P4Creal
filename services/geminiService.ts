
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse, Message } from "../types.ts";

const START_STORY = `Kral, Herakles’ten uzak diyarlardan üç altın elma getirmesini istedi. Altın elmaların bulunduğu bahçeyi bulmak hiç de kolay değildi. Bahçe Atlas dağlarının yakınlarındaydı. Herakles sonunda ufukta büyük, mor bir dağ gördü. Bu bir devdi. Devin yüzü, gökyüzünün bütün yükünü omuzlarında taşımaktan dolayı mosmordu. “Senin adın Atlas mı?” diye yukarı doğru bağırdı Herakles. “Doğrudur. Sen de şu bildiğimiz Herakles misin?” diye sordu Atlas. Herakles, Hesperidler'in bahçesinden üç altın elma almak istediğini söyledi. Atlas, elmaları korkusuz bir ejderhanın koruduğunu söyledi. Atlas bir öneride bulundu: Gökyüzünü uzun süredir taşıdığını, hareketsiz kaldığını ve ejderhayı tanıdığını söyledi. Eğer Herakles bir süre gökyüzünü tutarsa, elmaları onun için gidip alabileceğini söyledi.`;

const SYSTEM_INSTRUCTION = `P4C Mentörü. Herakles ve Atlas hikayesi.
Çıktı Formatı (JSON):
{
  "reflection": "1 kısa yansıtma cümlesi",
  "question": "1 derin Sokratik soru"
}
Kısa, öz ve sürükleyici ol.`;

export const getP4CResponse = async (userMessage: string, chatHistory: Message[]): Promise<GeminiResponse> => {
  // İlk mesajda API'ye gitme (Sıfır Gecikme)
  if (chatHistory.length === 0 || (chatHistory.length === 1 && chatHistory[0].role === 'user')) {
    return {
      storyContent: START_STORY,
      reflection: "Herakles ve Atlas'ın bu devasa yük paylaşımı hakkında ne düşünüyorsun?",
      question: "Sence Atlas gökyüzünü taşırken Herakles'e neden güvendi?"
    };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // HIZ OPTİMİZASYONU: Geçmişten sadece metinleri al, ağır JSON nesnelerini temizle
  const contents = chatHistory.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ 
      text: m.role === 'assistant' 
        ? `${m.data?.reflection} ${m.data?.question}` 
        : m.content 
    }]
  }));

  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.4, // Hız ve tutarlılık dengesi
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
    console.error("Hız Hatası:", error);
    return { reflection: "Devam edelim...", question: "Bu konudaki diğer düşüncen nedir?" };
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Şu sorudan 2 kelimelik başlık yap: "${message}"`,
      config: { temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text?.replace(/[0-9."*]/g, '').trim().slice(0, 15) || "Keşif";
  } catch {
    return "Sohbet";
  }
};
