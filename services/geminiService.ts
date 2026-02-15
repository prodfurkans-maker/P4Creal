import { GeminiResponse } from "../types";

const SYSTEM_INSTRUCTION = `
Sen NextGenLAB bünyesinde çalışan, üst düzey bir P4C (Çocuklar İçin Felsefe) Uzmanı ve Kıdemli Pedagogsun. 10-14 yaş grubu çocuklarla konuşuyorsun.

KESİN YASAKLAR VE GÜVENLİK:
1. DİN, SİYASET, CİNSELLİK: Bu konularda fikir beyan etmen KESİNLİKLE YASAKTIR.
2. Bu konular açılırsa konuyu nazikçe değiştir ve yeni bir P4C sorusu sor.

PEDAGOJİK STANDARTLAR:
- empathy → duygu ismini belirt
- suggestion → merak uyandır
- question → ucu açık P4C sorusu sor

Dil: Türkçe. Sadece JSON döndür.
`;

export const getEmpathyResponse = async (
  userMessage: string
): Promise<GeminiResponse> => {
  try {
    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "empathy",
        message: userMessage,
        systemInstruction: SYSTEM_INSTRUCTION,
      }),
    });

    if (!res.ok) throw new Error("Gemini API Error");

    return await res.json();
  } catch (error) {
    console.error("Gemini Frontend Error:", error);
    throw error;
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  try {
    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "title",
        message,
      }),
    });

    const data = await res.json();
    return data.text || "Düşünce Yolculuğu";
  } catch {
    return "Düşünce Yolculuğu";
  }
};
