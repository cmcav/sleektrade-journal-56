
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState("");

  useEffect(() => {
    // Log the 404 error for tracking purposes
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );

    // Parse URL parameters from both hash and query string
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    
    // Check for email verification patterns in the URL
    const type = hashParams.get('type') || queryParams.get('type');
    const error = hashParams.get('error') || queryParams.get('error');
    const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
    
    // Check if this is a successful email verification
    if (
      (location.pathname.includes("verify") || location.pathname.includes("registration-success")) &&
      (accessToken || refreshToken || type === "signup") &&
      !error
    ) {
      setIsRedirecting(true);
      setRedirectMessage("Your email has been verified. Redirecting to the success page...");
      
      // Redirect to registration success page
      setTimeout(() => {
        navigate("/registration-success");
      }, 1500);
    }
    // Check if this is a failed email verification
    else if (
      (location.pathname.includes("verify") || location.pathname.includes("registration-success")) &&
      error
    ) {
      setRedirectMessage("Email verification link has expired or is invalid. Please request a new one.");
    }
  }, [location.pathname, navigate]);

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Spinner className="mx-auto mb-4" />
            <p className="mb-4 text-muted-foreground">{redirectMessage}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-4">
          {redirectMessage || "Oops! Page not found"}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => navigate("/")}>Return to Home</Button>
          <Button variant="outline" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
