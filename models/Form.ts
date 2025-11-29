import mongoose, { Schema } from 'mongoose';
import type { Document } from 'mongoose';

// Import User model first to ensure it's initialized before Form
// This helps with model reference initialization order
import './User';

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
      type: Schema.Types.Mixed,
      required: true,
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
export default new Proxy(function FormConstructor(...args: any[]) {
  // Handle constructor call: new Form({...})
  const model = getFormModel();
  return new (model as any)(...args);
} as any as mongoose.Model<IForm>, {
  get(_target, prop) {
    const model = getFormModel();
    const value = (model as any)[prop];
    if (typeof value === 'function') {
      return value.bind(model);
    }
    return value;
  },
  // Handle 'new' operator
  construct(_target, args) {
    const model = getFormModel();
    return new (model as any)(...args);
  }
});

