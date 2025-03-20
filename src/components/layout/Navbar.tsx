import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { motion } from "framer-motion";
import {
  BarChart4,
  Home,
  LineChart,
  Menu,
  X,
  LogOut,
  Brain,
  CreditCard,
  Trophy
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Define nav items based on authentication status
  const navItems = [
    { path: "/", label: "Home", icon: <Home className="w-5 h-5" /> },
  ];

  // Add authenticated-only nav items
  if (user) {
    navItems.push(
      { path: "/dashboard", label: "Dashboard", icon: <BarChart4 className="w-5 h-5" /> },
      { path: "/trades", label: "Trades", icon: <LineChart className="w-5 h-5" /> },
      { path: "/analytics", label: "Analytics", icon: <BarChart4 className="w-5 h-5" /> },
      { path: "/leaderboard", label: "Leaderboard", icon: <Trophy className="w-5 h-5" /> },
      { path: "/ai-strategies", label: "AI Strategies", icon: <Brain className="w-5 h-5" /> },
      { path: "/subscription", label: "Subscription", icon: <CreditCard className="w-5 h-5" /> }
    );
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "glass shadow-sm py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <NavLink to="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold">SleekTrade</span>
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-1 py-2 transition-colors relative ${
                  isActive ? "text-primary" : "text-foreground hover:text-primary"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="flex items-center space-x-1">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  {isActive && (
                    <motion.div
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                      layoutId="navbar-indicator"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="hidden md:flex items-center space-x-1"
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span>Logout</span>
            </Button>
          )}

          {!user && (
            <div className="hidden md:flex items-center space-x-2">
              <NavLink to="/auth">
                <Button variant="outline" size="sm">Login</Button>
              </NavLink>
              <NavLink to="/auth">
                <Button size="sm">Sign Up</Button>
              </NavLink>
            </div>
          )}
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-foreground p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden glass border-t border-border/10"
        >
          <nav className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            {navItems.map((item, index) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted text-foreground"
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </motion.div>
            ))}
            
            {user && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navItems.length * 0.05 }}
              >
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 w-full justify-start p-3"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </Button>
              </motion.div>
            )}
            
            {!user && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navItems.length * 0.05 }}
                className="flex flex-col space-y-2 pt-2"
              >
                <NavLink to="/auth">
                  <Button variant="outline" className="w-full">Login</Button>
                </NavLink>
                <NavLink to="/auth">
                  <Button className="w-full">Sign Up</Button>
                </NavLink>
              </motion.div>
            )}
          </nav>
        </motion.div>
      )}
    </header>
  );
}
