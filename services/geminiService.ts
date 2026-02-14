
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types";

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
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API yapılandırması hatalı.");
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

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Şu an bağlantı kurulamıyor, lütfen tekrar dene.");
  }
};
