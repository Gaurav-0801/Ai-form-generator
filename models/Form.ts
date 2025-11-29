import mongoose, { Schema } from 'mongoose';
import type { Document } from 'mongoose';

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

const FormSchemaDefinition = new Schema(
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

// Lazy initialization - only create model when accessed (not during build time)
// This prevents build-time evaluation issues with mongoose Document scope
let _formModel: mongoose.Model<IForm> | null = null;

function getFormModel(): mongoose.Model<IForm> {
  if (_formModel) {
    return _formModel;
  }
  if (mongoose.models && mongoose.models.Form) {
    _formModel = mongoose.models.Form as mongoose.Model<IForm>;
    return _formModel;
  }
  _formModel = mongoose.model<IForm>('Form', FormSchemaDefinition);
  return _formModel;
}

// Export a Proxy that lazily creates the model on first access
export default new Proxy({} as mongoose.Model<IForm>, {
  get(_target, prop) {
    const model = getFormModel();
    const value = (model as any)[prop];
    if (typeof value === 'function') {
      return value.bind(model);
    }
    return value;
  }
});

