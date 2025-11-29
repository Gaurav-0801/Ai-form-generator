'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FormSchema } from '@/models/Form';

interface FormPreviewProps {
  schema: FormSchema;
}

export function FormPreview({ schema }: FormPreviewProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold mb-2">{schema.title}</h3>
        {schema.description && (
          <p className="text-muted-foreground">{schema.description}</p>
        )}
      </div>

      <div className="space-y-4">
        {schema.fields.map((field) => (
          <Card key={field.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>{field.label}</span>
                {field.required && (
                  <span className="text-destructive text-sm">Required</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Type: <span className="font-mono">{field.type}</span>
                </div>
                {field.validation && (
                  <div className="text-sm text-muted-foreground">
                    {field.validation.min !== undefined && (
                      <div>Min: {field.validation.min}</div>
                    )}
                    {field.validation.max !== undefined && (
                      <div>Max: {field.validation.max}</div>
                    )}
                    {field.validation.pattern && (
                      <div>Pattern: {field.validation.pattern}</div>
                    )}
                  </div>
                )}
                {field.options && field.options.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Options: {field.options.join(', ')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}




