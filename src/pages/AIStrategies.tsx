
import { Navbar } from "@/components/layout/Navbar";
import { PageTransition } from "@/components/layout/PageTransition";
import { AIStrategyGenerator } from "@/components/strategies/AIStrategyGenerator";
import { AIStrategyList } from "@/components/strategies/AIStrategyList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AIStrategies = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageTransition>
        <main className="container mx-auto px-4 pt-24 pb-16">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">AI Trading Strategies</h1>
            <p className="text-muted-foreground mt-1">
              Generate and manage AI-powered trading strategies based on chart movements
            </p>
          </div>

          <Tabs defaultValue="generator" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="generator">Strategy Generator</TabsTrigger>
              <TabsTrigger value="my-strategies">My Strategies</TabsTrigger>
            </TabsList>
            
            <TabsContent value="generator" className="space-y-6">
              <AIStrategyGenerator />
            </TabsContent>
            
            <TabsContent value="my-strategies" className="space-y-4">
              <AIStrategyList />
            </TabsContent>
          </Tabs>
        </main>
      </PageTransition>
    </div>
  );
};

export default AIStrategies;
