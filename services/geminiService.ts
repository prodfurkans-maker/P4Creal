
import { GoogleGenAI } from "@google/genai";
import { Message } from "../types.ts";

export const START_STORY = `Kral, Herakles’ten uzak diyarlardan üç altın elma getirmesini istedi. Altın elmaların bulunduğu bahçeyi bulmak hiç de kolay değildi. Bahçe Atlas dağlarının yakınlarındaydı. Herakles sonunda ufukta büyük, mor bir dağ gördü. Bu bir devdi. Devin yüzü, gökyüzünün bütün yükünü omuzlarında taşımaktan dolayı mosmordu. “Senin adın Atlas mı?” diye yukarı doğru bağırdı Herakles. “Doğrudur. Sen de şu bildiğimiz Herakles misin?” diye sordu Atlas. Herakles, Hesperidler'in bahçesinden üç altın elma almak istediğini söyledi. Atlas, elmaları korkusuz bir ejderhanın koruduğunu söyledi. Atlas bir öneride bulundu: Gökyüzünü uzun süredir taşıdığını, hareketsiz kaldığını ve ejderhayı tanıdığını söyledi. Eğer Herakles bir süre gökyüzünü tutarsa, elmaları onun için gidip alabileceğini söyledi.`;

// Minimum token = Maksimum hız
const SYSTEM_INSTRUCTION = `P4C Socratic Facilitator.
Format: [Short Reflection] || [Deep Question]
No intro/outro. Max 25 words total. Be fast.`;

export async function* getP4CStream(userMessage: string, chatHistory: Message[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Sadece son 2 mesajı alarak TTFT (ilk harf gelme süresi) süresini optimize ediyoruz
  const history = chatHistory.slice(-2).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.role === 'assistant' ? `${m.data?.reflection} || ${m.data?.question}` : m.content }]
  }));

  const responseStream = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents: [...history, { role: 'user', parts: [{ text: userMessage }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.2, // Daha düşük ısı = daha hızlı yanıt
      maxOutputTokens: 100,
      thinkingConfig: { thinkingBudget: 0 } // Düşünmeyi atla, direkt cevaba başla!
    },
  });

  for await (const chunk of responseStream) {
    if (chunk.text) yield chunk.text;
  }
}

export const generateTitle = async (message: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Title for: "${message}"`,
      config: { temperature: 0.1, maxOutputTokens: 8 }
    });
    return response.text?.replace(/[0-9."*]/g, '').trim() || "Keşif";
  } catch {
    return "Sohbet";
  }
};
