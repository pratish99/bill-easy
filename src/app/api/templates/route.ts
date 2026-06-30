import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TemplateModel from '@/models/Template';
import { BillTemplateSchema } from '@/lib/schemas';

export async function GET() {
  try {
    await connectDB();
    const templates = await TemplateModel.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(templates);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const parsed = BillTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const template = await new TemplateModel(parsed.data).save();
    return NextResponse.json(template.toObject(), { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create template';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
