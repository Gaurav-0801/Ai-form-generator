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

// Create index for userId
FormSchemaDefinition.index({ userId: 1 });
// Note: Vector search index for 'embedding' field should be created in MongoDB Atlas, not here

// Ensure model is only created once
let FormModel: mongoose.Model<IForm>;

if (mongoose.models.Form) {
  FormModel = mongoose.models.Form;
} else {
  FormModel = mongoose.model<IForm>('Form', FormSchemaDefinition);
}

export default FormModel;

