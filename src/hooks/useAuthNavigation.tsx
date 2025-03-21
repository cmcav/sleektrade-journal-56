
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// This hook allows navigation from context providers
// by avoiding the React Router DOM context issue
export const useAuthNavigation = () => {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);
  
  const navigateTo = (path: string) => {
    navigateRef.current(path);
  };
  
  return { navigateTo };
};
