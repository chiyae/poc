'use client';

import * as React from 'react';
import { PDFViewer, BlobProvider } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { LocalPurchaseOrder } from '@/lib/types';
import LpoPdfDocument from './lpo-pdf-document';

interface LpoPdfActionsProps {
  lpo: LocalPurchaseOrder;
  settings: any;
  formatCurrency: (value: number) => string;
  isMobile: boolean;
}

export default function LpoPdfActions({ lpo, settings, formatCurrency, isMobile }: LpoPdfActionsProps) {
  const fileName = `LPO_${lpo.lpoNumber}.pdf`;

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 space-y-4 text-center">
        <p className="text-muted-foreground text-sm max-w-md">
          Mobile browsers do not support inline PDF previews. Please download the PDF to view and print it.
        </p>
        <BlobProvider document={<LpoPdfDocument lpo={lpo} settings={settings} formatCurrency={formatCurrency} />}>
          {({ url, loading, error }) => {
            if (loading) {
              return <Button disabled>Generating PDF...</Button>;
            }
            if (error) {
              return <p className="text-destructive">Error generating PDF</p>;
            }
            return (
              <Button asChild className="gap-2">
                <a href={url || '#'} download={fileName}>
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              </Button>
            );
          }}
        </BlobProvider>
      </div>
    );
  }

  return (
    <PDFViewer width="100%" height="100%">
      <LpoPdfDocument lpo={lpo} settings={settings} formatCurrency={formatCurrency} />
    </PDFViewer>
  );
}
