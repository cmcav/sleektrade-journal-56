
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Navbar } from "@/components/layout/Navbar";
import { PageTransition } from "@/components/layout/PageTransition";
import { User, Shield, Mail, KeyRound, CreditCard, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Profile = () => {
  const { user, updatePassword } = useAuth();
  const { subscription, isLoading, isSubscribed, cancelSubscription } = useSubscription();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password should be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsUpdating(true);
      await updatePassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated",
      });
    } catch (error: any) {
      toast({
        title: "Error updating password",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsCanceling(true);
      await cancelSubscription();
    } finally {
      setIsCanceling(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageTransition>
        <div className="container max-w-4xl mx-auto px-4 py-16 pt-24">
          <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
          
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle>Account Information</CardTitle>
                </div>
                <CardDescription>Your account details and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <Label>User ID</Label>
                  </div>
                  <Input value={user?.id || ""} readOnly className="bg-muted/50" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Label>Email Address</Label>
                  </div>
                  <Input value={user?.email || ""} readOnly className="bg-muted/50" />
                </div>
              </CardContent>
            </Card>
            
            {isSubscribed && subscription && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <CardTitle>Subscription Details</CardTitle>
                  </div>
                  <CardDescription>Your current subscription information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Plan Type</Label>
                      <div className="p-2 rounded bg-muted/50 capitalize">
                        {subscription.plan_type}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Subscription Date</Label>
                      <div className="p-2 rounded bg-muted/50">
                        {formatDate(subscription.subscription_date)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <div className="p-2 rounded bg-muted/50">
                        Card ending in {subscription.card_last_four}
                      </div>
                    </div>
                    
                    {subscription.next_billing_date && (
                      <div className="space-y-2">
                        <Label>Next Billing Date</Label>
                        <div className="p-2 rounded bg-muted/50">
                          {formatDate(subscription.next_billing_date)}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={isCanceling}>
                        {isCanceling ? "Canceling..." : "Cancel Subscription"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Cancel Subscription
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelSubscription}>
                          Cancel Subscription
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            )}
            
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  <CardTitle>Change Password</CardTitle>
                </div>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <form onSubmit={handleUpdatePassword}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input 
                      id="new-password"
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input 
                      id="confirm-password"
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isUpdating || !newPassword || !confirmPassword}>
                    {isUpdating ? "Updating..." : "Update Password"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </PageTransition>
    </div>
  );
};

export default Profile;
