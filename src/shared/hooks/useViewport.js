import { useState, useEffect } from 'react';

export function useViewport() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    width,
    isSmallMobile: width < 360,
    isMediumMobile: width >= 360 && width <= 412,
    isLargeMobile: width > 412 && width <= 480,
    isMobile: width <= 480,
    isTabletPortrait: width > 480 && width <= 768,
    isTabletLandscape: width > 768 && width <= 1024,
    isTablet: width > 480 && width <= 1024,
    isLaptop: width > 1024 && width <= 1366,
    isDesktop: width > 1366,
  };
}
