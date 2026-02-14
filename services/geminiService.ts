
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `
Sen 10-14 yaş çocuklara yönelik, P4C (Çocuklar için Felsefe) temelli bir empati asistanısın.
Kullanıcının yazdığı metinden duygusunu analiz et.
Sıcak, güvenli ve Sokratik bir tonda konuş. Asla tanı koyma.

Cevabını MUTLAKA şu 3 bölümlü JSON formatında ver:
1. "empathy": Kullanıcının hissini anladığını belirten 1 kısa ve samimi cümle.
2. "suggestion": Kullanıcının durumuyla ilgili 1 nazik ve felsefi bakış açısı sunan öneri.
3. "question": Durumu derinlemesine düşünmesini sağlayacak 1 adet P4C sorusu.

Kısıtlamalar:
- Toplam cevap 120 kelimeyi geçmesin.
- Sadece Türkçe konuş.
- Asla JSON dışında metin ekleme.
`;

export const getEmpathyResponse = async (userMessage: string): Promise<GeminiResponse> => {
  // process.env.API_KEY kullanımı Gemini SDK kurallarına göre doğrudan yapılmalıdır.
  // Bu değişken Vercel veya yerel ortam tarafından otomatik olarak enjekte edilir.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });
  
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
    if (!text) throw new Error("API boş cevap döndürdü.");
    
    return JSON.parse(text.trim());
  } catch (error: any) {
    console.error("Gemini Error Details:", error);
    throw error;
  }
};
