import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setNavigateHandler } from '../lib/navigation';

/**
 * Bridges the global `navigateTo(path)` helper to React Router's `useNavigate`.
 */
export function NavigationBridge(): null {
  const navigate = useNavigate();

  useEffect(() => {
    setNavigateHandler((path: string) => {
      navigate(path);
    });
    return () => {
      setNavigateHandler(null);
    };
  }, [navigate]);

  return null;
}

export default NavigationBridge;
