// src/services/renderService.ts

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export const generateRenderConcept = async (
  base64Image: string
): Promise<string> => {
  const cleanBase64 = base64Image.replace(
    /^data:image\/(png|jpg|jpeg);base64,/,
    ""
  );

  const payload = {
    contents: [
      {
        parts: [
          {
            text:
              "You are an expert architectural visualizer. Analyze this 3D sketch and generate a highly detailed photorealistic rendering prompt. Return ONLY the final English prompt."
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const data = await response.json();

  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
};