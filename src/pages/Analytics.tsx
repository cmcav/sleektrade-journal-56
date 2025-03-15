
import { Navbar } from "@/components/layout/Navbar";
import { PageTransition } from "@/components/layout/PageTransition";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTradeData } from "@/hooks/useTradeData";
import { useTheme } from "@/context/ThemeContext";
import { Calendar, LineChart } from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";

const Analytics = () => {
  const { trades, analytics, isLoading } = useTradeData();
  const { theme } = useTheme();
  
  // Generate performance data for chart
  const generatePerformanceData = () => {
    // In a real app, this would aggregate actual trade data
    // This is just sample data for the demo
    return [
      { date: "Jan", pnl: 120 },
      { date: "Feb", pnl: -50 },
      { date: "Mar", pnl: 200 },
      { date: "Apr", pnl: 80 },
      { date: "May", pnl: -30 },
      { date: "Jun", pnl: 150 },
      { date: "Jul", pnl: 220 },
    ];
  };

  // Generate strategy performance for pie chart
  const generateStrategyData = () => {
    const strategies = trades.reduce((acc, trade) => {
      acc[trade.strategy] = (acc[trade.strategy] || 0) + trade.pnl;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(strategies).map(([name, pnl]) => ({
      name,
      value: pnl,
    }));
  };

  // Colors for pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageTransition>
        <main className="container mx-auto px-4 pt-24 pb-16">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Detailed analysis of your trading performance
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-8 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i} className="glass-card p-6 h-[400px] animate-pulse flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-muted"></div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Performance Over Time Chart */}
              <Card className="glass-card p-6">
                <div className="flex items-center mb-6">
                  <LineChart className="mr-2 h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Performance Over Time</h2>
                </div>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={generatePerformanceData()}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#333" : "#eee"} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: theme === "dark" ? "#aaa" : "#333" }} 
                      />
                      <YAxis 
                        tick={{ fill: theme === "dark" ? "#aaa" : "#333" }}
                        tickFormatter={(value) => `$${value}`} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === "dark" ? "#222" : "#fff",
                          borderColor: theme === "dark" ? "#333" : "#eee",
                          color: theme === "dark" ? "#fff" : "#333",
                        }}
                        formatter={(value: number) => [`$${value}`, "P&L"]}
                      />
                      <defs>
                        <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="pnl" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1} 
                        fill="url(#pnlGradient)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <div className="grid gap-8 md:grid-cols-2">
                {/* Strategy Performance */}
                <Card className="glass-card p-6">
                  <div className="flex items-center mb-6">
                    <Calendar className="mr-2 h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Strategy Performance</h2>
                  </div>
                  
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={generateStrategyData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {generateStrategyData().map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`$${value.toFixed(2)}`, "P&L"]}
                          contentStyle={{ 
                            backgroundColor: theme === "dark" ? "#222" : "#fff",
                            borderColor: theme === "dark" ? "#333" : "#eee",
                            color: theme === "dark" ? "#fff" : "#333",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Performance Stats */}
                <Card className="glass-card p-6">
                  <div className="flex items-center mb-6">
                    <LineChart className="mr-2 h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Performance Stats</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total P&L</p>
                        <p className={`text-2xl font-bold ${
                          analytics.totalPnl >= 0 
                            ? "text-emerald-600 dark:text-emerald-400" 
                            : "text-rose-600 dark:text-rose-400"
                        }`}>
                          ${analytics.totalPnl.toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Win Rate</p>
                        <p className="text-2xl font-bold">{analytics.winRate.toFixed(1)}%</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Average P&L</p>
                        <p className={`text-2xl font-bold ${
                          analytics.averagePnl >= 0 
                            ? "text-emerald-600 dark:text-emerald-400" 
                            : "text-rose-600 dark:text-rose-400"
                        }`}>
                          ${analytics.averagePnl.toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Trades</p>
                        <p className="text-2xl font-bold">{analytics.totalTrades}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Best Performing Symbol</p>
                      <p className="text-2xl font-bold">
                        {trades.length > 0 
                          ? trades.reduce((prev, current) => 
                              prev.pnl > current.pnl ? prev : current
                            ).symbol
                          : "N/A"
                        }
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </main>
      </PageTransition>
    </div>
  );
};

export default Analytics;
