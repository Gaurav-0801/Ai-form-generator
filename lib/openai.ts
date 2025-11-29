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
  try {
    console.log('[OpenAI] Generating embedding for text (length:', text.length, ')');
    const response = await getOpenAI().embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    
    if (!response.data || !response.data[0] || !response.data[0].embedding) {
      throw new Error('Invalid embedding response from OpenAI');
    }
    
    console.log('[OpenAI] Embedding generated successfully (dimensions:', response.data[0].embedding.length, ')');
    return response.data[0].embedding;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[OpenAI] Embedding generation failed:', errorMessage);
    if (error instanceof Error && error.message.includes('API key')) {
      throw new Error('OpenAI API key is invalid or missing');
    }
    throw new Error(`Failed to generate embedding: ${errorMessage}`);
  }
}


