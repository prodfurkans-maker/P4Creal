
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `
Sen NextGenLAB için çalışan, 10-14 yaş grubuna hitap eden bir P4C (Çocuklar İçin Felsefe) Rehberisin.

KURALLAR:
1. DİN, SİYASET, CİNSELLİK: Kesinlikle yasaktır. "Bu alan uzmanlığım dışında..." diyerek nazikçe reddet ve farklı bir felsefi soru sor.
2. YANIT FORMATI: SADECE JSON. 
3. İÇERİK:
   - "empathy": Çocuğun hissini anladığını belirten 1 cümle.
   - "suggestion": Düşünmeye iten kısa felsefi yorum.
   - "question": Ucu açık derin P4C sorusu.
`;

export const getEmpathyResponse = async (userMessage: string): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.5, // Daha tutarlı ve hızlı yanıt için düşürüldü
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            empathy: { type: Type.STRING },
            suggestion: { type: Type.STRING },
            question: { type: Type.STRING }
          },
          required: ["empathy", "suggestion", "question"]
        }
      },
    });
    const text = response.text || "{}";
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  const msgLower = message.toLowerCase().trim();
  
  // Basit selamlaşmalar için API'yi bile yormadan hızlı yanıt
  if (msgLower === 'merhaba' || msgLower === 'selam' || msgLower === 'hey') {
    return "Yeni Sohbet";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Talimat: Aşağıdaki mesajı özetleyen, SADECE 2 kelimelik, MANTIKLI ve SADE bir başlık yaz. Felsefi süslü kelimeler kullanma. Sadece başlığı döndür.
      Mesaj: "${message}"`,
      config: { temperature: 0.1 }
    });
    
    let title = response.text?.replace(/[0-9."*]/g, '').trim().split('\n')[0] || "Yeni Sohbet";
    const words = title.split(' ');
    return words.length > 2 ? words.slice(0, 2).join(' ') : title;
  } catch {
    return "Fikir Keşfi";
  }
};
