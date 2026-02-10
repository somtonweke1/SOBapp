/**
 * Responsive Design Utilities
 * Mobile-first responsive helpers based on Tailwind breakpoints
 */

'use client';

import { useState, useEffect } from 'react';

/**
 * Tailwind breakpoints (mobile-first)
 */
export const BREAKPOINTS = {
  sm: 640,   // Mobile
  md: 768,   // Tablet
  lg: 1024,  // Desktop
  xl: 1280,  // Large desktop
  '2xl': 1536, // Ultra-wide
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Check if window width matches breakpoint
 */
export function isBreakpoint(breakpoint: Breakpoint): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS[breakpoint];
}

/**
 * Get current breakpoint
 */
export function getCurrentBreakpoint(): Breakpoint | null {
  if (typeof window === 'undefined') return null;

  const width = window.innerWidth;

  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';

  return null; // Below sm (< 640px)
}

/**
 * Hook to track current breakpoint
 */
export function useBreakpoint(): Breakpoint | null {
  const [breakpoint, setBreakpoint] = useState<Breakpoint | null>(getCurrentBreakpoint);

  useEffect(() => {
    const handleResize = () => {
      setBreakpoint(getCurrentBreakpoint());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}

/**
 * Hook to check if viewport matches media query
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

/**
 * Common media queries
 */
export const MEDIA_QUERIES = {
  // Device types
  mobile: `(max-width: ${BREAKPOINTS.md - 1}px)`,
  tablet: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  desktop: `(min-width: ${BREAKPOINTS.lg}px)`,

  // Orientations
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',

  // Device capabilities
  touchDevice: '(hover: none) and (pointer: coarse)',
  mouseDevice: '(hover: hover) and (pointer: fine)',

  // Preferences
  darkMode: '(prefers-color-scheme: dark)',
  lightMode: '(prefers-color-scheme: light)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  highContrast: '(prefers-contrast: high)',

  // Retina displays
  retina: '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
} as const;

/**
 * Responsive value selector
 * Returns different values based on breakpoint
 */
export function useResponsiveValue<T>(values: {
  base: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}): T {
  const breakpoint = useBreakpoint();

  if (breakpoint === '2xl' && values['2xl']) return values['2xl'];
  if (breakpoint === 'xl' && values.xl) return values.xl;
  if (breakpoint === 'lg' && values.lg) return values.lg;
  if (breakpoint === 'md' && values.md) return values.md;
  if (breakpoint === 'sm' && values.sm) return values.sm;

  return values.base;
}

/**
 * Device detection hooks
 */
export function useIsMobile(): boolean {
  return useMediaQuery(MEDIA_QUERIES.mobile);
}

export function useIsTablet(): boolean {
  return useMediaQuery(MEDIA_QUERIES.tablet);
}

export function useIsDesktop(): boolean {
  return useMediaQuery(MEDIA_QUERIES.desktop);
}

export function useIsTouchDevice(): boolean {
  return useMediaQuery(MEDIA_QUERIES.touchDevice);
}

/**
 * Viewport size hook
 */
export function useViewportSize(): { width: number; height: number } {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

/**
 * Responsive grid columns calculator
 */
export function useResponsiveColumns(options: {
  mobile?: number;
  tablet?: number;
  desktop?: number;
} = {}): number {
  const { mobile = 1, tablet = 2, desktop = 3 } = options;

  return useResponsiveValue({
    base: mobile,
    md: tablet,
    lg: desktop,
  });
}

/**
 * Responsive spacing
 */
export const SPACING = {
  mobile: {
    container: 'px-4 py-6',
    section: 'py-8',
    card: 'p-4',
    gap: 'gap-4',
  },
  tablet: {
    container: 'px-6 py-8',
    section: 'py-12',
    card: 'p-6',
    gap: 'gap-6',
  },
  desktop: {
    container: 'px-8 py-12',
    section: 'py-20',
    card: 'p-8',
    gap: 'gap-8',
  },
} as const;

/**
 * Get responsive spacing classes
 */
export function getResponsiveSpacing(type: keyof typeof SPACING.mobile): string {
  return `${SPACING.mobile[type]} md:${SPACING.tablet[type]} lg:${SPACING.desktop[type]}`;
}

/**
 * Responsive typography
 */
export const TYPOGRAPHY = {
  hero: 'text-4xl sm:text-5xl lg:text-6xl font-extralight tracking-tight',
  h1: 'text-3xl sm:text-4xl lg:text-5xl font-extralight tracking-wide',
  h2: 'text-2xl sm:text-3xl lg:text-4xl font-extralight tracking-wide',
  h3: 'text-xl sm:text-2xl lg:text-3xl font-light',
  h4: 'text-lg sm:text-xl lg:text-2xl font-light',
  body: 'text-base sm:text-lg font-light',
  small: 'text-sm sm:text-base font-light',
} as const;

/**
 * Responsive container
 */
export const CONTAINER = {
  default: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  wide: 'max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12',
  narrow: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8',
  full: 'w-full px-4 sm:px-6 lg:px-8',
} as const;

/**
 * Mobile menu state hook
 */
export function useMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  // Close menu when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(!isOpen),
  };
}

/**
 * Touch gesture detection
 */
export function useTouchGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  threshold: number = 50
) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }

    setTouchStart(null);
  };

  return {
    handleTouchStart,
    handleTouchEnd,
  };
}

/**
 * Responsive image sizes
 */
export const IMAGE_SIZES = {
  avatar: '(max-width: 640px) 48px, 64px',
  thumbnail: '(max-width: 640px) 128px, 192px',
  card: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  hero: '100vw',
  content: '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 768px',
} as const;

/**
 * Responsive grid templates
 */
export const GRID_TEMPLATES = {
  // 1 column mobile, 2 tablet, 3 desktop
  standard: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',

  // 1 column mobile, 2 tablet, 4 desktop
  dense: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4',

  // 1 column mobile, 3 desktop
  wide: 'grid grid-cols-1 lg:grid-cols-3',

  // 2 columns mobile, 3 tablet, 4 desktop
  compact: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4',

  // Auto-fit responsive grid
  autoFit: 'grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))]',
} as const;

/**
 * Safe area insets (for notched devices)
 */
export const SAFE_AREA = {
  paddingTop: 'pt-[env(safe-area-inset-top)]',
  paddingBottom: 'pb-[env(safe-area-inset-bottom)]',
  paddingLeft: 'pl-[env(safe-area-inset-left)]',
  paddingRight: 'pr-[env(safe-area-inset-right)]',
  all: 'p-[env(safe-area-inset-top)_env(safe-area-inset-right)_env(safe-area-inset-bottom)_env(safe-area-inset-left)]',
} as const;

/**
 * Export all responsive utilities
 */
export const Responsive = {
  // Hooks
  useBreakpoint,
  useMediaQuery,
  useResponsiveValue,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsTouchDevice,
  useViewportSize,
  useResponsiveColumns,
  useMobileMenu,
  useTouchGesture,

  // Constants
  BREAKPOINTS,
  MEDIA_QUERIES,
  SPACING,
  TYPOGRAPHY,
  CONTAINER,
  IMAGE_SIZES,
  GRID_TEMPLATES,
  SAFE_AREA,

  // Utilities
  isBreakpoint,
  getCurrentBreakpoint,
  getResponsiveSpacing,
};

export default Responsive;
