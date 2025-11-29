import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { generateFormSchema, saveFormWithEmbedding } from '@/lib/form-generator';
import connectDB from '@/lib/db';
import { z } from 'zod';

// Ensure this route uses Node.js runtime (required for MongoDB)
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for Vercel Pro, 10s for Hobby

const generateSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Ensure database connection is established first
    await connectDB();

    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const body = await request.json();
    const { prompt } = generateSchema.parse(body);

    // Generate form schema with context-aware memory
    const schema = await generateFormSchema(userId, prompt);

    // Save form with embedding
    const formId = await saveFormWithEmbedding(userId, schema, prompt);

    return NextResponse.json({
      success: true,
      formId,
      schema,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    // Log full error details for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Form generation error:', {
      message: errorMessage,
      stack: errorStack,
      error: error,
    });

    // Return more detailed error in development, generic in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      { 
        error: 'Failed to generate form',
        ...(isDevelopment && { details: errorMessage })
      },
      { status: 500 }
    );
  }
}




