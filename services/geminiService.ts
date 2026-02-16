
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `Sen kıdemli ve profesyonel bir P4C (Philosophy for Children) kolaylaştırıcısısın. 
Görevin, kullanıcıyı "Altın Elmalar" hikayesi üzerinden felsefi bir sorgulamaya çekmek.

HİKAYE AKIŞI:
- 1. Bölüm: Herakles ve Atlas'ın karşılaşması, Atlas'ın "Sen gökyüzünü tut, ben elmaları alayım" teklifi.
- 2. Bölüm: Atlas'ın elmaları getirmesi ama yükü geri almak istememesi.
- 3. Bölüm: Herakles'in kurnazca yükü geri verip gitmesi.

STRATEJİN:
1. Hikayeyi sadece GEREKTİĞİNDE (başlangıçta veya bir sonraki bölüme geçme vakti geldiğinde) "storyContent" alanına yaz. Diyalog sürerken bu alanı boş bırak.
2. Kullanıcının cevabını çok dikkatli analiz et. Cevabındaki bir kavramı (örn: "yardım etmek", "güven", "zorunluluk") seç ve ona ayna tut (Reflection).
3. "Neden böyle düşündün?" gibi basit sorulardan kaçın. Daha derin, kavramsal ve profesyonel P4C soruları sor.
4. Karşındakine asla ders verme, "doğru" veya "yanlış" deme.
5. Cevapların kısa, vurucu ve merak uyandırıcı olsun.

JSON ÇIKTISI (ZORUNLU):
{
  "storyContent": "Eğer hikaye ilerliyorsa yeni bölümü buraya yaz, ilerlemiyorsa boş bırak.",
  "reflection": "Kullanıcının fikrini derinlemesine analiz eden kısa bir yansıtma.",
  "question": "Diyaloğu derinleştirecek tek bir P4C sorusu."
}`;

export const getP4CResponse = async (userMessage: string, chatHistory: any[]): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: chatHistory.length === 0 
        ? "Altın Elmalar hikayesini başlat ve Atlas'ın teklifinden sonra ilk soruyu sor."
        : userMessage,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.2, // Biraz daha yaratıcı ama odaklı cevaplar
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
    console.error("P4C Akış Hatası:", error);
    throw error;
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  if (message.length < 5) return "Yeni Keşif";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `P4C diyalog başlığı (2 kelime): "${message}"`,
      config: { temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text?.replace(/[0-9."*]/g, '').trim() || "Fikir Keşfi";
  } catch {
    return "Düşünce Turu";
  }
};
