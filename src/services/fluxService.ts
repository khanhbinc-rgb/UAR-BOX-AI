export async function generateFluxImage(prompt: string) {
  const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;

  const response = await fetch(
    "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `
          ultra realistic architectural visualization,
          modern luxury architecture,
          cinematic lighting,
          8k render,
          photorealistic,
          ${prompt}
        `,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `HF Error ${response.status}`
    );
  }

  const blob = await response.blob();

  return URL.createObjectURL(blob);
}