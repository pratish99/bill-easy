import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import BillModel from '@/models/Bill';
import { BillSchema } from '@/lib/schemas';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const bill = await BillModel.findById(id).lean();
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }
    return NextResponse.json(bill);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch bill' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    const body = await request.json();
    // Partial validation — allow partial updates but validate the shape of what's provided
    const parsed = BillSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const bill = await BillModel.findById(id);
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    Object.assign(bill, parsed.data);
    // .save() triggers the pre-save middleware that recomputes subtotal/taxAmount/total
    await bill.save();

    return NextResponse.json(bill.toObject());
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update bill';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Hard delete — no soft-delete flag on the Bill model
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const bill = await BillModel.findByIdAndDelete(id);
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete bill' }, { status: 500 });
  }
}
