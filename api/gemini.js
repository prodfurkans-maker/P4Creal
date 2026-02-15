import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = ai.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    let prompt = req.body.message;

    if (req.body.type === "title") {
      prompt = `Şu düşünce için 2 kelimelik felsefi başlık yaz: "${req.body.message}"`;
    }

    const result = await model.generateContent(prompt);

    res.status(200).json({ text: result.response.text() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.toString() });
  }
}
