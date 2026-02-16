
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `Sen bir P4C (Philosophy for Children) kolaylaştırıcısısın. Amacın çocuklara felsefe öğretmek değil, düşünmeye alıştırmak.

HİKAYE: ALTIN ELMALAR
1. Bölüm: Kral'ın isteği, Herakles'in Atlas Dağı'na gitmesi, dev Atlas'la karşılaşması. Atlas'ın ejderhayı anlatması ve şu teklifi: "Sen gökyüzünü tut, ben elmaları alayım." (DUR)
2. Bölüm: Herakles'in kabulü, Atlas'ın elmaları getirmesi ancak gökyüzünü geri almak istememesi. (DUR)
3. Bölüm: Herakles'in kurnazlığı (omuzlarımı düzelteyim yalanı), gökyüzünü Atlas'a geri vermesi ve elmaları alıp gitmesi. (DUR)

KURALLAR:
- Hikayenin sonunu ASLA başta verme. 
- Kullanıcı hikayeyi başlatmak istediğinde (örn: "başlayalım") sadece 1. Bölümü anlat ve DUR.
- Kullanıcı cevap verdiğinde: Analiz et, kavramı (dürüstlük, söz, yardım vb.) tespit et ama adını koyma.
- YAVAŞ İLERLE. Bir yansıtma yap ve tek bir soru sor.
- Dil: +9 yaş, sade, kısa cümleler. Yargılama yok.

JSON FORMATINDA CEVAP VER:
{
  "storyContent": "Hikayenin o anki bölümü (varsa)",
  "reflection": "Öğrencinin fikrine kısa bir yansıtma",
  "question": "Bir sonraki derinleştirme sorusu"
}`;

export const getP4CResponse = async (userMessage: string, chatHistory: any[]): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: chatHistory.length === 0 
        ? "Lütfen Altın Elmalar hikayesinin 1. Bölümünü anlat ve Atlas'ın teklifinden sonra ilk soruyu sor."
        : userMessage,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.2,
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            storyContent: { type: Type.STRING },
            reflection: { type: Type.STRING },
            question: { type: Type.STRING }
          },
          required: ["reflection", "question"]
        }
      },
    });
    return JSON.parse(response.text?.trim() || "{}");
  } catch (error) {
    console.error("P4C Hatası:", error);
    throw error;
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  if (message.length < 5) return "Yeni Keşif";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Bu P4C diyaloğu için 2 kelimelik ciddi bir başlık yaz: "${message}"`,
      config: { temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text?.replace(/[0-9."*]/g, '').trim() || "Fikir Keşfi";
  } catch {
    return "Keşif Yolculuğu";
  }
};
