
import { useState } from "react";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Auth() {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  if (user) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">TradingJournal</h1>
            <p className="text-muted-foreground mt-2">
              Track your trades, analyze performance, and improve your results
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "signin" | "signup")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Create Account</TabsTrigger>
            </TabsList>
            <AnimatePresence mode="wait">
              <TabsContent value="signin" forceMount>
                {activeTab === "signin" && <SignInForm />}
              </TabsContent>
              <TabsContent value="signup" forceMount>
                {activeTab === "signup" && <SignUpForm />}
              </TabsContent>
            </AnimatePresence>
          </Tabs>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              By continuing, you agree to our{" "}
              <Button variant="link" className="p-0 h-auto text-primary">
                Terms of Service
              </Button>{" "}
              and{" "}
              <Button variant="link" className="p-0 h-auto text-primary">
                Privacy Policy
              </Button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
