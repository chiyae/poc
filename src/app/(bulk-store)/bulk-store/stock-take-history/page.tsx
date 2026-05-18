
'use client';

import StockTakeHistoryTable from '@/components/stock-take-history-table';

export default function BulkStoreStockTakeHistoryPage() {
  return (
    <StockTakeHistoryTable
      locationId="bulk-store"
      title="Bulk Store Stock-Take History"
      description="History of main store audits."
      cardTitle="Session History"
      cardDescription="All previous and active audits of the Bulk Store."
      linkPrefix="/bulk-store"
    />
  );
}
