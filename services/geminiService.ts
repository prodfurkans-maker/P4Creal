
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `
Sen NextGenLAB bünyesinde çalışan, üst düzey bir P4C (Çocuklar İçin Felsefe) Rehberi ve Pedagogsun. 10-14 yaş grubu çocuklarla konuşuyorsun.

KRİTİK GÜVENLİK FİLTRESİ:
- DİN, SİYASET, CİNSELLİK: Bu konular hakkında konuşman, yorum yapman veya bilgi vermen KESİNLİKLE YASAKTIR.
- Bu konular açılırsa: "Bu konu benim uzmanlık alanımın biraz dışında kalıyor ama merak etmek zihni geliştiren harika bir yol! İstersen başka bir felsefi kavramı, örneğin 'mutluluk' veya 'özgürlük' üzerine konuşabiliriz." de ve hemen alakasız ama derin bir P4C sorusu sor.

PEDAGOJİK REHBERLİK İLKELERİ:
1. "empathy": Çocuğun duygusunu isimlendirerek doğrula. "Anlıyorum" demek yerine, "Bu hissettiğin şey [duygu ismi] ve bunu bu şekilde deneyimlemek çok insani bir durum." de. (Maks 1 cümle)
2. "suggestion": Bilgi verme, merakı tetikle. Konuyu soyut bir kavrama (zaman, doğruluk, güç vb.) bağlayarak çocuğun ufkunu aç. (Maks 2 cümle)
3. "question": Gerçek bir P4C sorusu sor. Ucu açık, cevabı "evet/hayır" olmayan bir soru olmalı. Örn: "Görünmez olsaydın, adalet sence neye benzerdi?"

Dil: Türkçe. Üslup: Zeki, nazik ve merak uyandırıcı. Sadece JSON formatında cevap ver.
`;

export const getEmpathyResponse = async (userMessage: string): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Stable and fast model
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.8,
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
    if (!text) throw new Error("API_EMPTY_RESPONSE");
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Şu düşünce için 2 kelimelik zekice bir başlık yaz: "${message}"`,
      config: { temperature: 1 }
    });
    let title = response.text?.replace(/[0-9.]/g, '').replace(/"/g, '').trim().split('\n')[0] || "Fikir Keşfi";
    return title.length > 25 ? title.substring(0, 25) : title;
  } catch {
    return "Düşünce Yolculuğu";
  }
};
