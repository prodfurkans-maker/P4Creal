
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse, Message } from "../types.ts";

const START_STORY = `Kral, Herakles’ten uzak diyarlardan üç altın elma getirmesini istedi. Altın elmaların bulunduğu bahçeyi bulmak hiç de kolay değildi. Bahçe Atlas dağlarının yakınlarındaydı. Herakles sonunda ufukta büyük, mor bir dağ gördü. Bu bir devdi. Devin yüzü, gökyüzünün bütün yükünü omuzlarında taşımaktan dolayı mosmordu. “Senin adın Atlas mı?” diye yukarı doğru bağırdı Herakles. “Doğrudur. Sen de şu bildiğimiz Herakles misin?” diye sordu Atlas. Herakles, Hesperidler'in bahçesinden üç altın elma almak istediğini söyledi. Atlas, elmaları korkusuz bir ejderhanın koruduğunu söyledi. Atlas bir öneride bulundu: Gökyüzünü uzun süredir taşıdığını, hareketsiz kaldığını ve ejderhayı tanıdığını söyledi. Eğer Herakles bir süre gökyüzünü tutarsa, elmaları onun için gidip alabileceğini söyledi.`;

const SYSTEM_INSTRUCTION = `P4C Mentörü. Ultra-hızlı mod. 
Öğrenci cevabını analiz et, kısa bir derinlik kat ve tek bir Sokratik soru sor.
FORMAT: JSON { "reflection": "Kısa yansıtma", "question": "Derin soru" }
Kural: Maksimum 2 cümle.`;

export const getP4CResponse = async (userMessage: string, chatHistory: Message[]): Promise<GeminiResponse> => {
  // İlk mesaj: API'siz anlık yanıt
  if (chatHistory.length === 0 || (chatHistory.length === 1 && chatHistory[0].role === 'user')) {
    return {
      storyContent: START_STORY,
      reflection: "Herakles ve Atlas'ın bu yük paylaşımı üzerine biraz düşünelim.",
      question: "Sence Herakles, Atlas'a gökyüzünü taşırken güvenmekte haklı mıydı yoksa riskli bir karar mı verdi?"
    };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // HIZ OPTİMİZASYONU: Geçmişten JSON yapısını sil, sadece düz metin gönder.
  // Bu, token boyutunu %90 azaltır ve modelin saniyeler içinde cevap vermesini sağlar.
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
        temperature: 0.5,
        thinkingConfig: { thinkingBudget: 0 }, // Düşünme süresini kapat
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
      reflection: "Anlıyorum, bu çok ilginç bir bakış açısı.", 
      question: "Peki, bu durum sence bir adaletsizlik yaratır mı?" 
    };
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `2 kelimelik başlık yap: "${message}"`,
      config: { temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text?.replace(/[0-9."*]/g, '').trim().split(' ').slice(0, 2).join(' ') || "Keşif";
  } catch {
    return "Sohbet";
  }
};
