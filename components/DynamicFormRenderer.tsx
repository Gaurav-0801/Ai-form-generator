'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import type { FormSchema, FormField } from '@/models/Form';

interface DynamicFormRendererProps {
  schema: FormSchema;
  formId: string;
}

export function DynamicFormRenderer({ schema, formId }: DynamicFormRendererProps) {
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});
  const [imageUrls, setImageUrls] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  // Build Zod schema dynamically
  const buildZodSchema = (fields: FormField[]) => {
    const schemaObj: Record<string, any> = {};

    fields.forEach((field) => {
      let fieldSchema: z.ZodTypeAny;

      switch (field.type) {
        case 'email':
          fieldSchema = z.string().email('Invalid email address');
          break;
        case 'number':
          fieldSchema = z.coerce.number();
          if (field.validation?.min !== undefined) {
            fieldSchema = fieldSchema.min(field.validation.min);
          }
          if (field.validation?.max !== undefined) {
            fieldSchema = fieldSchema.max(field.validation.max);
          }
          break;
        case 'checkbox':
          fieldSchema = z.boolean();
          break;
        default:
          fieldSchema = z.string();
          if (field.validation?.min !== undefined) {
            fieldSchema = (fieldSchema as z.ZodString).min(field.validation.min);
          }
          if (field.validation?.max !== undefined) {
            fieldSchema = (fieldSchema as z.ZodString).max(field.validation.max);
          }
          if (field.validation?.pattern) {
            fieldSchema = (fieldSchema as z.ZodString).regex(
              new RegExp(field.validation.pattern),
              'Invalid format'
            );
          }
      }

      if (field.required) {
        schemaObj[field.id] = fieldSchema;
      } else {
        schemaObj[field.id] = fieldSchema.optional();
      }
    });

    return z.object(schemaObj);
  };

  const formSchema = buildZodSchema(schema.fields);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
  });

  const handleImageUpload = async (fieldId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setUploadingImages((prev) => ({ ...prev, [fieldId]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setImageUrls((prev) => ({
        ...prev,
        [fieldId]: [...(prev[fieldId] || []), data.url],
      }));

      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploadingImages((prev) => ({ ...prev, [fieldId]: false }));
    }
  };

  const onSubmit = async (data: Record<string, any>) => {
    setSubmitting(true);

    try {
      // Collect all image URLs
      const allImageUrls = Object.values(imageUrls).flat();

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          responses: data,
          imageUrls: allImageUrls,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Submission failed');
      }

      toast.success('Form submitted successfully!');
      
      // Reset form
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const fieldError = errors[field.id];

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>
            <textarea
              id={field.id}
              {...register(field.id)}
              className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              required={field.required}
            />
            {fieldError && (
              <p className="text-sm text-destructive">
                {fieldError.message as string}
              </p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>
            <select
              id={field.id}
              {...register(field.id)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              required={field.required}
            >
              <option value="">Select an option</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {fieldError && (
              <p className="text-sm text-destructive">
                {fieldError.message as string}
              </p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {field.options?.map((option) => (
                <label key={option} className="flex items-center gap-2">
                  <input
                    type="radio"
                    value={option}
                    {...register(field.id)}
                    required={field.required}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
            {fieldError && (
              <p className="text-sm text-destructive">
                {fieldError.message as string}
              </p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register(field.id)}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </span>
            </label>
            {fieldError && (
              <p className="text-sm text-destructive">
                {fieldError.message as string}
              </p>
            )}
          </div>
        );

      case 'file':
        return (
          <div key={field.id} className="space-y-2">
            <label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>
            <div className="space-y-2">
              <Input
                id={field.id}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(field.id, file);
                  }
                }}
                disabled={uploadingImages[field.id]}
                className="cursor-pointer"
              />
              {uploadingImages[field.id] && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </div>
              )}
              {imageUrls[field.id] && imageUrls[field.id].length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Uploaded images:
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {imageUrls[field.id].map((url, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={url}
                          alt={`Upload ${idx + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {fieldError && (
              <p className="text-sm text-destructive">
                {fieldError.message as string}
              </p>
            )}
          </div>
        );

      default:
        return (
          <div key={field.id} className="space-y-2">
            <label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>
            <Input
              id={field.id}
              type={field.type === 'number' ? 'number' : field.type}
              {...register(field.id)}
              required={field.required}
              min={field.validation?.min}
              max={field.validation?.max}
              pattern={field.validation?.pattern}
            />
            {fieldError && (
              <p className="text-sm text-destructive">
                {fieldError.message as string}
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{schema.title}</CardTitle>
        {schema.description && (
          <CardDescription>{schema.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {schema.fields.map(renderField)}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

