
import { useState } from "react";
import { useAIStrategies } from "@/hooks/useAIStrategies";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Calendar, Clock, LineChart, AlertTriangle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function AIStrategyList() {
  const { strategies, removeStrategy, isLoading } = useAIStrategies();
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card className="bg-muted/40">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <h3 className="text-lg font-medium">Loading strategies</h3>
          <p className="text-muted-foreground mt-1">
            Retrieving your saved trading strategies
          </p>
        </CardContent>
      </Card>
    );
  }

  if (strategies.length === 0) {
    return (
      <Card className="bg-muted/40">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <LineChart className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No strategies yet</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            Generate your first AI trading strategy to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  const strategy = strategies.find(s => s.id === selectedStrategy);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {strategies.map((strategy) => (
          <Card key={strategy.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{strategy.name}</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeStrategy(strategy.id)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <CardDescription className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(strategy.createdAt), { addSuffix: true })}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">{strategy.symbol}</Badge>
                <Badge variant="outline">{strategy.timeframe === 'D' ? 'Daily' : 
                  strategy.timeframe === 'W' ? 'Weekly' : 
                  `${strategy.timeframe}min`}
                </Badge>
                <div className="flex items-center ml-auto">
                  <AlertTriangle className={`h-3.5 w-3.5 mr-1 ${
                    strategy.riskLevel <= 3 ? 'text-green-500' :
                    strategy.riskLevel <= 7 ? 'text-yellow-500' : 'text-red-500'
                  }`} />
                  <span className="text-xs font-medium">Risk: {strategy.riskLevel}/10</span>
                </div>
              </div>
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {strategy.content.slice(0, 100)}...
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="link" 
                    className="px-0 mt-2"
                    onClick={() => setSelectedStrategy(strategy.id)}
                  >
                    View full strategy
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{strategy.name}</DialogTitle>
                    <DialogDescription className="flex items-center space-x-3">
                      <span>{strategy.symbol}</span>
                      <span>•</span>
                      <span>{strategy.timeframe === 'D' ? 'Daily' : 
                        strategy.timeframe === 'W' ? 'Weekly' : 
                        `${strategy.timeframe}min`} timeframe
                      </span>
                      <span>•</span>
                      <span className="flex items-center">
                        <AlertTriangle className={`h-3.5 w-3.5 mr-1 ${
                          strategy.riskLevel <= 3 ? 'text-green-500' :
                          strategy.riskLevel <= 7 ? 'text-yellow-500' : 'text-red-500'
                        }`} />
                        Risk: {strategy.riskLevel}/10
                      </span>
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-[60vh]">
                    <div className="whitespace-pre-wrap font-mono text-sm p-4 bg-muted/30 rounded-md">
                      {strategy.content}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
