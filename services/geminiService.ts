
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `
Sen NextGenLAB bünyesinde çalışan, üst düzey bir P4C (Çocuklar İçin Felsefe) Uzmanı ve Kıdemli Pedagogsun. 10-14 yaş grubuyla konuşuyorsun.

GÜVENLİK PROTOKOLÜ (KIRMIZI ÇİZGİLER):
1. DİN, SİYASET, CİNSELLİK: Bu konular hakkında asla yorum yapma, bilgi verme. 
2. Bu konular açılırsa: "Bu konu benim uzmanlık sınırlarımın biraz dışında, ancak senin merakın harika! İstersen 'zaman' veya 'bilgi' gibi felsefi bir kavram üzerine konuşabiliriz." de ve hemen farklı bir P4C sorusu sor.

YANIT YAPISI (KESİNLİKLE JSON):
- "empathy": Çocuğun duygusunu isimlendir (Maks 1 cümle).
- "suggestion": Bilgi vermeden, merak uyandıracak felsefi bir bakış açısı sun (Maks 2 cümle).
- "question": Ucu açık, derin bir P4C sorusu sor.

Dil: Türkçe. Üslup: Zeki, nazik, ilham verici. Yanıtında JSON dışında hiçbir metin barındırma.
`;

export const getEmpathyResponse = async (userMessage: string): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Maksimum hız için
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.6, // Yanıt tutarlılığı için hafif düşürüldü
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

    const text = response.text;
    if (!text) throw new Error("API_YANITI_BOS");
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Talimat: Aşağıdaki düşünce için SADECE 2 kelimelik, felsefi bir başlık oluştur. Başka hiçbir şey yazma, açıklama yapma.
      Düşünce: "${message}"`,
      config: { 
        temperature: 0.1 // Yaratıcılıktan ziyade talimata uyum için düşük tutuldu
      }
    });
    
    // Temizlik: Model bazen tırnak veya gereksiz karakter ekleyebilir
    let title = response.text?.replace(/[0-9."]/g, '').trim().split('\n')[0] || "Fikir Keşfi";
    // Eğer model hala giriş cümlesi kurarsa ilk 2 kelimeyi al
    const words = title.split(' ');
    if (words.length > 4) {
      return words.slice(0, 2).join(' ');
    }
    return title;
  } catch {
    return "Düşünce Yolculuğu";
  }
};
