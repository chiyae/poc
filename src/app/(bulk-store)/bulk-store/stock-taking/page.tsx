import StockTakingBoard from '@/components/stock-taking-board';

export default function BulkStoreStockTakingPage() {
  return <StockTakingBoard locationId="bulk-store" returnPath="/bulk-store/stock-take-history" />;
}
