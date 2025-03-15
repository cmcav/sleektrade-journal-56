
import { useState, useEffect } from "react";

export interface AIStrategy {
  id: string;
  name: string;
  symbol: string;
  timeframe: string;
  riskLevel: number;
  content: string;
  createdAt: string;
}

export function useAIStrategies() {
  const [strategies, setStrategies] = useState<AIStrategy[]>([]);

  // Load strategies from localStorage on mount
  useEffect(() => {
    const savedStrategies = localStorage.getItem("ai-strategies");
    if (savedStrategies) {
      try {
        setStrategies(JSON.parse(savedStrategies));
      } catch (error) {
        console.error("Error loading strategies from localStorage:", error);
      }
    }
  }, []);

  // Save strategies to localStorage when they change
  useEffect(() => {
    localStorage.setItem("ai-strategies", JSON.stringify(strategies));
  }, [strategies]);

  const addStrategy = (strategy: AIStrategy) => {
    setStrategies(prev => [strategy, ...prev]);
  };

  const removeStrategy = (id: string) => {
    setStrategies(prev => prev.filter(strategy => strategy.id !== id));
  };

  const updateStrategy = (updatedStrategy: AIStrategy) => {
    setStrategies(prev => 
      prev.map(strategy => 
        strategy.id === updatedStrategy.id ? updatedStrategy : strategy
      )
    );
  };

  return {
    strategies,
    addStrategy,
    removeStrategy,
    updateStrategy
  };
}
