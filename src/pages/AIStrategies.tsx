
import { Navbar } from "@/components/layout/Navbar";
import { PageTransition } from "@/components/layout/PageTransition";
import { AIStrategyGenerator } from "@/components/strategies/AIStrategyGenerator";
import { AIStrategyList } from "@/components/strategies/AIStrategyList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { UserCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AIStrategies = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
            <Alert className="mt-4 border-yellow-500/50 bg-yellow-500/10 text-yellow-800 dark:text-yellow-300">
              <AlertDescription>
                This is not financial advice. Always do your own research. Stocks and crypto are volatile and investing may lead to irrecoverable loss of funds.
              </AlertDescription>
            </Alert>
          </div>

          {!user ? (
            <Card className="bg-muted/40">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <UserCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Sign in to save strategies</h3>
                <p className="text-muted-foreground mt-1 mb-4">
                  Create an account or sign in to save your AI trading strategies
                </p>
                <Button onClick={() => navigate("/auth")}>
                  Sign In
                </Button>
              </CardContent>
            </Card>
          ) : (
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
          )}
        </main>
      </PageTransition>
    </div>
  );
};

export default AIStrategies;
