
import { Navbar } from "@/components/layout/Navbar";
import { PageTransition } from "@/components/layout/PageTransition";
import { DashboardSummary } from "@/components/dashboard/DashboardSummary";
import { TradeList } from "@/components/trades/TradeList";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageTransition>
        <main className="container mx-auto px-4 pt-24 pb-16">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview of your trading performance and recent activity
            </p>
          </div>

          <div className="space-y-8">
            <DashboardSummary />
            <TradeList newTrade={null} />
          </div>
        </main>
      </PageTransition>
    </div>
  );
};

export default Dashboard;
