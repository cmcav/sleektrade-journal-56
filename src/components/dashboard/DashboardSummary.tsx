
import { ArrowDownRight, ArrowUpRight, BarChart4, CalendarDays, LineChart, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TradingViewChart } from "@/components/charts/TradingViewChart";
import { useTheme } from "@/context/ThemeContext";
import { motion } from "framer-motion";
import { useTradeData } from "@/hooks/useTradeData";

export function DashboardSummary() {
  const { analytics, isLoading } = useTradeData();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium w-24 h-4 bg-muted animate-pulse rounded" />
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold w-16 h-6 bg-muted animate-pulse rounded mt-2 mb-1" />
              <p className="text-xs text-muted-foreground w-20 h-4 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Stats cards 
  const statsData = [
    {
      title: "Total P&L",
      value: `$${analytics.totalPnl.toFixed(2)}`,
      change: analytics.totalPnl >= 0 ? "up" : "down",
      changeText: `${Math.abs(analytics.totalPnl / 100).toFixed(1)}% from last week`,
      icon: LineChart,
    },
    {
      title: "Win Rate",
      value: `${analytics.winRate.toFixed(1)}%`,
      change: analytics.winRate >= 50 ? "up" : "down",
      changeText: `${Math.abs((analytics.winRate - 50) / 5).toFixed(1)}% from average`,
      icon: BarChart4,
    },
    {
      title: "Avg. Trade P&L",
      value: `$${analytics.averagePnl.toFixed(2)}`,
      change: analytics.averagePnl >= 0 ? "up" : "down",
      changeText: `${Math.abs(analytics.averagePnl / 10).toFixed(1)}% per trade`,
      icon: TrendingUp,
    },
    {
      title: "Total Trades",
      value: analytics.totalTrades.toString(),
      change: "neutral",
      changeText: "All time",
      icon: CalendarDays,
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <div className="space-y-6">
      <motion.div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {statsData.map((stat, index) => (
          <motion.div key={index} variants={item}>
            <Card className="glass-card hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`rounded-full p-2 ${
                  stat.change === "up" 
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                    : stat.change === "down" 
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" 
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                }`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  {stat.change === "up" ? (
                    <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
                  ) : stat.change === "down" ? (
                    <ArrowDownRight className="mr-1 h-3 w-3 text-rose-500" />
                  ) : null}
                  {stat.changeText}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div 
        variants={item} 
        initial="hidden" 
        animate="show"
        className="h-[400px] mt-6"
      >
        <TradingViewChart 
          symbol="NASDAQ:AAPL" 
          theme={theme} 
        />
      </motion.div>
    </div>
  );
}
