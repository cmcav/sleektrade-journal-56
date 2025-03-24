
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserCredits } from "@/hooks/useUserCredits";
import { CreditCard, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatDistance } from "date-fns";

export function UserCreditInfo() {
  const { credits, isLoading, getAvailableCredits } = useUserCredits();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Generation Credits</CardTitle>
          <CardDescription>AI strategy generation credits</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!credits) {
    return null;
  }

  const resetDate = new Date(credits.last_reset_date);
  const nextResetDate = new Date(resetDate);
  nextResetDate.setMonth(nextResetDate.getMonth() + 1);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">Generation Credits</CardTitle>
            <CardDescription>AI strategy generation credits</CardDescription>
          </div>
          {credits.total_credits > 5 && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
              Premium
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-4 w-4 text-primary" />
          <span className="font-medium">
            {getAvailableCredits()} / {credits.total_credits}
          </span>
          <span className="text-sm text-muted-foreground">
            credits remaining
          </span>
        </div>
        
        <Progress 
          value={(credits.used_credits / credits.total_credits) * 100} 
          className="h-2 mb-3" 
        />
        
        <div className="text-sm text-muted-foreground">
          <p className="mb-1">
            Last reset: {formatDistance(resetDate, new Date(), { addSuffix: true })}
          </p>
          <p>
            Next reset: {formatDistance(nextResetDate, new Date(), { addSuffix: true })}
          </p>
        </div>
        
        <div className="mt-4 text-sm">
          {credits.total_credits === 5 ? (
            <p className="text-amber-600 dark:text-amber-400">
              Upgrade to premium to get 30 credits per month
            </p>
          ) : (
            <p className="text-green-600 dark:text-green-400">
              Premium subscription: 30 credits per month
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
