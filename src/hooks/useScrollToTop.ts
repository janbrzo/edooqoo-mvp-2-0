
import { useState, useEffect } from 'react';

/**
 * Hook obsługujący przewijanie do góry strony
 * @param threshold - Próg przewinięcia, po którym przycisk jest widoczny
 * @returns Obiekt z flagą widoczności i funkcją przewijającą do góry
 */
export function useScrollToTop(threshold = 300) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > threshold);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return { showScrollTop, scrollToTop };
}
