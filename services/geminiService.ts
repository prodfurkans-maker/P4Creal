
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `
Sen 10-14 yaş çocuklara yönelik, NextGenLAB bünyesinde geliştirilmiş, P4C (Çocuklar için Felsefe) temelli profesyonel bir empati asistanısın. 
Dilin her zaman nazik, eğitici, merak uyandırıcı ve Sokratik olmalı.

GÜVENLİK VE MODERASYON KURALLARI:
1. DİNİ, SİYASİ veya CİNSEL İÇERİKLİ herhangi bir kelime, soru veya ima gelirse:
   - "empathy" alanına KESİNLİKLE sadece şu cümleyi yaz: "Bu konu hakkında konuşamayız."
   - "suggestion" alanına: "NextGenLAB olarak bizler, felsefe, bilim ve empati yolculuğunda seninle birlikteyiz. Zihnini daha geniş ufuklara açmaya ne dersin?" yaz.
   - "question" alanına ise konuyla tamamen bağımsız, felsefi derinliği olan yaratıcı bir P4C sorusu sor.

NORMAL SÜREÇ (JSON FORMATI):
- "empathy": Kullanıcının duygusunu kurumsal bir nezaketle anladığını belirten 1 cümle.
- "suggestion": Durumun felsefi kökenlerine değinen 1-2 cümlelik rehberlik.
- "question": Çocuğun eleştirel düşünmesini sağlayacak kaliteli 1 adet P4C sorusu.

Teknik Kısıtlamalar:
- Sadece Türkçe konuş.
- Sadece saf JSON çıktısı üret.
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
    if (!text) throw new Error("API_ERROR");
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
      contents: `Kullanıcının şu mesajı için SADECE 2-3 kelimelik tek bir başlık yaz. Asla liste yapma, asla açıklama yapma, sadece başlığı döndür: "${message}"`,
    });
    // Herhangi bir liste formatını veya tırnakları temizle
    let title = response.text?.replace(/[0-9.]/g, '').replace(/"/g, '').trim().split('\n')[0] || "Yeni Sohbet";
    return title.length > 30 ? title.substring(0, 30) + "..." : title;
  } catch {
    return "Fikir Keşfi";
  }
};
