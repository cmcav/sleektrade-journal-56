
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { TradingViewChart } from "@/components/charts/TradingViewChart";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAIStrategies } from "@/hooks/useAIStrategies";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, CreditCard } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { useUserCredits } from "@/hooks/useUserCredits";
import { Progress } from "@/components/ui/progress";
import { v4 as uuidv4 } from "uuid";

export function AIStrategyGenerator() {
  const [symbol, setSymbol] = useState("NASDAQ:AAPL");
  const [timeframe, setTimeframe] = useState("D");
  const [riskLevel, setRiskLevel] = useState([5]); // 1-10 scale
  const [strategyName, setStrategyName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStrategy, setGeneratedStrategy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addStrategy } = useAIStrategies();
  const { toast } = useToast();
  const { user } = useAuth();
  const { credits, hasEnoughCredits, getAvailableCredits, refreshCredits } = useUserCredits();

  const timeframes = [
    { value: "1", label: "1 Minute" },
    { value: "5", label: "5 Minutes" },
    { value: "15", label: "15 Minutes" },
    { value: "30", label: "30 Minutes" },
    { value: "60", label: "1 Hour" },
    { value: "D", label: "1 Day" },
    { value: "W", label: "1 Week" },
  ];

  const generateStrategy = async () => {
    if (!strategyName) {
      toast({
        title: "Strategy name required",
        description: "Please provide a name for your strategy",
        variant: "destructive",
      });
      return;
    }

    if (!hasEnoughCredits()) {
      toast({
        title: "No credits remaining",
        description: "You've used all your generation credits for this month. Upgrade to premium for more credits.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedStrategy(null);
    
    try {
      // Call our Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('generate-trading-strategy', {
        body: {
          symbol,
          timeframe,
          riskLevel: riskLevel[0],
          strategyName
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        setError(data.error);
        toast({
          title: "Generation failed",
          description: data.error,
          variant: "destructive"
        });
        return;
      }

      setGeneratedStrategy(data.strategy);
      
      // Refresh credits data after generation
      refreshCredits();
      
      toast({
        title: "Strategy generated",
        description: `Your AI trading strategy has been generated successfully. You have ${data.creditsRemaining} credits remaining.`
      });
    } catch (error) {
      console.error('Error generating strategy:', error);
      setError(error instanceof Error ? error.message : "Failed to generate strategy");
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate strategy",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveStrategy = () => {
    if (!generatedStrategy) return;
    
    // Generate a UUID if not authenticated to ensure uniqueness
    const strategyId = user ? uuidv4() : Date.now().toString();
    
    addStrategy({
      id: strategyId,
      name: strategyName,
      symbol,
      timeframe,
      riskLevel: riskLevel[0],
      content: generatedStrategy,
      createdAt: new Date().toISOString(),
    });
    
    toast({
      title: "Strategy saved",
      description: user 
        ? "Your strategy has been saved to your account" 
        : "Your strategy has been saved locally. Sign in to save it to your account.",
    });
    
    // Reset form
    setGeneratedStrategy(null);
    setStrategyName("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Configure Strategy</CardTitle>
          <CardDescription>
            Set parameters for your AI-generated trading strategy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <Card className="bg-muted/40 p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    Generation Credits: {getAvailableCredits()} / {credits?.total_credits || 0}
                  </span>
                </div>
                {credits && credits.total_credits > 5 && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                    Premium
                  </span>
                )}
              </div>
              <Progress 
                value={credits ? (credits.used_credits / credits.total_credits) * 100 : 0} 
                className="h-1.5" 
              />
              {getAvailableCredits() === 0 && (
                <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  <a href="/subscription" className="underline font-medium">
                    Upgrade to premium
                  </a>
                  {" "}for 30 credits per month
                </div>
              )}
            </Card>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Strategy Name</label>
            <Input 
              placeholder="Enter strategy name" 
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Symbol</label>
            <Input 
              placeholder="NASDAQ:AAPL" 
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Timeframe</label>
            <Select 
              value={timeframe} 
              onValueChange={setTimeframe}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                {timeframes.map((tf) => (
                  <SelectItem key={tf.value} value={tf.value}>
                    {tf.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Risk Level</label>
              <span className="text-sm text-muted-foreground">{riskLevel[0]}/10</span>
            </div>
            <Slider
              value={riskLevel}
              min={1}
              max={10}
              step={1}
              onValueChange={setRiskLevel}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Conservative</span>
              <span>Aggressive</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={generateStrategy} 
            disabled={isGenerating || !strategyName || !hasEnoughCredits() || !user}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : !user ? (
              "Sign in to generate"
            ) : !hasEnoughCredits() ? (
              "No credits remaining"
            ) : (
              "Generate Strategy"
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-6">
        <Card className="overflow-hidden">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-base">Chart Preview</CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[300px]">
            <TradingViewChart 
              symbol={symbol} 
              interval={timeframe} 
              autosize={true}
            />
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {generatedStrategy && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Strategy</CardTitle>
              <CardDescription>
                AI-generated strategy based on your parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={generatedStrategy} 
                readOnly 
                className="min-h-[200px] font-mono text-sm"
              />
            </CardContent>
            <CardFooter>
              <Button
                onClick={saveStrategy}
                className="w-full"
              >
                Save Strategy
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
