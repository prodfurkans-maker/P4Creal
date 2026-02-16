
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `Sen kıdemli ve profesyonel bir P4C (Philosophy for Children) kolaylaştırıcısısın. 
Amacın çocukları/gençleri yargılamadan felsefi bir derinliğe çekmek.

HİKAYE BAĞLAMI: "Altın Elmalar"
- Karakterler: Herakles, Dev Atlas.
- Olay: Atlas'ın gökyüzünü tutması, Herakles'in emaneti alması ve Atlas'ın "Sen tut, ben elmaları getireyim" teklifi.

STRATEJİN:
1. İLK MESAJ: Hikayeyi Atlas'ın teklifine kadar anlat ve "storyContent" alanına koy. İlk sorunu sor.
2. SONRAKİ MESAJLAR: "storyContent" alanını boş bırak. Odağın TAMAMEN kullanıcının cevabı olsun.
3. SOCRATIC SORGU: Kullanıcının cevabındaki felsefi özü (güven, dürüstlük, özgürlük vb.) yakala, ona ayna tut (Reflection) ve bu kavram üzerinden yeni, derin bir soru sor.
4. ASLA DERS VERME: Doğru/Yanlış deme. "Çok güzel dedin" gibi onaylayıcı ama pasif cümleler yerine "Bu durumda sence..." gibi aktif felsefi yönlendirmeler yap.
5. DİL: Sade, profesyonel, akıcı ve kısa cümleler.

JSON FORMATI:
{
  "storyContent": "Sadece ilk mesajda hikayeyi yaz, sonrakilerde boş bırak.",
  "reflection": "Kullanıcının fikrine dair derin, kısa bir analiz.",
  "question": "Diyaloğu bir üst seviyeye taşıyacak tek bir P4C sorusu."
}`;

export const getP4CResponse = async (userMessage: string, chatHistory: any[]): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Eğer tarihçe boşsa, bu ilk mesajdır, hikayeyi başlatması istenir.
  const prompt = chatHistory.length <= 1 
    ? "Altın Elmalar hikayesini Atlas'ın teklif sunduğu yere kadar anlat ve ilk P4C sorusunu sor." 
    : userMessage;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.3, // Mantık ve yaratıcılık dengesi
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
    console.error("P4C Hızı Optimize Edilemedi:", error);
    throw error;
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Bu düşünce yolculuğuna 2 kelimelik başlık koy: "${message}"`,
      config: { temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text?.replace(/[0-9."*]/g, '').trim() || "Fikir Keşfi";
  } catch {
    return "Yeni Diyalog";
  }
};
