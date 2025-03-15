
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { TradingViewChart } from "@/components/charts/TradingViewChart";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAIStrategies } from "@/hooks/useAIStrategies";

export function AIStrategyGenerator() {
  const [symbol, setSymbol] = useState("NASDAQ:AAPL");
  const [timeframe, setTimeframe] = useState("D");
  const [riskLevel, setRiskLevel] = useState([5]); // 1-10 scale
  const [strategyName, setStrategyName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStrategy, setGeneratedStrategy] = useState<string | null>(null);
  const { addStrategy } = useAIStrategies();
  const { toast } = useToast();

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

    setIsGenerating(true);
    
    // Simulate AI generation (in a real app, this would call an API)
    setTimeout(() => {
      const demoStrategies = [
        `# ${strategyName}\n\n## Entry Conditions\n- Wait for a bullish engulfing pattern on ${timeframe} timeframe\n- Confirm with RSI crossing above 40\n- Volume should be above 20-day average\n\n## Exit Conditions\n- Take profit at 3% gain\n- Stop loss at 1.5% loss\n- Exit if RSI crosses above 70`,
        `# ${strategyName}\n\n## Market Conditions\n- Trending market, preferably in direction of larger timeframe\n\n## Entry Rules\n- Enter when price crosses above 20 EMA\n- MACD histogram turns positive\n- Set limit orders at key support levels\n\n## Risk Management\n- Position size: 2% of portfolio\n- Stop loss: Below recent swing low`,
        `# ${strategyName}\n\n## Setup\n- Identify key support/resistance levels\n- Wait for price consolidation near these levels\n\n## Trigger\n- Enter on breakout with increased volume\n- Confirm with ADX reading above 25\n\n## Management\n- Trail stop loss at previous candle low\n- Take partial profits at 2:1 reward-to-risk ratio`,
      ];
      
      // Select a random strategy from the demo list
      const randomStrategy = demoStrategies[Math.floor(Math.random() * demoStrategies.length)];
      setGeneratedStrategy(randomStrategy);
      setIsGenerating(false);
    }, 2000);
  };

  const saveStrategy = () => {
    if (!generatedStrategy) return;
    
    addStrategy({
      id: Date.now().toString(),
      name: strategyName,
      symbol,
      timeframe,
      riskLevel: riskLevel[0],
      content: generatedStrategy,
      createdAt: new Date().toISOString(),
    });
    
    toast({
      title: "Strategy saved",
      description: "Your strategy has been saved successfully",
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
            disabled={isGenerating || !strategyName}
            className="w-full"
          >
            {isGenerating ? "Generating..." : "Generate Strategy"}
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
