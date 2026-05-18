
'use client';

import StockTakeHistoryTable from '@/components/stock-take-history-table';

export default function StockTakeHistoryPage() {
  return (
    <StockTakeHistoryTable
      title="Stock-Take History"
      description="A chronological list of all stock-take sessions."
      cardTitle="All Sessions"
      cardDescription="A chronological list of all completed and ongoing stock-take sessions."
      linkPrefix="/dispensary"
      showLocationColumn
    />
  );
}
