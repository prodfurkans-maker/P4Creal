
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse, Message } from "../types.ts";

const START_STORY = `Kral, Herakles’ten uzak diyarlardan üç altın elma getirmesini istedi. Altın elmaların bulunduğu bahçeyi bulmak hiç de kolay değildi. Bahçe Atlas dağlarının yakınlarındaydı. Herakles sonunda ufukta büyük, mor bir dağ gördü. Bu bir devdi. Devin yüzü, gökyüzünün bütün yükünü omuzlarında taşımaktan dolayı mosmordu. “Senin adın Atlas mı?” diye yukarı doğru bağırdı Herakles. “Doğrudur. Sen de şu bildiğimiz Herakles misin?” diye sordu Atlas. Herakles, Hesperidler'in bahçesinden üç altın elma almak istediğini söyledi. Atlas, elmaları korkusuz bir ejderhanın koruduğunu söyledi. Atlas bir öneride bulundu: Gökyüzünü uzun süredir taşıdığını, hareketsiz kaldığını ve ejderhayı tanıdığını söyledi. Eğer Herakles bir süre gökyüzünü tutarsa, elmaları onun için gidip alabileceğini söyledi.`;

// Ultra-short instruction set for <1s response
const SYSTEM_INSTRUCTION = `P4C Facilitator. Heracles/Atlas story.
Goal: Brief reflection + 1 deep Socratic question.
Rule: Max 2 sentences total. 
Format: JSON { "reflection": "", "question": "" }`;

export const getP4CResponse = async (userMessage: string, chatHistory: Message[]): Promise<GeminiResponse> => {
  // First turn: Instant hardcoded response
  const isFirstTurn = chatHistory.length === 0 || (chatHistory.length === 1 && chatHistory[0].role === 'user');
  if (isFirstTurn) {
    return {
      storyContent: START_STORY,
      reflection: "Herakles ve Atlas'ın bu devasa yük paylaşımı hakkında ne düşünüyorsun?",
      question: "Sence Atlas gökyüzünü taşırken Herakles'e neden güvendi?"
    };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // PERFORMANCE CRITICAL: Only send the last 2 items of history to keep context window tiny.
  // This drastically reduces processing time in production environments.
  const shortHistory = chatHistory.slice(-2);
  const contents = shortHistory.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ 
      text: m.role === 'assistant' 
        ? `${m.data?.reflection} ${m.data?.question}` 
        : m.content 
    }]
  }));

  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.4,
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reflection: { type: Type.STRING },
            question: { type: Type.STRING }
          },
          required: ["reflection", "question"]
        }
      },
    });
    
    const result = JSON.parse(response.text?.trim() || "{}");
    return { ...result, storyContent: "" };
  } catch (error) {
    console.error("Latency Error:", error);
    return { reflection: "Haklısın.", question: "Peki bu sence özgür bir seçim mi?" };
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Short title for: "${message}"`,
      config: { temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text?.replace(/[0-9."*]/g, '').trim().split(' ').slice(0, 2).join(' ') || "Keşif";
  } catch {
    return "Sohbet";
  }
};
