import express from "express";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const langMap = {
  en: "English",
  ko: "Korean",
  ja: "Japanese",
  fr: "French",
  es: "Spanish",
};

app.post("/api/diary", async (req, res) => {
  const { content, language = "en" } = req.body;
  const targetLang = langMap[language] || "English";

  if (!content) {
    return res.status(400).json({ error: "Missing diary content" });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `User diary entry: "${content}"`,
      config: {
        systemInstruction: `
You are an AI model used through a thin backend relay server.

GOAL:
Generate ONE short philosophical quote reflecting the diary entry.

OUTPUT FORMAT (JSON ONLY):
{
  "quote": "string",
  "author": "string"
}

RULES:
- One sentence only
- Calm, reflective, philosophical
- No explanation
- No markdown
- Use "Sage" if original
- Respond in ${targetLang}
`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quote: { type: Type.STRING },
            author: { type: Type.STRING },
          },
          required: ["quote", "author"],
        },
      },
    });

    res.json(JSON.parse(response.text));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI generation failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Relay server running");
});
