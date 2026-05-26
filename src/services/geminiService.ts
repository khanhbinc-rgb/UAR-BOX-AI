import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function askGemini(message: string) {

  const chatCompletion = await groq.chat.completions.create({

    messages: [

      {
        role: "system",
        content:
          `
          Bạn là AI chuyên gia kiến trúc, nội thất và xây dựng.

          Nhiệm vụ:
          - Tư vấn kiến trúc
          - Tư vấn nội thất
          - Tư vấn mặt bằng công năng
          - Tư vấn vật liệu
          - Tư vấn ánh sáng
          - Trả lời như kiến trúc sư chuyên nghiệp

          Phong cách:
          - Ngắn gọn
          - Chuyên nghiệp
          - Dễ hiểu
          - Thực tế
          `,
      },

      {
        role: "user",
        content: message,
      },

    ],

    model: "llama-3.3-70b-versatile",

  });

  return chatCompletion.choices[0]?.message?.content || "";

}