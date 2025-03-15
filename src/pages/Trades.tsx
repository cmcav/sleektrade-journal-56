
import { Navbar } from "@/components/layout/Navbar";
import { PageTransition } from "@/components/layout/PageTransition";
import { TradeForm } from "@/components/trades/TradeForm";
import { TradeList } from "@/components/trades/TradeList";

const Trades = () => {
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
            <TradeForm />
            <TradeList />
          </div>
        </main>
      </PageTransition>
    </div>
  );
};

export default Trades;
