'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { FormPreview } from '@/components/FormPreview';
import type { FormSchema } from '@/models/Form';

interface Submission {
  id: string;
  responses: Record<string, any>;
  imageUrls: string[];
  submittedAt: string;
}

export default function FormDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;

  const [form, setForm] = useState<{ schema: FormSchema } | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFormDetails();
  }, [formId]);

  const fetchFormDetails = async () => {
    try {
      const [formResponse, submissionsResponse] = await Promise.all([
        fetch(`/api/forms/${formId}`),
        fetch(`/api/submissions?formId=${formId}`),
      ]);

      if (formResponse.status === 401) {
        router.push('/auth/login');
        return;
      }

      const formData = await formResponse.json();
      const submissionsData = await submissionsResponse.json();

      setForm({ schema: formData.form.schema });
      setSubmissions(submissionsData.submissions || []);
    } catch (error) {
      console.error('Error fetching form details:', error);
      toast.error('Failed to load form details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Form not found</div>
      </div>
    );
  }

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/form/${formId}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Schema</CardTitle>
              <CardDescription>Your form structure</CardDescription>
            </CardHeader>
            <CardContent>
              <FormPreview schema={form.schema} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Share Form</CardTitle>
              <CardDescription>Public link for form submissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={publicUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(publicUrl);
                    toast.success('Link copied to clipboard!');
                  }}
                >
                  Copy
                </Button>
              </div>
              <Link href={publicUrl} target="_blank">
                <Button className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Form
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Submissions ({submissions.length})</CardTitle>
            <CardDescription>All responses to this form</CardDescription>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No submissions yet
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <Card key={submission.id}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Submitted {new Date(submission.submittedAt).toLocaleString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        {Object.entries(submission.responses).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <span className="font-medium min-w-[120px]">{key}:</span>
                            <span className="text-muted-foreground">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                      {submission.imageUrls.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <ImageIcon className="h-4 w-4" />
                            Images ({submission.imageUrls.length})
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {submission.imageUrls.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img
                                  src={url}
                                  alt={`Upload ${idx + 1}`}
                                  className="w-full h-32 object-cover rounded border hover:opacity-80 transition-opacity"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

