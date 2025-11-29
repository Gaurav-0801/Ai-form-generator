import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import connectDB from '@/lib/db';
import Submission from '@/models/Submission';
import Form from '@/models/Form';
import mongoose from 'mongoose';
import { z } from 'zod';

const submissionSchema = z.object({
  formId: z.string(),
  responses: z.record(z.any()),
  imageUrls: z.array(z.string()).optional().default([]),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { formId, responses, imageUrls = [] } = submissionSchema.parse(body);

    // Verify form exists
    const form = await Form.findById(formId);
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Create submission (public, no auth required)
    const submission = new Submission({
      formId: new mongoose.Types.ObjectId(formId),
      userId: form.userId, // Associate with form owner
      responses,
      imageUrls,
    });

    await submission.save();

    return NextResponse.json({
      success: true,
      submissionId: submission._id.toString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit form' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId');

    const query: any = { userId: new mongoose.Types.ObjectId(userId) };
    if (formId) {
      query.formId = new mongoose.Types.ObjectId(formId);
    }

    const submissions = await Submission.find(query)
      .populate('formId', 'schema')
      .sort({ submittedAt: -1 })
      .limit(100);

    return NextResponse.json({
      submissions: submissions.map((sub) => ({
        id: sub._id.toString(),
        formId: sub.formId._id.toString(),
        responses: sub.responses,
        imageUrls: sub.imageUrls,
        submittedAt: sub.submittedAt,
      })),
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

