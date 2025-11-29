'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DynamicFormRenderer } from '@/components/DynamicFormRenderer';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { FormSchema } from '@/models/Form';

export default function PublicFormPage() {
  const params = useParams();
  const formId = params.id as string;

  const [form, setForm] = useState<{ schema: FormSchema } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchForm();
  }, [formId]);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${formId}`);
      
      if (response.status === 404) {
        setError('Form not found');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load form');
      }

      const data = await response.json();
      setForm({ schema: data.form.schema });
    } catch (error) {
      console.error('Error fetching form:', error);
      setError('Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Card>
          <CardContent className="flex items-center gap-2 p-6">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading form...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">{error || 'Form not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <DynamicFormRenderer schema={form.schema} formId={formId} />
      </div>
    </div>
  );
}


