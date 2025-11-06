import OpenAI from 'openai';

let _openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openai;
}

export async function generateText(params: {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  model?: string;
}): Promise<string> {
  const openai = getOpenAI();
  
  const response = await openai.chat.completions.create({
    model: params.model || 'gpt-4o-mini',
    messages: params.messages,
    temperature: params.temperature ?? 0.7,
  });
  
  return response.choices[0]?.message?.content || '';
}
