import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import connectDB from '@/lib/db';
import Form from '@/models/Form';
import Submission from '@/models/Submission';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const formId = params.id;

    // Check if form exists (public access for viewing)
    const form = await Form.findById(formId);
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Get submission count
    const submissionCount = await Submission.countDocuments({ formId });

    return NextResponse.json({
      form: {
        id: form._id.toString(),
        schema: form.schema,
        createdAt: form.createdAt,
      },
      submissionCount,
    });
  } catch (error) {
    console.error('Get form error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    await connectDB();
    const formId = params.id;

    // Verify ownership
    const form = await Form.findOne({
      _id: formId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete form and associated submissions
    await Form.deleteOne({ _id: formId });
    await Submission.deleteMany({ formId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete form error:', error);
    return NextResponse.json(
      { error: 'Failed to delete form' },
      { status: 500 }
    );
  }
}

