
import { useState, useEffect } from "react";
import { Crown, Trophy, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { PageTransition } from "@/components/layout/PageTransition";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface LeaderboardUser {
  user_id: string;
  username: string | null;
  total_pnl: number;
  win_rate: number;
  trade_count: number;
  rank: number;
}

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setIsLoading(true);
      try {
        // Get aggregated trade data grouped by user
        const { data, error } = await supabase
          .from('trades')
          .select('user_id, symbol, pnl')
          .order('pnl', { ascending: false });

        if (error) throw error;

        // Process and aggregate the data
        const userMap = new Map<string, LeaderboardUser>();
        
        data.forEach(trade => {
          if (!userMap.has(trade.user_id)) {
            userMap.set(trade.user_id, {
              user_id: trade.user_id,
              username: `Trader ${userMap.size + 1}`, // Generate placeholder names
              total_pnl: 0,
              win_rate: 0,
              trade_count: 0,
              rank: 0
            });
          }
          
          const userData = userMap.get(trade.user_id)!;
          userData.total_pnl += Number(trade.pnl || 0);
          userData.trade_count += 1;
        });

        // Calculate win rates
        for (let user of userMap.values()) {
          const winningTrades = data.filter(t => t.user_id === user.user_id && Number(t.pnl) > 0).length;
          user.win_rate = user.trade_count > 0 ? (winningTrades / user.trade_count) * 100 : 0;
        }

        // Sort by total PnL and assign ranks
        const sortedUsers = Array.from(userMap.values())
          .sort((a, b) => b.total_pnl - a.total_pnl)
          .map((user, index) => ({ ...user, rank: index + 1 }));

        setLeaderboardData(sortedUsers);
      } catch (error: any) {
        console.error("Error fetching leaderboard data:", error);
        toast({
          title: "Error loading leaderboard",
          description: error.message,
          variant: "destructive",
        });
        
        // Provide sample data as fallback
        const sampleData: LeaderboardUser[] = [
          {
            user_id: "1",
            username: "TradingMaster",
            total_pnl: 12580.75,
            win_rate: 72.5,
            trade_count: 145,
            rank: 1
          },
          {
            user_id: "2",
            username: "StockGuru",
            total_pnl: 9750.25,
            win_rate: 68.3,
            trade_count: 126,
            rank: 2
          },
          {
            user_id: "3",
            username: "MarketWhiz",
            total_pnl: 8420.50,
            win_rate: 65.7,
            trade_count: 108,
            rank: 3
          },
          {
            user_id: "4",
            username: "InvestorPro",
            total_pnl: 7320.80,
            win_rate: 63.2,
            trade_count: 95,
            rank: 4
          },
          {
            user_id: "5",
            username: "WealthBuilder",
            total_pnl: 6250.45,
            win_rate: 61.8,
            trade_count: 86,
            rank: 5
          }
        ];
        setLeaderboardData(sampleData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [toast]);

  return (
    <>
      <Navbar />
      <PageTransition>
        <div className="container mx-auto px-4 py-20">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Trader Leaderboard</h1>
            <p className="text-muted-foreground">Top performers ranked by total profit</p>
          </div>

          <Card className="glass-card p-6 mb-10">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-muted rounded w-1/4"></div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="h-12 bg-muted rounded"></div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {leaderboardData.slice(0, 3).map((trader, index) => (
                    <Card key={trader.user_id} className={`p-6 text-center glass border-2 ${
                      index === 0 ? 'border-yellow-400 dark:border-yellow-600' :
                      index === 1 ? 'border-gray-400 dark:border-gray-500' :
                      'border-amber-600 dark:border-amber-700'
                    }`}>
                      <div className="flex justify-center mb-4">
                        {index === 0 ? (
                          <Crown className="h-12 w-12 text-yellow-400 dark:text-yellow-300" />
                        ) : index === 1 ? (
                          <Trophy className="h-12 w-12 text-gray-400 dark:text-gray-300" />
                        ) : (
                          <Award className="h-12 w-12 text-amber-600 dark:text-amber-500" />
                        )}
                      </div>
                      <h3 className="text-xl font-bold mb-1 flex items-center justify-center">
                        {trader.username}
                        {index === 0 && <Crown className="h-5 w-5 ml-2 text-yellow-400 dark:text-yellow-300" />}
                      </h3>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                        ${trader.total_pnl.toLocaleString('en-US', {maximumFractionDigits: 2})}
                      </p>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Win Rate: {trader.win_rate.toFixed(1)}%</span>
                        <span>Trades: {trader.trade_count}</span>
                      </div>
                    </Card>
                  ))}
                </div>

                <Separator className="my-6" />

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Trader</TableHead>
                      <TableHead>Total P&L</TableHead>
                      <TableHead>Win Rate</TableHead>
                      <TableHead className="text-right">Trade Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboardData.map((trader) => (
                      <TableRow key={trader.user_id} className={trader.rank === 1 ? "bg-yellow-50/10" : ""}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1">
                            {trader.rank}
                            {trader.rank === 1 && <Crown className="h-4 w-4 text-yellow-400" />}
                          </div>
                        </TableCell>
                        <TableCell>{trader.username}</TableCell>
                        <TableCell className={`font-semibold ${
                          trader.total_pnl > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          ${trader.total_pnl.toLocaleString('en-US', {maximumFractionDigits: 2})}
                        </TableCell>
                        <TableCell>{trader.win_rate.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{trader.trade_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </Card>
        </div>
      </PageTransition>
    </>
  );
}
