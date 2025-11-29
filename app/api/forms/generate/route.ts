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
    console.log('[Form Generate] Starting request...');
    
    // Ensure database connection is established first
    console.log('[Form Generate] Connecting to database...');
    try {
      await connectDB();
      console.log('[Form Generate] Database connected successfully');
    } catch (dbError) {
      const dbErrorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      console.error('[Form Generate] Database connection failed:', dbErrorMessage);
      return NextResponse.json(
        { error: `Database connection failed: ${dbErrorMessage}` },
        { status: 500 }
      );
    }

    console.log('[Form Generate] Checking authentication...');
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      console.log('[Form Generate] Authentication failed');
      return authResult;
    }
    const { userId } = authResult;
    console.log('[Form Generate] Authenticated user:', userId);

    console.log('[Form Generate] Parsing request body...');
    const body = await request.json();
    const { prompt } = generateSchema.parse(body);
    console.log('[Form Generate] Prompt received:', prompt.substring(0, 50) + '...');

    // Generate form schema with context-aware memory
    console.log('[Form Generate] Generating form schema...');
    let schema;
    try {
      schema = await generateFormSchema(userId, prompt);
      console.log('[Form Generate] Form schema generated successfully');
    } catch (schemaError) {
      const schemaErrorMessage = schemaError instanceof Error ? schemaError.message : 'Unknown error';
      console.error('[Form Generate] Schema generation failed:', schemaErrorMessage);
      console.error('[Form Generate] Schema error stack:', schemaError instanceof Error ? schemaError.stack : 'No stack');
      return NextResponse.json(
        { error: `Schema generation failed: ${schemaErrorMessage}` },
        { status: 500 }
      );
    }

    // Save form with embedding
    console.log('[Form Generate] Saving form with embedding...');
    let formId;
    try {
      formId = await saveFormWithEmbedding(userId, schema, prompt);
      console.log('[Form Generate] Form saved successfully:', formId);
    } catch (saveError) {
      const saveErrorMessage = saveError instanceof Error ? saveError.message : 'Unknown error';
      console.error('[Form Generate] Save failed:', saveErrorMessage);
      console.error('[Form Generate] Save error stack:', saveError instanceof Error ? saveError.stack : 'No stack');
      return NextResponse.json(
        { error: `Failed to save form: ${saveErrorMessage}` },
        { status: 500 }
      );
    }

    console.log('[Form Generate] Request completed successfully');
    return NextResponse.json({
      success: true,
      formId,
      schema,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[Form Generate] Validation error:', error.errors);
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    // Log full error details for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    
    console.error('[Form Generate] Unexpected error:', {
      name: errorName,
      message: errorMessage,
      stack: errorStack,
      error: error,
    });

    // Always return the actual error message for debugging
    return NextResponse.json(
      { 
        error: `Failed to generate form: ${errorMessage}`,
        errorName: errorName,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    );
  }
}




