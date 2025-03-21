
import { useState, useEffect } from "react";
import { Crown, Trophy, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { PageTransition } from "@/components/layout/PageTransition";
import { Navbar } from "@/components/layout/Navbar";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Confetti } from "@/components/ui/confetti";

interface LeaderboardUser {
  id: string;
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
  const [showConfetti, setShowConfetti] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setIsLoading(true);
      try {
        // Get data from the leaderboard table
        const { data, error } = await supabase
          .from('leaderboard')
          .select('*')
          .order('total_pnl', { ascending: false });

        if (error) throw error;

        // Add rank to each user
        const rankedData = data.map((user, index) => ({
          ...user,
          rank: index + 1,
          total_pnl: Number(user.total_pnl),
          win_rate: Number(user.win_rate)
        }));

        setLeaderboardData(rankedData);
        
        // Show confetti for first place
        if (rankedData.length > 0) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
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
            id: "1",
            user_id: "1",
            username: "TradingMaster",
            total_pnl: 12580.75,
            win_rate: 72.5,
            trade_count: 145,
            rank: 1
          },
          {
            id: "2",
            user_id: "2",
            username: "StockGuru",
            total_pnl: 9750.25,
            win_rate: 68.3,
            trade_count: 126,
            rank: 2
          },
          {
            id: "3",
            user_id: "3",
            username: "MarketWhiz",
            total_pnl: 8420.50,
            win_rate: 65.7,
            trade_count: 108,
            rank: 3
          },
          {
            id: "4",
            user_id: "4",
            username: "InvestorPro",
            total_pnl: 7320.80,
            win_rate: 63.2,
            trade_count: 95,
            rank: 4
          },
          {
            id: "5",
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
    
    // Set up a subscription to real-time updates for leaderboard table
    const leaderboardSubscription = supabase
      .channel('public:leaderboard')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leaderboard'
      }, () => {
        // Refresh leaderboard data when leaderboard changes
        fetchLeaderboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(leaderboardSubscription);
    };
  }, [toast]);

  // Get rank style based on position
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-amber-100 dark:bg-amber-950 border-amber-400 dark:border-amber-600";
      case 2:
        return "bg-slate-100 dark:bg-slate-900 border-slate-400 dark:border-slate-500";
      case 3:
        return "bg-orange-100 dark:bg-orange-950 border-orange-400 dark:border-orange-700";
      default:
        return "";
    }
  };

  // Get rank icon based on position
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
      case 2:
        return <Trophy className="h-4 w-4 text-slate-500 dark:text-slate-400" />;
      case 3:
        return <Award className="h-4 w-4 text-orange-700 dark:text-orange-500" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Navbar />
      <PageTransition>
        <div className="container mx-auto px-4 py-20">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Trader Leaderboard</h1>
            <p className="text-muted-foreground">
              Top performers ranked by total profit
              <Badge variant="secondary" className="ml-2 font-normal">Real-time Updates</Badge>
            </p>
          </div>

          <Confetti show={showConfetti} duration={3000} />

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
                    <Card key={trader.id} className={`p-6 text-center glass border-2 ${
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
                        {trader.username || `Trader ${trader.rank}`}
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
                      <TableRow key={trader.id} className={getRankStyle(trader.rank)}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1">
                            {trader.rank}
                            {getRankIcon(trader.rank)}
                          </div>
                        </TableCell>
                        <TableCell>{trader.username || `Trader ${trader.rank}`}</TableCell>
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
