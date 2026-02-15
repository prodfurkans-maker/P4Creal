import { GoogleGenerativeAI, SchemaType } from "@google/genai";
import { GeminiResponse } from "../types"; // uzantıyı kaldırdık

const SYSTEM_INSTRUCTION = `
Sen NextGenLAB bünyesinde çalışan, üst düzey bir P4C (Çocuklar İçin Felsefe) Uzmanı ve Kıdemli Pedagogsun. 10-14 yaş grubu çocuklarla konuşuyorsun.

KESİN YASAKLAR VE GÜVENLİK:
1. DİN, SİYASET, CİNSELLİK: Bu konularda fikir beyan etmen, rehberlik yapman veya tartışmaya girmen KESİNLİKLE YASAKTIR.
2. Bu konular açılırsa: "Bu alan benim uzmanlık alanımın dışında kalıyor ama merak etmek zihni geliştiren harika bir yol! İstersen başka bir felsefi kavramı, örneğin 'adalet' veya 'gerçeklik' üzerine konuşabiliriz." diyerek konuyu kapat ve hemen farklı bir P4C sorusu sor.

PEDAGOJİK STANDARTLAR:
- "empathy": Çocuğun hissini ciddiye al, bir yetişkin gibi saygı duyarak isimlendir. "Seni anlıyorum" deme, "Bu hissettiğin şey tam olarak [duygu ismi] ve bunu hissetmek çok insani" de.
- "suggestion": Merakı tetikle. Bilgi verme, çocuğun kendi bilgisini inşa etmesine yardım edecek 1-2 felsefi cümle kur.
- "question": Gerçek bir P4C sorusu sor. Cevabı "Evet/Hayır" olmayan, ucu açık, uykuları kaçıran ama heyecan veren bir soru. Örn: "Renkler olmasaydı sevgi hangi kokuya benzerdi?"

Dil: Türkçe. Üslup: Zeki, meraklı, nazik. Sadece JSON döndür.
`;

const ai = new GoogleGenerativeAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY, // Vercel'de tanımladığın environment variable
});

export const getEmpathyResponse = async (userMessage: string): Promise<GeminiResponse> => {
  try {
    const model = ai.getGenerativeModel({
      model: "gemini-3-flash", // artık v1 endpoint'te destekleniyor
      generationConfig: {
        temperature: 0.75,
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            empathy: { type: SchemaType.STRING },
            suggestion: { type: SchemaType.STRING },
            question: { type: SchemaType.STRING },
          },
          required: ["empathy", "suggestion", "question"],
        },
      },
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const response = await model.generateContent(userMessage);
    const text = response.response.text();
    if (!text) throw new Error("EMPTY_RESPONSE");
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  try {
    const model = ai.getGenerativeModel({
      model: "gemini-3-flash",
      generationConfig: { temperature: 1 },
    });

    const response = await model.generateContent(
      `Şu düşünce için 2 kelimelik felsefi ve zekice bir başlık yaz: "${message}"`
    );

    let title =
      response.response.text()?.replace(/[0-9.]/g, "").replace(/"/g, "").trim().split("\n")[0] ||
      "Fikir Keşfi";
    return title.length > 25 ? title.substring(0, 25) : title;
  } catch {
    return "Düşünce Yolculuğu";
  }
};
