import { useState, useEffect, useCallback } from 'react';

const HIGH_CONTRAST_KEY = 'high-contrast-mode';

export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(HIGH_CONTRAST_KEY) === 'true';
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    localStorage.setItem(HIGH_CONTRAST_KEY, String(isHighContrast));
  }, [isHighContrast]);

  const toggleHighContrast = useCallback(() => {
    setIsHighContrast(prev => !prev);
  }, []);

  return {
    isHighContrast,
    setIsHighContrast,
    toggleHighContrast,
  };
};
