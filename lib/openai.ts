import OpenAI from 'openai';
import { config } from './config';

let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    if (!config.openai.apiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    openaiInstance = new OpenAI({
      apiKey: config.openai.apiKey,
      baseURL: config.openai.apiUrl,
    });
  }
  return openaiInstance;
}

// Lazy initialization proxy - only initializes when actually used
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return getOpenAI()[prop as keyof OpenAI];
  },
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getOpenAI().embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  
  return response.data[0].embedding;
}


