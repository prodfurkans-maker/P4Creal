
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `Sen kıdemli ve profesyonel bir P4C (Philosophy for Children) eğitmenisin. 
Görevin, kullanıcıyı "Altın Elmalar" hikayesi üzerinden felsefi bir derinliğe çekmek.

HİKAYE KURALLARI:
- storyContent alanı SADECE İLK MESAJDA hikayeyi Atlas'ın teklifine kadar anlatmak için kullanılır.
- SONRAKİ HİÇBİR MESAJDA hikayeyi anlatma, hatırlatma veya özetleme.

DİYALOG VE BENZERSİZLİK KURALLARI:
1. Kullanıcının cevabını felsefi bir ayna olarak kullan (Reflection).
2. SORU (Question) kısmı her turda benzersiz olmalıdır. Eğer önceki soruda "sorumluluk" işlendiyse, bir sonrakinde "doğruluk", "özgürlük", "niyet" veya "sonuçlar" gibi farklı bir felsefi temayı ele al.
3. Sorular birbiriyle aynı mantıkta olmamalıdır. Bir soru "durumsal" ise diğeri "kavramsal" olmalıdır.
4. "Neden?" gibi sığ sorular yerine; "Eğer X olmasaydı Y yine de doğru olur muydu?" gibi sarsıcı P4C soruları sor.
5. Dil: Profesyonel, merak uyandırıcı, saygılı ve akıcı.

JSON ÇIKTISI (ZORUNLU):
{
  "storyContent": "Sadece ilk turda dolu, sonrasında boş string ('').",
  "reflection": "Kullanıcının fikrindeki felsefi özü yakalayan kısa yansıtma.",
  "question": "Diyaloğu bambaşka bir felsefi boyuta taşıyacak, benzersiz P4C sorusu."
}`;

export const getP4CResponse = async (userMessage: string, chatHistory: any[]): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // İlk tur kontrolü (Sistem mesajı ve kullanıcı mesajı varsa history > 1 olur)
  const isFirstTurn = chatHistory.length <= 1;
  const prompt = isFirstTurn 
    ? "Altın Elmalar hikayesini Atlas'ın teklif sunduğu yere kadar anlat ve ilk derin P4C sorusunu sor." 
    : userMessage;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.4, // Çeşitlilik için hafifçe artırıldı
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
    
    const data = JSON.parse(response.text?.trim() || "{}");
    
    // Güvenlik katmanı: İlk tur değilse hikaye alanını kesinlikle boşalt
    if (!isFirstTurn) {
      data.storyContent = "";
    }
    
    return data;
  } catch (error) {
    console.error("P4C Akış Hatası:", error);
    throw error;
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Bu diyaloğa 2 kelimelik felsefi bir başlık koy: "${message}"`,
      config: { temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text?.replace(/[0-9."*]/g, '').trim() || "Fikir Keşfi";
  } catch {
    return "Düşünce Turu";
  }
};
