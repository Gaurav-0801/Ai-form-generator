import connectDB from './db';
import Form, { IForm } from '../models/Form';
import { generateEmbedding } from './openai';
import mongoose from 'mongoose';

export interface RetrievedForm {
  purpose: string;
  fields: string[];
  schema: any;
}

/**
 * Retrieves top-K most relevant past forms for a user based on semantic similarity
 * Uses OpenAI embeddings and MongoDB vector search
 */
export async function retrieveRelevantForms(
  userId: string,
  userPrompt: string,
  topK: number = 10
): Promise<RetrievedForm[]> {
  try {
    console.log('[Memory Retrieval] Starting retrieval for user:', userId);
    await connectDB();
    console.log('[Memory Retrieval] Database connected');

    // Generate embedding for user prompt
    console.log('[Memory Retrieval] Generating query embedding...');
    let queryEmbedding;
    try {
      queryEmbedding = await generateEmbedding(userPrompt);
      console.log('[Memory Retrieval] Query embedding generated');
    } catch (embedError) {
      const embedErrorMessage = embedError instanceof Error ? embedError.message : 'Unknown error';
      console.error('[Memory Retrieval] Query embedding failed:', embedErrorMessage);
      throw new Error(`Failed to generate query embedding: ${embedErrorMessage}`);
    }

  // For MongoDB Atlas Vector Search, we need to use aggregation pipeline
  // Note: This requires MongoDB Atlas with vector search index configured
  // If not using Atlas, we'll fall back to cosine similarity calculation
  
  try {
    // Try MongoDB Atlas Vector Search first
    const forms = await Form.aggregate([
      {
        $vectorSearch: {
          queryVector: queryEmbedding,
          path: 'embedding',
          numCandidates: Math.max(100, topK * 10),
          limit: topK,
          index: 'vector_index', // This index needs to be created in MongoDB Atlas
        },
      },
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $project: {
          schema: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]);

    return forms.map((form) => ({
      purpose: form.schema.title || 'Untitled Form',
      fields: form.schema.fields?.map((f: any) => f.label || f.id) || [],
      schema: form.schema,
    }));
  } catch (error) {
    // Fallback to cosine similarity if vector search is not available
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn('[Memory Retrieval] Vector search not available, using cosine similarity fallback:', errorMessage);
    try {
      return await retrieveRelevantFormsFallback(userId, queryEmbedding, topK);
    } catch (fallbackError) {
      const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
      console.error('[Memory Retrieval] Fallback also failed:', fallbackErrorMessage);
      throw new Error(`Memory retrieval failed: ${fallbackErrorMessage}`);
    }
  }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Memory Retrieval] Error in retrieveRelevantForms:', errorMessage);
    throw error;
  }
}

/**
 * Fallback method using cosine similarity calculation
 * This works without MongoDB Atlas Vector Search
 */
async function retrieveRelevantFormsFallback(
  userId: string,
  queryEmbedding: number[],
  topK: number
): Promise<RetrievedForm[]> {
  await connectDB();
  
  // Ensure connection is actually ready (state 1 = connected)
  // Wait a bit if not connected yet
  let retries = 0;
  while (mongoose.connection.readyState !== 1 && retries < 10) {
    await new Promise(resolve => setTimeout(resolve, 50));
    retries++;
  }
  
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB connection is not ready');
  }

  // Get all forms for the user that have embeddings
  const allForms = await Form.find({
    userId: new mongoose.Types.ObjectId(userId),
    embedding: { $exists: true, $ne: null },
  }).limit(1000); // Limit to prevent memory issues

  // Calculate cosine similarity for each form
  const formsWithScores = allForms
    .map((form) => {
      if (!form.embedding || form.embedding.length === 0) {
        return null;
      }

      const similarity = cosineSimilarity(queryEmbedding, form.embedding);
      return {
        form,
        similarity,
      };
    })
    .filter((item): item is { form: IForm; similarity: number } => item !== null)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return formsWithScores.map(({ form }) => ({
    purpose: form.schema.title || 'Untitled Form',
    fields: form.schema.fields?.map((f) => f.label || f.id) || [],
    schema: form.schema,
  }));
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}


