import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmission extends Document {
  formId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  responses: Record<string, any>;
  imageUrls: string[];
  submittedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
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

export default mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);

