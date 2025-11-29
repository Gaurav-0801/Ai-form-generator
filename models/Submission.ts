import mongoose, { Schema } from 'mongoose';
import type { Document } from 'mongoose';

export interface ISubmission extends Document {
  formId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  responses: Record<string, any>;
  imageUrls: string[];
  submittedAt: Date;
}

const SubmissionSchema = new Schema(
  {
    formId: {
      type: Schema.Types.ObjectId,
      ref: 'Form',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    responses: {
      type: Schema.Types.Mixed,
      required: true,
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

SubmissionSchema.index({ formId: 1, submittedAt: -1 });

// Lazy initialization - only create model when accessed (not during build time)
// This prevents build-time evaluation issues with mongoose Document scope
let _submissionModel: mongoose.Model<ISubmission> | null = null;

function getSubmissionModel(): mongoose.Model<ISubmission> {
  if (_submissionModel) {
    return _submissionModel;
  }
  if (mongoose.models && mongoose.models.Submission) {
    _submissionModel = mongoose.models.Submission as mongoose.Model<ISubmission>;
    return _submissionModel;
  }
  _submissionModel = mongoose.model<ISubmission>('Submission', SubmissionSchema);
  return _submissionModel;
}

// Export a Proxy that lazily creates the model on first access
export default new Proxy({} as mongoose.Model<ISubmission>, {
  get(_target, prop) {
    const model = getSubmissionModel();
    const value = (model as any)[prop];
    if (typeof value === 'function') {
      return value.bind(model);
    }
    return value;
  }
});

