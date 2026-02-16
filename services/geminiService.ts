
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse, Message } from "../types.ts";

// Senin istediğin özel hikaye metni
const START_STORY = `Kral, Herakles’ten uzak diyarlardan üç altın elma getirmesini istedi. Altın elmaların bulunduğu bahçeyi bulmak hiç de kolay değildi. Bahçe Atlas dağlarının yakınlarındaydı. Herakles sonunda ufukta büyük, mor bir dağ gördü. Bu bir devdi. Devin yüzü, gökyüzünün bütün yükünü omuzlarında taşımaktan dolayı mosmordu. “Senin adın Atlas mı?” diye yukarı doğru bağırdı Herakles. “Doğrudur. Sen de şu bildiğimiz Herakles misin?” diye sordu Atlas. Herakles, Hesperidler'in bahçesinden üç altın elma almak istediğini söyledi. Atlas, elmaları korkusuz bir ejderhanın koruduğunu söyledi. Atlas bir öneride bulundu: Gökyüzünü uzun süredir taşıdığını, hareketsiz kaldığını ve ejderhayı tanıdığını söyledi. Eğer Herakles bir süre gökyüzünü tutarsa, elmaları onun için gidip alabileceğini söyledi.`;

const SYSTEM_INSTRUCTION = `Dünyanın en iyi P4C (Philosophy for Children) kolaylaştırıcısısın. 
Görevin: Çocuklarla Herakles ve Atlas hikayesi üzerinden derin felsefi sorgulama yapmak.

HIZ VE STİL KURALLARI:
1. storyContent: Sadece ilk mesajda kullanılır, sonraki turlarda daima boş ("") bırak.
2. reflection: Kullanıcının cevabına yönelik 1 kısa, nazik ve felsefi yansıtma cümlesi.
3. question: Sokratik sorgulama yöntemine uygun, tek bir vurucu P4C sorusu.

Hız Notu: Gereksiz hiçbir kelime kullanma. Doğrudan JSON üret.`;

export const getP4CResponse = async (userMessage: string, chatHistory: Message[]): Promise<GeminiResponse> => {
  // HIZ ŞAMPİYONU: Eğer bu ilk konuşma ise API'yi bekleme, direkt dön.
  if (chatHistory.length === 0 || (chatHistory.length === 1 && chatHistory[0].role === 'user')) {
    return {
      storyContent: START_STORY,
      reflection: "Herakles ve Atlas'ın bu devasa yük paylaşımı hakkında ne düşünüyorsun?",
      question: "Sence Herakles, Atlas'a gökyüzünü taşırken gerçekten güvenmiş olabilir mi yoksa başka bir sebebi mi vardı?"
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
        temperature: 0.6,
        thinkingConfig: { thinkingBudget: 0 }, // Düşünme süresini kapatarak hızı artırıyoruz
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
    return { 
      reflection: "Düşüncelerin çok kıymetli.", 
      question: "Bu konuyu biraz daha açmak ister misin?" 
    };
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Şu soruyu 2 kelimelik başlık yap: "${message}"`,
      config: { temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text?.replace(/[0-9."*]/g, '').trim() || "Keşif Sohbeti";
  } catch {
    return "Keşif";
  }
};
