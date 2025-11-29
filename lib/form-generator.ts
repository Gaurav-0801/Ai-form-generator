import { openai, generateEmbedding } from './openai';
import { retrieveRelevantForms } from './memory-retrieval';
import connectDB from './db';
import Form, { FormSchema } from '../models/Form';
import { z } from 'zod';

const FormFieldSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'email', 'number', 'file', 'textarea', 'select', 'checkbox', 'radio']),
  label: z.string(),
  required: z.boolean().optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
  options: z.array(z.string()).optional(),
});

const FormSchemaValidation = z.object({
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(FormFieldSchema),
});

export async function generateFormSchema(
  userId: string,
  userPrompt: string
): Promise<FormSchema> {
  try {
    console.log('[Form Generator] Retrieving relevant forms for user:', userId);
    // Retrieve relevant past forms
    const relevantForms = await retrieveRelevantForms(userId, userPrompt, 10);
    console.log('[Form Generator] Retrieved', relevantForms.length, 'relevant forms');

    // Build context from retrieved forms
    let contextSection = '';
    if (relevantForms.length > 0) {
      contextSection = `Here is relevant user form history for reference:\n${JSON.stringify(
        relevantForms.map((f) => ({
          purpose: f.purpose,
          fields: f.fields,
          schema: f.schema,
        })),
        null,
        2
      )}\n\n`;
    }

    // Build the prompt
    const systemPrompt = `You are an intelligent form schema generator. Generate valid JSON form schemas based on user requests.`;

    const userPromptWithContext = `${contextSection}Now generate a new form schema for this request:\n"${userPrompt}"\n\nReturn ONLY a valid JSON object matching this structure:
{
  "title": "Form Title",
  "description": "Optional description",
  "fields": [
    {
      "id": "field1",
      "type": "text|email|number|file|textarea|select|checkbox|radio",
      "label": "Field Label",
      "required": true/false,
      "validation": {
        "min": number (optional),
        "max": number (optional),
        "pattern": "regex string" (optional)
      },
      "options": ["option1", "option2"] (only for select/radio)
    }
  ]
}

Make sure all field IDs are unique and descriptive. Include appropriate validation rules.`;

    console.log('[Form Generator] Calling OpenAI API...');
    // Call OpenAI
    let response;
    try {
      response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPromptWithContext },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });
      console.log('[Form Generator] OpenAI API call successful');
    } catch (openaiError) {
      const openaiErrorMessage = openaiError instanceof Error ? openaiError.message : 'Unknown OpenAI error';
      console.error('[Form Generator] OpenAI API call failed:', openaiErrorMessage);
      throw new Error(`OpenAI API error: ${openaiErrorMessage}`);
    }

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('[Form Generator] No content in OpenAI response');
      throw new Error('No response from OpenAI');
    }

    console.log('[Form Generator] Parsing OpenAI response...');
    // Parse and validate the response
    let parsedSchema: any;
    try {
      parsedSchema = JSON.parse(content);
    } catch (parseError) {
      console.warn('[Form Generator] Direct JSON parse failed, trying to extract from markdown...');
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        parsedSchema = JSON.parse(jsonMatch[1]);
      } else {
        console.error('[Form Generator] Failed to parse JSON. Content preview:', content.substring(0, 200));
        throw new Error(`Failed to parse JSON from response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
      }
    }

    console.log('[Form Generator] Validating schema structure...');
    // Validate schema structure
    let validatedSchema;
    try {
      validatedSchema = FormSchemaValidation.parse(parsedSchema);
      console.log('[Form Generator] Schema validation successful');
    } catch (validationError) {
      console.error('[Form Generator] Schema validation failed:', validationError);
      if (validationError instanceof z.ZodError) {
        throw new Error(`Schema validation failed: ${validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
      }
      throw validationError;
    }

    return validatedSchema;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Form Generator] Error in generateFormSchema:', errorMessage);
    throw error;
  }
}

export async function saveFormWithEmbedding(
  userId: string,
  schema: FormSchema,
  originalPrompt: string
): Promise<string> {
  try {
    console.log('[Save Form] Connecting to database...');
    await connectDB();
    console.log('[Save Form] Database connected');

    // Generate embedding for the form (using title + description + field labels)
    const formText = `${schema.title} ${schema.description || ''} ${schema.fields
      .map((f) => f.label)
      .join(' ')}`;
    
    console.log('[Save Form] Generating form embedding...');
    let embedding;
    try {
      embedding = await generateEmbedding(formText);
      console.log('[Save Form] Form embedding generated');
    } catch (embedError) {
      const embedErrorMessage = embedError instanceof Error ? embedError.message : 'Unknown error';
      console.error('[Save Form] Embedding generation failed:', embedErrorMessage);
      throw new Error(`Failed to generate form embedding: ${embedErrorMessage}`);
    }

    // Also generate embedding from original prompt for better retrieval
    console.log('[Save Form] Generating prompt embedding...');
    let promptEmbedding;
    try {
      promptEmbedding = await generateEmbedding(originalPrompt);
      console.log('[Save Form] Prompt embedding generated');
    } catch (embedError) {
      const embedErrorMessage = embedError instanceof Error ? embedError.message : 'Unknown error';
      console.error('[Save Form] Prompt embedding generation failed:', embedErrorMessage);
      throw new Error(`Failed to generate prompt embedding: ${embedErrorMessage}`);
    }

    // Average the embeddings for better semantic search
    const combinedEmbedding = embedding.map(
      (val, idx) => (val + promptEmbedding[idx]) / 2
    );

    console.log('[Save Form] Creating form document...');
    const form = new Form({
      userId: new (await import('mongoose')).Types.ObjectId(userId),
      schema,
      embedding: combinedEmbedding,
    });

    console.log('[Save Form] Saving form to database...');
    await form.save();
    console.log('[Save Form] Form saved successfully:', form._id.toString());
    return form._id.toString();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Save Form] Error in saveFormWithEmbedding:', errorMessage);
    throw error;
  }
}




