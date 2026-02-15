import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    console.log("BODY:", req.body);
    console.log("KEY:", process.env.GEMINI_API_KEY ? "VAR" : "YOK");

    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = ai.getGenerativeModel({
      model: "gemini-pro",
    });

    const result = await model.generateContent("Merhaba");

    res.status(200).json({
      ok: true,
      text: result.response.text(),
    });
  } catch (e) {
    console.error("FULL ERROR:", e);
    res.status(500).json({
      error: e.message,
      stack: e.stack,
    });
  }
}
