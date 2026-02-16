
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse, Message } from "../types.ts";

const SYSTEM_INSTRUCTION = `Sen kıdemli ve profesyonel bir P4C (Philosophy for Children) kolaylaştırıcısısın. 

HİKAYE KURALLARI:
- storyContent: Sadece ilk mesajda hikayeyi anlat. Sonraki tüm turlarda bu alanı boş bırak ("").

P4C SORGULAMA VE BENZERSİZLİK STRATEJİSİ:
1. Kullanıcının cevabındaki felsefi özü yakala ve kısa bir yansıtma (Reflection) yap.
2. Her turda FARKLI bir felsefi tema seç: (1. Tur: Adalet/Etik, 2. Tur: Gerçeklik/Varlık, 3. Tur: Bilgi/Doğruluk, 4. Tur: Özgürlük/İrade).
3. Sorular asla "Neden böyle düşünüyorsun?" gibi jenerik olmamalı. 
4. Benzersiz Soru Örneği: "Eğer bir karar herkes için iyi ama sadece senin için kötüyse, o karar hala 'iyi' midir?"
5. Soru (Question) kısmını tek bir cümle olarak, vurucu ve derinlemesine sor.

JSON FORMATI:
{
  "storyContent": "İlk mesajda hikaye, sonrakilerde boş.",
  "reflection": "Cevabın felsefi analizi (kısa ve öz).",
  "question": "Benzersiz ve derin P4C sorusu."
}`;

export const getP4CResponse = async (userMessage: string, chatHistory: Message[]): Promise<GeminiResponse> => {
  // Fix: Create instance right before making the API call to ensure it uses the latest process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isFirstTurn = chatHistory.length === 0;
  
  // Fix: Convert history to Gemini format (role: 'user' | 'model')
  const contents = chatHistory.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.role === 'assistant' ? JSON.stringify(m.data) : m.content }]
  }));

  // Add the current prompt
  contents.push({
    role: 'user',
    parts: [{ text: isFirstTurn ? "Altın Elmalar hikayesiyle P4C yolculuğunu başlat." : userMessage }]
  });

  try {
    const response = await ai.models.generateContent({
      // Fix: Upgraded to gemini-3-pro-preview for the complex philosophical reasoning required by P4C
      model: "gemini-3-pro-preview", 
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.7,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            storyContent: { type: Type.STRING },
            reflection: { type: Type.STRING },
            question: { type: Type.STRING }
          },
          required: ["reflection", "question"],
          propertyOrdering: ["storyContent", "reflection", "question"]
        }
      },
    });
    
    // Fix: access .text property directly (not a method)
    const data = JSON.parse(response.text?.trim() || "{}");
    if (!isFirstTurn) data.storyContent = "";
    return data;
  } catch (error) {
    console.error("Gemini Response Error:", error);
    throw error;
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  // Fix: Create instance right before making the API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Bu sorgulama için 2 kelimelik, öz ve etkileyici bir başlık koy: "${message}"`,
      config: { 
        temperature: 0.1,
        systemInstruction: "Sen bir başlık oluşturucusun. Sadece 2 kelimelik bir başlık döndür, tırnak veya sayı kullanma."
      }
    });
    // Fix: access .text property directly
    return response.text?.replace(/[0-9."*]/g, '').trim() || "Fikir Keşfi";
  } catch {
    return "Düşünce Turu";
  }
};
