
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { PageTransition } from "@/components/layout/PageTransition";
import { TradeForm } from "@/components/trades/TradeForm";
import { TradeList } from "@/components/trades/TradeList";
import { Trade } from "@/hooks/useTradeData";

const Trades = () => {
  // Create shared state to track trades added in the current session
  const [recentlyAddedTrade, setRecentlyAddedTrade] = useState<Trade | null>(null);
  
  // Handler for new trades added
  const handleTradeAdded = (newTrade: Trade) => {
    setRecentlyAddedTrade(newTrade);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageTransition>
        <main className="container mx-auto px-4 pt-24 pb-16">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Trades</h1>
            <p className="text-muted-foreground mt-1">
              Log your trades and track your trading history
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <TradeForm onTradeAdded={handleTradeAdded} />
            <TradeList newTrade={recentlyAddedTrade} />
          </div>
        </main>
      </PageTransition>
    </div>
  );
};

export default Trades;
