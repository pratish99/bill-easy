import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer';
import connectDB from '@/lib/db';
import BillModel from '@/models/Bill';
import { BillDocument } from '@/components/pdf/BillDocument';
import { Bill } from '@/types';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    const doc = await BillModel.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    const bill = { ...doc, _id: String(doc._id) } as unknown as Bill;

    const now = new Date();
    const generatedAt = now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

    const buffer = await renderToBuffer(
      React.createElement(BillDocument, { bill, generatedAt }) as React.ReactElement<DocumentProps>
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${bill.billNumber}.pdf"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate PDF';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
