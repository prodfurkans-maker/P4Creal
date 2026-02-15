import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = ai.getGenerativeModel({
      model: "models/gemini-1.5-flash",
    });

    const result = await model.generateContent("Merhaba");

    res.status(200).json({
      text: result.response.text(),
    });
  } catch (e) {
    console.error("GEMINI ERROR:", e);
    res.status(500).json({ error: e.message });
  }
}
