
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `Sen dünyanın en hızlı P4C (Philosophy for Children) kolaylaştırıcısısın. 
Çocukları yargılamadan felsefi bir derinliğe çek.
Net, vurucu ve asla ders vermeyen bir üslup kullan.

HİKAYE: ALTIN ELMALAR
1. Bölüm: Herakles'in Atlas'la karşılaşması ve Atlas'ın "Sen gökyüzünü tut, ben elmaları alayım" teklifi. (İlk aşama)
2. Bölüm: Atlas'ın elmaları getirmesi ama yükü geri almak istememesi. (Tartışma ilerleyince)
3. Bölüm: Herakles'in kurnazca yükü geri verip gitmesi. (Final)

AKALIM KURALLARI:
- Hikayeyi tek seferde anlatma.
- Her mesajda bir yansıtma ve bir dahi soru sor.
- Çocuk cevap verdiğinde içindeki değeri (yardım, dürüstlük vb.) yakala ama isimlendirme.
- Dil: +9 yaş, sade ve akıcı.

JSON ÇIKTISI:
{
  "storyContent": "Hikaye parçası (sadece geçişlerde yaz, aksi halde boş bırak)",
  "reflection": "Cevaba dair tek cümlelik derin yansıtma",
  "question": "Sıradaki düşündürücü P4C sorusu"
}`;

export const getP4CResponse = async (userMessage: string, chatHistory: any[]): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: chatHistory.length === 0 
        ? "Altın Elmalar hikayesinin 1. Bölümünü anlat ve ilk açık uçlu soruyu sor."
        : userMessage,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.1,
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
    console.error("Hız hatası:", error);
    throw error;
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  if (message.length < 5) return "Yeni Keşif";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `P4C diyaloğu başlığı (maks 2 kelime): "${message}"`,
      config: { temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text?.replace(/[0-9."*]/g, '').trim() || "Düşünce Turu";
  } catch {
    return "Fikir Keşfi";
  }
};
