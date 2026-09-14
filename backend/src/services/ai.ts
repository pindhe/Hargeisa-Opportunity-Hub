import { env } from "../config/env";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function generateAiText(messages: ChatMessage[]) {
  if (!env.aiApiKey) return null;

  const response = await fetch(`${env.aiApiBase.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.aiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.aiModel,
      temperature: 0.3,
      messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("AI API error", response.status, text);
    return null;
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() ?? null;
}
