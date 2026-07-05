import StockTakingBoard from '@/components/stock-taking-board';

export default function DispensaryStockTakingPage() {
  return <StockTakingBoard locationId="dispensary" returnPath="/dispensary/stock-take-history" />;
}
