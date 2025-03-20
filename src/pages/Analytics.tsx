import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { PageTransition } from "@/components/layout/PageTransition";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTradeData } from "@/hooks/useTradeData";
import { useTheme } from "@/context/ThemeContext";
import { Calendar, LineChart, PieChart as PieChartIcon } from "lucide-react";
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

import { Spinner } from "@/components/ui/spinner";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import { format, subDays, subMonths, subYears, isWithinInterval, startOfDay, endOfDay, parseISO } from "date-fns";
import { TradeJournal } from "@/components/journal/TradeJournal";

const Analytics = () => {
  const { trades, analytics, isLoading } = useTradeData();
  const { theme } = useTheme();
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month" | "year">("month");
  
  // Generate performance data based on selected timeframe
  const generatePerformanceData = () => {
    if (trades.length === 0) return [];
    
    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
    );
    
    const now = new Date();
    let startDate;
    let dateFormat;
    
    // Determine start date and format based on timeframe
    switch (timeframe) {
      case "day":
        startDate = subDays(now, 1);
        dateFormat = "HH:mm";
        break;
      case "week":
        startDate = subDays(now, 7);
        dateFormat = "EEE";
        break;
      case "month":
        startDate = subMonths(now, 1);
        dateFormat = "MMM dd";
        break;
      case "year":
        startDate = subYears(now, 1);
        dateFormat = "MMM yyyy";
        break;
      default:
        startDate = subMonths(now, 1);
        dateFormat = "MMM dd";
    }
    
    // Filter trades by selected timeframe
    const filteredTrades = sortedTrades.filter(trade => {
      const tradeDate = new Date(trade.entry_date);
      return isWithinInterval(tradeDate, {
        start: startOfDay(startDate),
        end: endOfDay(now)
      });
    });
    
    // Group trades by appropriate time period
    const tradesByPeriod: Record<string, number> = {};
    
    filteredTrades.forEach(trade => {
      const date = parseISO(trade.entry_date);
      const formattedDate = format(date, dateFormat);
      
      if (!tradesByPeriod[formattedDate]) {
        tradesByPeriod[formattedDate] = 0;
      }
      
      tradesByPeriod[formattedDate] += trade.pnl;
    });
    
    // Transform to chart data format
    return Object.entries(tradesByPeriod).map(([date, pnl]) => ({
      date,
      pnl: Number(pnl.toFixed(2))
    }));
  };

  // Enhanced colors for strategy pie chart - more distinct and visually appealing
  const STRATEGY_COLORS = [
    "#8B5CF6", // Purple
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EC4899", // Pink
    "#EF4444", // Red
    "#06B6D4", // Cyan
    "#6366F1", // Indigo
    "#F97316", // Orange
    "#84CC16", // Lime
    "#14B8A6", // Teal
    "#D946EF"  // Fuchsia
  ];

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
  
  // Custom tooltip formatter for strategy chart
  const strategyTooltipFormatter = (value: number, name: string, entry: any) => {
    const actualPnl = entry.payload.actualPnl;
    const sign = actualPnl >= 0 ? "+" : "";
    return [`${sign}$${actualPnl.toFixed(2)}`, name];
  };

  // Format trades for display
  const performanceData = generatePerformanceData();
  const strategyData = generateStrategyData();

  // Get appropriate title based on selected timeframe
  const getTimeframeTitle = () => {
    switch (timeframe) {
      case "day": return "Last 24 Hours";
      case "week": return "Last 7 Days";
      case "month": return "Last 30 Days";
      case "year": return "Last 12 Months";
      default: return "Performance Over Time";
    }
  };
  
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
            <div className="flex justify-center items-center h-[400px]">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Performance Over Time Chart with Timeframe Selector */}
              <Card className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <LineChart className="mr-2 h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">{getTimeframeTitle()}</h2>
                  </div>
                  
                  <Tabs defaultValue={timeframe} onValueChange={(value) => setTimeframe(value as "day" | "week" | "month" | "year")}>
                    <TabsList>
                      <TabsTrigger value="day">Day</TabsTrigger>
                      <TabsTrigger value="week">Week</TabsTrigger>
                      <TabsTrigger value="month">Month</TabsTrigger>
                      <TabsTrigger value="year">Year</TabsTrigger>
                    </TabsList>
                  </Tabs>
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
                      <p className="text-muted-foreground">No trade data available for this time period</p>
                    </div>
                  )}
                </div>
              </Card>

              <div className="grid gap-8 md:grid-cols-2">
                {/* Strategy Performance with enhanced colors */}
                <Card className="glass-card p-6">
                  <div className="flex items-center mb-6">
                    <PieChartIcon className="mr-2 h-5 w-5 text-primary" />
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
                                fill={STRATEGY_COLORS[index % STRATEGY_COLORS.length]}
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
              
              {/* Trade Journal Section */}
              <TradeJournal />
            </div>
          )}
        </main>
      </PageTransition>
    </div>
  );
};

export default Analytics;
