'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { FormPreview } from '@/components/FormPreview';
import type { FormSchema } from '@/models/Form';

export default function CreateFormPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedSchema, setGeneratedSchema] = useState<FormSchema | null>(null);
  const [formId, setFormId] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setLoading(true);
    setGeneratedSchema(null);

    try {
      const response = await fetch('/api/forms/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate form');
      }

      setGeneratedSchema(data.schema);
      setFormId(data.formId);
      toast.success('Form generated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate form');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (formId) {
      toast.success('Form saved!');
      router.push(`/dashboard/forms/${formId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Form Generator
            </CardTitle>
            <CardDescription>
              Describe the form you need in natural language, and AI will generate it for you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="prompt" className="text-sm font-medium">
                  Describe your form
                </label>
                <Input
                  id="prompt"
                  placeholder="e.g., I need a signup form with name, email, age, and profile picture"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Be specific about the fields, types, and requirements you need
                </p>
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Form
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {generatedSchema && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Generated Form Preview</CardTitle>
                  <CardDescription>
                    Review your form before saving
                  </CardDescription>
                </div>
                <Button onClick={handleSave}>Save Form</Button>
              </div>
            </CardHeader>
            <CardContent>
              <FormPreview schema={generatedSchema} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

