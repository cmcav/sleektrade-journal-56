
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

const RegistrationSuccess = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to login page after 5 seconds
    const timer = setTimeout(() => {
      navigate('/auth');
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [navigate]);
  
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
            <CardHeader className="text-center pb-2">
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center mb-4"
              >
                <CheckCircle className="h-16 w-16 text-green-500" />
              </motion.div>
              <CardTitle className="text-2xl">Registration Successful!</CardTitle>
              <CardDescription>
                Your account has been successfully verified
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-6">
                You will be redirected to the login page in a few seconds...
              </p>
              <div className="flex justify-center mb-4">
                <Spinner />
              </div>
              <Button 
                onClick={() => navigate('/auth')}
                className="w-full"
              >
                Sign In Now
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;
