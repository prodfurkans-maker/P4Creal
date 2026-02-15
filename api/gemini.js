import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "models/gemini-3-flash"
    });

    const result = await model.generateContent("Merhaba dünya");
    const response = await result.response;

    res.status(200).json({ text: response.text() });

  } catch (err) {
    console.error("Gemini Error:", err);
    res.status(500).json({ error: err.message });
  }
}
