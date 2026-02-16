
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `Sen dünyanın en iyi P4C (Philosophy for Children) kolaylaştırıcısısın. 
Görevin, kullanıcıyı "Altın Elmalar" hikayesi üzerinden felsefi bir derinliğe çekmek ama bunu bir ders gibi değil, usta bir diyalog partneri gibi yapmak.

HİKAYE KURALLARI:
- storyContent alanı SADECE İLK MESAJDA hikayeyi Atlas'ın teklifine kadar anlatmak için kullanılır.
- SONRAKİ HİÇBİR MESAJDA hikayeden kesit sunma; odağın tamamen kullanıcının cevabı olsun.

DİYALOG KURALLARI:
1. Kullanıcının son cevabını çok dikkatli analiz et. 
2. Cevabındaki bir kavramı (sorumluluk, dürüstlük, zorunluluk, güven vb.) yakala ve ona "ayna tut" (Reflection).
3. Soru (Question) kısmında, kullanıcının o spesifik düşüncesini bir adım öteye taşıyacak derin bir felsefi soru sor.
4. "Neden?" gibi sığ sorulardan kaçın. Durumsal ve kavramsal sorular sor.
5. Dil: +9 yaşa uygun, çok nazik, profesyonel, merak uyandırıcı ve kısa.

JSON FORMATI (ZORUNLU):
{
  "storyContent": "Sadece ilk turda dolu, sonrasında mutlaka boş string ('').",
  "reflection": "Kullanıcının fikrine dair derin ama kısa bir analiz.",
  "question": "Kullanıcının cevabıyla doğrudan bağlantılı, yeni bir P4C sorusu."
}`;

export const getP4CResponse = async (userMessage: string, chatHistory: any[]): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Eğer tarihçe boşsa (veya sadece 1 sistem mesajı varsa), hikayeyi başlat.
  const isFirstTurn = chatHistory.length <= 1;
  const prompt = isFirstTurn 
    ? "Lütfen Altın Elmalar hikayesini Atlas'ın teklif sunduğu yere kadar anlat ve ilk P4C sorusunu sor." 
    : userMessage;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.2, // Daha tutarlı ve mantıklı cevaplar
        thinkingConfig: { thinkingBudget: 0 }, // Maksimum hız
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
    
    const data = JSON.parse(response.text?.trim() || "{}");
    
    // Güvenlik: İlk tur değilse storyContent'i manuel temizle (AI bazen unutabilir)
    if (!isFirstTurn) {
      data.storyContent = "";
    }
    
    return data;
  } catch (error) {
    console.error("P4C Hız ve Mantık Hatası:", error);
    throw error;
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Bu P4C diyaloğu için 2 kelimelik çok kısa bir başlık yaz: "${message}"`,
      config: { temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text?.replace(/[0-9."*]/g, '').trim() || "Fikir Keşfi";
  } catch {
    return "Yeni Diyalog";
  }
};
