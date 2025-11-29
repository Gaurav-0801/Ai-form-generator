import mongoose, { Schema, Document } from 'mongoose';

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'number' | 'file' | 'textarea' | 'select' | 'checkbox' | 'radio';
  label: string;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  options?: string[];
}

export interface FormSchema {
  title: string;
  description?: string;
  fields: FormField[];
}

export interface IForm extends Document {
  userId: mongoose.Types.ObjectId;
  schema: FormSchema;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

const FormSchemaDefinition = new Schema<IForm>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    schema: {
      title: { type: String, required: true },
      description: { type: String },
      fields: [
        {
          id: { type: String, required: true },
          type: {
            type: String,
            enum: ['text', 'email', 'number', 'file', 'textarea', 'select', 'checkbox', 'radio'],
            required: true,
          },
          label: { type: String, required: true },
          required: { type: Boolean, default: false },
          validation: {
            min: Number,
            max: Number,
            pattern: String,
          },
          options: [String],
        },
      ],
    },
    embedding: {
      type: [Number],
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for vector search (MongoDB Atlas Vector Search)
FormSchemaDefinition.index({ userId: 1 });
FormSchemaDefinition.index({ embedding: '2dsphere' });

export default mongoose.models.Form || mongoose.model<IForm>('Form', FormSchemaDefinition);

