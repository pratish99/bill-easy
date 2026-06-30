import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import BillModel from '@/models/Bill';
import { BillSchema } from '@/lib/schemas';

export async function GET() {
  try {
    await connectDB();
    const bills = await BillModel.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(bills);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const parsed = BillSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;
    if (!data.billNumber) {
      data.billNumber = await BillModel.generateBillNumber();
    }

    const bill = await new BillModel(data).save();
    return NextResponse.json(bill.toObject(), { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create bill';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
