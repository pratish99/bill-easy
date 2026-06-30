import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TemplateModel from '@/models/Template';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const template = await TemplateModel.findById(id).lean();
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    return NextResponse.json(template);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const template = await TemplateModel.findByIdAndDelete(id);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
