import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { generateFormSchema, saveFormWithEmbedding } from '@/lib/form-generator';
import { z } from 'zod';

const generateSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
});

export async function POST(request: NextRequest) {
  try {
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

    console.error('Form generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate form' },
      { status: 500 }
    );
  }
}

