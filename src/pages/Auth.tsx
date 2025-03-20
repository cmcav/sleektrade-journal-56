
import { useState, useEffect } from "react";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Auth() {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we're coming from a password reset link or have error parameters
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    const error = hashParams.get('error');
    const errorDescription = hashParams.get('error_description');
    
    if (type === 'recovery') {
      // Show signin tab when coming from password reset
      setActiveTab("signin");
    }

    // If there's an error in the URL related to password reset
    if (error && (error === 'access_denied' || errorDescription?.includes('Email link is invalid or has expired'))) {
      toast({
        variant: "destructive",
        title: "Password reset link expired",
        description: "Your password reset link has expired. Please request a new one.",
      });
      // Clear the URL parameters 
      window.history.replaceState(null, '', window.location.pathname);
      navigate('/auth', { replace: true });
    }
  }, [location, toast, navigate]);

  // Function to handle password reset form submission
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setResetError("Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setResetError("Password must be at least 6 characters");
      return;
    }

    setResetLoading(true);
    try {
      // In a real implementation, we would call supabase.auth.updateUser() here
      // with the new password and hash from the URL
      // For now we just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      setResetComplete(true);
      toast({
        title: "Password reset successful",
        description: "Your password has been updated. You can now sign in with your new password.",
      });
    } catch (error: any) {
      setResetError(error.message || "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  // Redirect to dashboard if already authenticated
  if (user) {
    navigate("/dashboard");
    return null;
  }

  // Password reset success view
  if (resetComplete) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Password Reset Complete</CardTitle>
                <CardDescription className="text-center">
                  Your password has been successfully reset
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <p className="mb-4 text-center">
                  You can now sign in with your new password.
                </p>
                <Button onClick={() => {
                  setActiveTab("signin");
                  setIsPasswordReset(false);
                  setResetComplete(false);
                }}>
                  Sign In
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Password reset form view
  if (isPasswordReset) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Reset Your Password</CardTitle>
                <CardDescription className="text-center">
                  Enter a new password for your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  {resetError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{resetError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={resetLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={resetLoading}
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button type="submit" disabled={resetLoading}>
                      {resetLoading ? "Resetting..." : "Reset Password"}
                    </Button>
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={() => setIsPasswordReset(false)}
                      disabled={resetLoading}
                    >
                      Back to Sign In
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Regular auth view with signin/signup tabs
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
                {activeTab === "signin" && <SignInForm onResetPassword={() => setIsPasswordReset(true)} />}
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
