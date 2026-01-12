import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `
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

Diary entry:
"${content}"
                  `.trim(),
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Empty Gemini response");
    }

    const text =
  data.candidates?.[0]?.content?.parts?.[0]?.text;

if (!text) {
  throw new Error("Empty Gemini response");
}

// 🔐 Gemini JSON 안전 파싱
let parsed;
try {
  parsed = JSON.parse(text);
} catch {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("Invalid JSON from Gemini");
  }
  parsed = JSON.parse(match[0]);
}

res.json({
  quote: parsed.quote || "",
  author: parsed.author || "Sage",
});

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI generation failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Relay server running");
});
