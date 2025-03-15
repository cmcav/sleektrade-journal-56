
import { NavLink } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, BarChart4, LineChart, TrendingUp } from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: <LineChart className="w-6 h-6" />,
      title: "Track Your Trades",
      description: "Log and manage your trades with a beautiful, intuitive interface.",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Analyze Performance",
      description: "Visualize your trading performance with advanced analytics.",
    },
    {
      icon: <BarChart4 className="w-6 h-6" />,
      title: "Chart Integration",
      description: "See your trades in context with integrated TradingView charts.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Header */}
      <header className="relative w-full px-6 py-6 md:py-8">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">SleekTrade</h1>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <NavLink to="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </NavLink>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-6 py-16 md:py-24">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <span className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary rounded-full">
              Modern Trading Journal
            </span>
          </motion.div>
          
          <motion.h1 
            className="mt-6 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Elevate Your Trading with Precision and Insight
          </motion.h1>
          
          <motion.p 
            className="mt-6 text-lg md:text-xl text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            A powerful, intuitive platform for tracking trades, analyzing performance, and improving your trading strategy.
          </motion.p>
          
          <motion.div 
            className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <NavLink to="/dashboard">
              <Button size="lg" className="w-full sm:w-auto">
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </NavLink>
            <NavLink to="/trades">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Record Trades
              </Button>
            </NavLink>
          </motion.div>
        </motion.div>

        {/* Features */}
        <motion.div 
          className="mt-24 grid md:grid-cols-3 gap-8"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.2,
                delayChildren: 0.6,
              },
            },
          }}
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              className="glass-card p-6 rounded-xl"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { 
                  opacity: 1, 
                  y: 0,
                  transition: { 
                    type: "spring",
                    stiffness: 100,
                    damping: 12,
                  },
                },
              }}
            >
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-5">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 md:py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© 2023 SleekTrade Journal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
