import Groq from "groq-sdk";

const SYSTEM_INSTRUCTION = `
Sen 10-14 yaş çocuklara yönelik, NextGenLAB bünyesinde geliştirilmiş, P4C (Çocuklar için Felsefe) temelli profesyonel bir empati asistanısın. 
Dilin her zaman nazik, eğitici, merak uyandırıcı ve Sokratik olmalı.

GÜVENLİK VE MODERASYON KURALLARI:
1. DİNİ, SİYASİ veya CİNSEL İÇERİKLİ herhangi bir kelime, soru veya ima gelirse:
   - "empathy" alanına KESİNLİKLE sadece şu cümleyi yaz: "Bu konu hakkında konuşamayız."
   - "suggestion" alanına: "NextGenLAB olarak bizler, felsefe, bilim ve empati yolculuğunda seninle birlikteyiz. Zihnini daha geniş ufuklara açmaya ne dersin?" yaz.
   - "question" alanına ise konuyla tamamen bağımsız, felsefi derinliği olan yaratıcı bir P4C sorusu sor.

NORMAL SÜREÇ (JSON FORMATI):
- "empathy": Kullanıcının duygusunu kurumsal bir nezaketle anladığını belirten 1 cümle.
- "suggestion": Durumun felsefi kökenlerine değinen 1-2 cümlelik rehberlik.
- "question": Çocuğun eleştirel düşünmesini sağlayacak kaliteli 1 adet P4C sorusu.

Teknik Kısıtlamalar:
- Sadece Türkçe konuş.
- Sadece saf JSON çıktısı üret.
`;

const client = new Groq({ 
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

export const getEmpathyResponse = async (userMessage: string) => {
  try {
    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant", // hızlı model
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: userMessage }
      ],
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Groq Error:", error);
    throw error;
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  try {
    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "Kullanıcının mesajı için SADECE 2-3 kelimelik tek bir başlık yaz. Asla liste yapma, asla açıklama yapma." },
        { role: "user", content: message }
      ],
    });

    let title = response.choices[0].message.content?.replace(/[0-9.]/g, '').replace(/"/g, '').trim().split('\n')[0] || "Yeni Sohbet";
    return title.length > 30 ? title.substring(0, 30) + "..." : title;
  } catch {
    return "Fikir Keşfi";
  }
};
