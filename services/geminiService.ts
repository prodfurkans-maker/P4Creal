
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `Sen dünyanın en hızlı ve etkili P4C (Philosophy for Children) kolaylaştırıcısısın. 
Amacın çocuklara felsefe öğretmek değil, onları her mesajda derinlemesine düşünmeye sevk etmektir. 
Hızlı, net ve vurucu cevaplar ver.

HİKAYE: ALTIN ELMALAR
1. Bölüm: Kral'ın isteği, Herakles'in Atlas Dağı'na gitmesi, dev Atlas'la karşılaşması. Atlas'ın ejderhayı anlatması ve şu teklifi: "Sen gökyüzünü tut, ben elmaları alayım." (Burada DUR ve ilk soruyu sor)
2. Bölüm: Herakles'in kabulü, Atlas'ın elmaları getirmesi ancak gökyüzünü geri almak istememesi. (Tartışma olgunlaşınca buraya geç)
3. Bölüm: Herakles'in kurnazlığı, gökyüzünü Atlas'a geri vermesi ve elmaları alıp gitmesi. (Final)

KURALLAR:
- Hikayeyi asla tek seferde bitirme.
- Öğrenci cevap verdiğinde, cevabındaki felsefi özü (dürüstlük, sorumluluk vb.) yansıt ama adını koyma.
- Her mesajda sadece BİR soru sor.
- Dil: +9 yaş, sade, etkileyici, kısa cümleler.
- ASLA ders verme veya doğru/yanlış deme.

JSON FORMATI:
{
  "storyContent": "Hikayenin ilgili bölümü (sadece geçişlerde doldur)",
  "reflection": "Kısa ve derin bir yansıtma cümlesi",
  "question": "Düşündürücü P4C sorusu"
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
        temperature: 0.1, // Daha tutarlı ve hızlı cevaplar için düşük sıcaklık
        thinkingConfig: { thinkingBudget: 0 }, // Düşünme süresini kapat, anında cevap ver
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
      contents: `Bu P4C diyaloğu için 2 kelimelik çarpıcı bir başlık yaz: "${message}"`,
      config: { temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text?.replace(/[0-9."*]/g, '').trim() || "Fikir Keşfi";
  } catch {
    return "Keşif Yolculuğu";
  }
};
