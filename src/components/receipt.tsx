
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Bill } from '@/lib/types';
import { format } from 'date-fns';
import Logo from './logo';
import { useSettings } from '@/context/settings-provider';

interface ReceiptProps {
  bill: Bill | null;
  mode?: 'invoice' | 'receipt';
}

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({ bill, mode }, ref) => {
  const { formatCurrency, settings } = useSettings();
  if (!bill || !settings) return null;

  const isReceipt = mode === 'receipt' || (mode === undefined && bill.receiptNumber !== null);
  const documentTitle = isReceipt ? 'Official Receipt' : 'Invoice';
  const documentId = isReceipt ? bill.receiptNumber : bill.paymentDetails.invoiceNumber;
  const idLabel = isReceipt ? 'Receipt #' : 'Invoice #';

  return (
    <div ref={ref} className="p-6 bg-white text-black text-sm print:p-4 print:w-[80mm] print:mx-auto">
      <div className="text-center space-y-1 mb-6 print:mb-4">
        <h2 className="text-lg font-bold uppercase tracking-widest text-black">
          {documentTitle}
        </h2>
        <div className="flex justify-center">
          <Logo name={settings.clinicName} nameClassName="text-black font-bold" />
        </div>
        <p className="print:text-xs">{settings.clinicAddress}</p>
        <p className="print:text-xs">Tel: {settings.clinicPhone}</p>
      </div>
      <div className="flex justify-between border-y border-dashed py-2 mb-4 print:mb-2 print:text-[10px]">
        <div>
          <p><strong>{idLabel}</strong> {documentId}</p>
          {isReceipt && bill.paymentDetails.parentInvoiceNumber && (
            <p className="text-xs text-muted-foreground print:text-[8px]">
              <strong>Ref Invoice:</strong> {bill.paymentDetails.parentInvoiceNumber}
            </p>
          )}
          <p><strong>Date:</strong> {format(new Date(bill.date), 'dd/MM/yyyy, hh:mm a')}</p>
        </div>
        <div>
          <p><strong>Patient:</strong> {bill.patientName}</p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="print:h-auto">
            <TableHead className="text-black print:text-[10px] print:h-8 px-1">Item</TableHead>
            <TableHead className="text-black text-center print:text-[10px] print:h-8 px-1">Qty</TableHead>
            <TableHead className="text-black text-right print:text-[10px] print:h-8 px-1">Price</TableHead>
            <TableHead className="text-black text-right print:text-[10px] print:h-8 px-1">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bill.items.map((item) => (
            <TableRow key={item.itemId} className="print:h-auto border-dashed">
              <TableCell className="text-black print:text-[10px] py-1 px-1">{item.itemName}</TableCell>
              <TableCell className="text-black text-center print:text-[10px] py-1 px-1">{item.quantity}</TableCell>
              <TableCell className="text-black text-right print:text-[10px] py-1 px-1">{formatCurrency(item.sellingPrice)}</TableCell>
              <TableCell className="text-black text-right print:text-[10px] py-1 px-1">{formatCurrency(item.total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter className="bg-transparent">
          <TableRow className="border-t border-dashed">
            <TableCell colSpan={3} className="text-black text-right font-bold py-1 px-1 print:text-[10px]">Subtotal</TableCell>
            <TableCell className="text-black text-right font-bold py-1 px-1 print:text-[10px]">{formatCurrency(bill.subtotal)}</TableCell>
          </TableRow>
          {bill.discount !== undefined && bill.discount > 0 && (
            <TableRow className="border-none">
              <TableCell colSpan={3} className="text-black text-right font-bold py-1 px-1 print:text-[10px]">Discount</TableCell>
              <TableCell className="text-black text-right font-bold py-1 px-1 print:text-[10px]">-{formatCurrency(bill.discount)}</TableCell>
            </TableRow>
          )}
          <TableRow className="text-base border-none">
            <TableCell colSpan={3} className="text-black text-right font-extrabold py-1 px-1 print:text-[12px]">Grand Total</TableCell>
            <TableCell className="text-black text-right font-extrabold py-1 px-1 print:text-[12px]">{formatCurrency(bill.grandTotal)}</TableCell>
          </TableRow>
          <TableRow className="border-none">
            <TableCell colSpan={3} className="text-black text-right py-1 px-1 print:text-[10px]">Amount Tendered</TableCell>
            <TableCell className="text-black text-right py-1 px-1 print:text-[10px]">{formatCurrency(bill.paymentDetails.amountTendered)}</TableCell>
          </TableRow>
          <TableRow className="border-none">
            <TableCell colSpan={3} className="text-black text-right py-1 px-1 print:text-[10px]">Change</TableCell>
            <TableCell className="text-black text-right py-1 px-1 print:text-[10px]">{formatCurrency(bill.paymentDetails.change)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <div className="text-center text-xs mt-6 print:mt-4 print:text-[10px]">
        <p>Thank you for your business!</p>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';
