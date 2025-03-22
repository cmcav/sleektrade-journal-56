
import { SubscriptionProvider } from "@/components/subscription/SubscriptionContext";
import SubscriptionPage from "@/components/subscription/SubscriptionPage";

export default function Subscription() {
  return (
    <SubscriptionProvider>
      <SubscriptionPage />
    </SubscriptionProvider>
  );
}

// Add Authorize.net types
declare global {
  interface Window {
    Accept: {
      dispatch: (config: any) => void;
    };
  }
}
