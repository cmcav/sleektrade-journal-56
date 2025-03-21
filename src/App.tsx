
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Trades from "./pages/Trades";
import Analytics from "./pages/Analytics";
import AIStrategies from "./pages/AIStrategies";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Subscription from "./pages/Subscription";
import Leaderboard from "./pages/Leaderboard";
import RegistrationSuccess from "./pages/RegistrationSuccess";
import Profile from "./pages/Profile";
import { useEffect } from "react";
import { supabase } from "./integrations/supabase/client";

// Configure Supabase realtime
const setupRealtime = async () => {
  await supabase.channel('public:trades').subscribe();
  await supabase.channel('public:leaderboard').subscribe();
};

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    setupRealtime();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/trades" element={<Trades />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/ai-strategies" element={<AIStrategies />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/registration-success" element={<RegistrationSuccess />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
