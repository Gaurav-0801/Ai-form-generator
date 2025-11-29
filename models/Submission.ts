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

// Ensure model is only created once
let SubmissionModel: mongoose.Model<ISubmission>;

try {
  if (mongoose.models && mongoose.models.Submission) {
    SubmissionModel = mongoose.models.Submission as mongoose.Model<ISubmission>;
  } else {
    SubmissionModel = mongoose.model<ISubmission>('Submission', SubmissionSchema);
  }
} catch (error) {
  // Fallback for build-time evaluation issues
  SubmissionModel = mongoose.model<ISubmission>('Submission', SubmissionSchema);
}

export default SubmissionModel;

