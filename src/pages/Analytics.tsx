
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
  Cell,
  Legend
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import { format } from "date-fns";

const Analytics = () => {
  const { trades, analytics, isLoading } = useTradeData();
  const { theme } = useTheme();
  
  // Generate performance data from actual trades
  const generatePerformanceData = () => {
    if (trades.length === 0) return [];
    
    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
    );
    
    // Group trades by month for visualization
    const tradesByMonth: Record<string, number> = {};
    
    sortedTrades.forEach(trade => {
      const date = new Date(trade.entryDate);
      const monthYear = format(date, 'MMM yyyy');
      
      if (!tradesByMonth[monthYear]) {
        tradesByMonth[monthYear] = 0;
      }
      
      tradesByMonth[monthYear] += trade.pnl;
    });
    
    // Transform to chart data format
    return Object.entries(tradesByMonth).map(([date, pnl]) => ({
      date,
      pnl: Number(pnl.toFixed(2))
    }));
  };

  // Generate strategy performance for pie chart
  const generateStrategyData = () => {
    const strategies = trades.reduce((acc, trade) => {
      const strategy = trade.strategy || 'Undefined';
      acc[strategy] = (acc[strategy] || 0) + trade.pnl;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(strategies).map(([name, pnl]) => ({
      name,
      value: Math.abs(pnl), // Using absolute value for pie size
      actualPnl: pnl, // Keeping the actual value for tooltips
      fill: pnl >= 0 ? "#4ade80" : "#f43f5e", // Green for profit, red for loss
    }));
  };

  // Colors for pie chart - using more accessible colors
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];
  
  // Custom tooltip formatter for strategy chart
  const strategyTooltipFormatter = (value: number, name: string, entry: any) => {
    const actualPnl = entry.payload.actualPnl;
    const sign = actualPnl >= 0 ? "+" : "";
    return [`${sign}$${actualPnl.toFixed(2)}`, name];
  };

  // Format trades for display
  const performanceData = generatePerformanceData();
  const strategyData = generateStrategyData();

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
                  {performanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={performanceData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#333" : "#eee"} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: theme === "dark" ? "#aaa" : "#333" }}
                          tickMargin={10}
                          height={60}
                          padding={{ left: 10, right: 10 }}
                        />
                        <YAxis 
                          tick={{ fill: theme === "dark" ? "#aaa" : "#333" }}
                          tickFormatter={(value) => `$${value}`}
                          width={80}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === "dark" ? "#222" : "#fff",
                            borderColor: theme === "dark" ? "#333" : "#eee",
                            color: theme === "dark" ? "#fff" : "#333",
                            padding: "10px",
                            borderRadius: "4px"
                          }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`, "P&L"]}
                          labelStyle={{ fontWeight: "bold", marginBottom: "5px" }}
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
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">No trade data available</p>
                    </div>
                  )}
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
                    {strategyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 30 }}>
                          <Pie
                            data={strategyData}
                            cx="50%"
                            cy="45%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            nameKey="name"
                            label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {strategyData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.fill || COLORS[index % COLORS.length]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={strategyTooltipFormatter}
                            contentStyle={{ 
                              backgroundColor: theme === "dark" ? "#222" : "#fff",
                              borderColor: theme === "dark" ? "#333" : "#eee",
                              color: theme === "dark" ? "#fff" : "#333",
                              padding: "8px",
                              borderRadius: "4px"
                            }}
                          />
                          <Legend 
                            layout="horizontal" 
                            verticalAlign="bottom" 
                            align="center"
                            wrapperStyle={{ paddingTop: "20px" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">No strategy data available</p>
                      </div>
                    )}
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
