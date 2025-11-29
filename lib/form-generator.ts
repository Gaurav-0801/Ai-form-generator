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
  // Retrieve relevant past forms
  const relevantForms = await retrieveRelevantForms(userId, userPrompt, 10);

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

  // Call OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPromptWithContext },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  // Parse and validate the response
  let parsedSchema: any;
  try {
    parsedSchema = JSON.parse(content);
  } catch (error) {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      parsedSchema = JSON.parse(jsonMatch[1]);
    } else {
      throw new Error('Failed to parse JSON from response');
    }
  }

  // Validate schema structure
  const validatedSchema = FormSchemaValidation.parse(parsedSchema);

  return validatedSchema;
}

export async function saveFormWithEmbedding(
  userId: string,
  schema: FormSchema,
  originalPrompt: string
): Promise<string> {
  await connectDB();

  // Generate embedding for the form (using title + description + field labels)
  const formText = `${schema.title} ${schema.description || ''} ${schema.fields
    .map((f) => f.label)
    .join(' ')}`;
  const embedding = await generateEmbedding(formText);

  // Also generate embedding from original prompt for better retrieval
  const promptEmbedding = await generateEmbedding(originalPrompt);

  // Average the embeddings for better semantic search
  const combinedEmbedding = embedding.map(
    (val, idx) => (val + promptEmbedding[idx]) / 2
  );

  const form = new Form({
    userId: new (await import('mongoose')).Types.ObjectId(userId),
    schema,
    embedding: combinedEmbedding,
  });

  await form.save();
  return form._id.toString();
}




