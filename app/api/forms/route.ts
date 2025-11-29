import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import connectDB from '@/lib/db';
import Form from '@/models/Form';
import Submission from '@/models/Submission';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    await connectDB();

    // Get all forms for the user
    const forms = await Form.find({
      userId: new mongoose.Types.ObjectId(userId),
    }).sort({ createdAt: -1 });

    // Get submission counts for each form
    const formsWithCounts = await Promise.all(
      forms.map(async (form) => {
        const count = await Submission.countDocuments({
          formId: form._id,
        });

        return {
          id: form._id.toString(),
          schema: form.schema,
          submissionCount: count,
          createdAt: form.createdAt,
        };
      })
    );

    return NextResponse.json({ forms: formsWithCounts });
  } catch (error) {
    console.error('Get forms error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forms' },
      { status: 500 }
    );
  }
}


