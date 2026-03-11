import OpenAI from "openai";

interface AiClientConfig {
  baseUrl: string;
  apiKey: string;
  modelName: string;
}

export function createAiClient(config: AiClientConfig) {
  return new OpenAI({
    baseURL: config.baseUrl,
    apiKey: config.apiKey,
  });
}

export async function* streamChat(
  client: OpenAI,
  model: string,
  systemPrompt: string,
  userMessage: string
): AsyncGenerator<string> {
  const stream = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    stream: true,
    temperature: 0.3,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

export async function testConnection(config: AiClientConfig): Promise<boolean> {
  const client = createAiClient(config);
  const response = await client.chat.completions.create({
    model: config.modelName,
    messages: [{ role: "user", content: "Hi" }],
    max_tokens: 5,
  });
  return !!response.choices[0]?.message?.content;
}
