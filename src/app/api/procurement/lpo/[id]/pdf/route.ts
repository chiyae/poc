import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/app/auth-actions';
import { pdf } from '@react-pdf/renderer';
import React from 'react';
import LpoPdfDocument from '@/components/procurement/lpo-pdf-document';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth Check
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;

    // 2. Fetch LPO
    const [lpo] = await db
      .select()
      .from(schema.localPurchaseOrders)
      .where(eq(schema.localPurchaseOrders.id, id));

    if (!lpo) {
      return new NextResponse('LPO Not Found', { status: 404 });
    }

    // 3. Fetch Settings
    const [settingsRecord] = await db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.id, 'clinic'));

    const settings = settingsRecord?.value as any || {};

    // 4. Define Helper Format Function
    const currencySymbol = settings.currency || 'MWK';
    const formatCurrency = (val: number) => {
      return `${currencySymbol} ${val.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    };

    // 5. Generate PDF on the server
    const pdfStream = await pdf(
      React.createElement(LpoPdfDocument, {
        lpo: lpo as any,
        settings,
        formatCurrency,
      }) as any
    ).toBuffer();

    // 6. Return response
    return new NextResponse(pdfStream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="LPO_${lpo.lpoNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Server PDF Generation Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
