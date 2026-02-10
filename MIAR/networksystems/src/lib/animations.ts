/**
 * Animation & Transition System
 * Smooth, accessible animations with reduced motion support
 */

'use client';

import { prefersReducedMotion } from './accessibility';

/**
 * Animation durations (in milliseconds)
 */
export const DURATION = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 700,
  slowest: 1000,
} as const;

/**
 * Easing functions
 */
export const EASING = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
} as const;

/**
 * Tailwind animation classes
 */
export const ANIMATIONS = {
  // Fade
  fadeIn: 'animate-in fade-in',
  fadeOut: 'animate-out fade-out',

  // Slide
  slideInFromTop: 'animate-in slide-in-from-top',
  slideInFromBottom: 'animate-in slide-in-from-bottom',
  slideInFromLeft: 'animate-in slide-in-from-left',
  slideInFromRight: 'animate-in slide-in-from-right',
  slideOutToTop: 'animate-out slide-out-to-top',
  slideOutToBottom: 'animate-out slide-out-to-bottom',
  slideOutToLeft: 'animate-out slide-out-to-left',
  slideOutToRight: 'animate-out slide-out-to-right',

  // Zoom
  zoomIn: 'animate-in zoom-in',
  zoomOut: 'animate-out zoom-out',

  // Spin
  spin: 'animate-spin',
  spinSlow: 'animate-spin [animation-duration:3s]',
  spinFast: 'animate-spin [animation-duration:0.5s]',

  // Pulse
  pulse: 'animate-pulse',
  pulseSlow: 'animate-pulse [animation-duration:3s]',

  // Bounce
  bounce: 'animate-bounce',

  // Ping (ripple effect)
  ping: 'animate-ping',

  // Custom animations
  shimmer: 'animate-[shimmer_2s_ease-in-out_infinite]',
  float: 'animate-[float_3s_ease-in-out_infinite]',
  shake: 'animate-[shake_0.5s_ease-in-out]',
} as const;

/**
 * Duration classes
 */
export const DURATION_CLASSES = {
  instant: 'duration-0',
  fast: 'duration-150',
  normal: 'duration-300',
  slow: 'duration-500',
  slower: 'duration-700',
  slowest: 'duration-1000',
} as const;

/**
 * Transition classes
 */
export const TRANSITIONS = {
  all: 'transition-all',
  colors: 'transition-colors',
  opacity: 'transition-opacity',
  transform: 'transition-transform',
  shadow: 'transition-shadow',
  none: 'transition-none',
} as const;

/**
 * Get animation class with reduced motion fallback
 */
export function getAnimation(
  animation: keyof typeof ANIMATIONS,
  options?: {
    duration?: keyof typeof DURATION_CLASSES;
    easing?: string;
    reducedMotionFallback?: string;
  }
): string {
  // Respect user's motion preferences
  if (prefersReducedMotion()) {
    return options?.reducedMotionFallback || 'transition-opacity duration-150';
  }

  const classes: string[] = [ANIMATIONS[animation]];

  if (options?.duration) {
    classes.push(DURATION_CLASSES[options.duration]);
  }

  if (options?.easing) {
    classes.push(`[animation-timing-function:${options.easing}]`);
  }

  return classes.join(' ');
}

/**
 * Custom keyframe animations for Tailwind
 */
export const KEYFRAMES = {
  shimmer: {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0.5' },
  },
  float: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-10px)' },
  },
  shake: {
    '0%, 100%': { transform: 'translateX(0)' },
    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
    '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
  },
  slideDown: {
    from: { height: '0' },
    to: { height: 'var(--radix-accordion-content-height)' },
  },
  slideUp: {
    from: { height: 'var(--radix-accordion-content-height)' },
    to: { height: '0' },
  },
} as const;

/**
 * Hover effects
 */
export const HOVER_EFFECTS = {
  // Scale
  scaleUp: 'hover:scale-105 transition-transform duration-300',
  scaleDown: 'hover:scale-95 transition-transform duration-300',

  // Lift (shadow + translate)
  lift: 'hover:-translate-y-1 hover:shadow-lg transition-all duration-300',

  // Brightness
  brighten: 'hover:brightness-110 transition-all duration-300',
  dim: 'hover:brightness-90 transition-all duration-300',

  // Glassmorphism change
  glassHover: 'hover:bg-white/80 transition-all duration-300',

  // Border glow
  borderGlow: 'hover:border-emerald-500 hover:shadow-[0_0_10px_rgba(5,150,105,0.3)] transition-all duration-300',

  // Underline
  underline: 'hover:underline transition-all duration-300',

  // Text color
  textEmerald: 'hover:text-emerald-600 transition-colors duration-300',
  textZinc: 'hover:text-zinc-900 transition-colors duration-300',
} as const;

/**
 * Focus effects (for accessibility)
 */
export const FOCUS_EFFECTS = {
  ring: 'focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-shadow duration-200',
  ringVisible: 'focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-shadow duration-200',
  outline: 'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
  glow: 'focus:shadow-[0_0_0_3px_rgba(5,150,105,0.3)] transition-shadow duration-200',
  scale: 'focus:scale-105 transition-transform duration-200',
} as const;

/**
 * Page transition variants
 */
export const PAGE_TRANSITIONS = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.3 },
  },
} as const;

/**
 * Loading animations
 */
export const LOADING = {
  spinner: 'animate-spin rounded-full border-b-2 border-current',
  dots: 'inline-flex gap-1 [&>*]:animate-[pulse_1.5s_ease-in-out_infinite]',
  pulse: 'animate-pulse',
  shimmer: 'animate-[shimmer_2s_ease-in-out_infinite]',
  progress: 'animate-[progress_1.5s_ease-in-out_infinite]',
} as const;

/**
 * Stagger children animation
 */
export function getStaggerClasses(
  index: number,
  delay: number = 100
): { style: React.CSSProperties } {
  if (prefersReducedMotion()) {
    return { style: {} };
  }

  return {
    style: {
      animationDelay: `${index * delay}ms`,
    },
  };
}

/**
 * Scroll-triggered animation hook
 */
export function useScrollAnimation(
  threshold: number = 0.1
): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isVisible];
}

/**
 * Spring animation configuration
 */
export const SPRING = {
  gentle: { type: 'spring', stiffness: 100, damping: 15 },
  bouncy: { type: 'spring', stiffness: 300, damping: 20 },
  stiff: { type: 'spring', stiffness: 400, damping: 30 },
  slow: { type: 'spring', stiffness: 50, damping: 20 },
} as const;

/**
 * Glassmorphism animation
 */
export const GLASS_ANIMATION = {
  initial: 'bg-white/60 backdrop-blur-sm',
  hover: 'hover:bg-white/80 transition-all duration-300',
  active: 'active:bg-white/90 transition-all duration-150',
} as const;

/**
 * Card animations
 */
export const CARD_ANIMATIONS = {
  hover: 'hover:-translate-y-1 hover:shadow-xl transition-all duration-300',
  hoverGlass: 'hover:bg-white/80 hover:-translate-y-1 hover:shadow-xl transition-all duration-300',
  hoverScale: 'hover:scale-105 transition-transform duration-300',
  hoverBorder: 'hover:border-emerald-500 transition-colors duration-300',
} as const;

/**
 * Button animations
 */
export const BUTTON_ANIMATIONS = {
  press: 'active:scale-95 transition-transform duration-100',
  lift: 'hover:-translate-y-0.5 hover:shadow-md transition-all duration-200',
  glow: 'hover:shadow-[0_0_15px_rgba(5,150,105,0.5)] transition-shadow duration-300',
  ripple: 'relative overflow-hidden after:absolute after:inset-0 after:bg-white/20 after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300',
} as const;

/**
 * Modal/Dialog animations
 */
export const MODAL_ANIMATIONS = {
  backdrop: {
    enter: 'animate-in fade-in duration-300',
    exit: 'animate-out fade-out duration-200',
  },
  content: {
    enter: 'animate-in fade-in zoom-in-95 duration-300',
    exit: 'animate-out fade-out zoom-out-95 duration-200',
  },
  slide: {
    enter: 'animate-in slide-in-from-bottom duration-300',
    exit: 'animate-out slide-out-to-bottom duration-200',
  },
} as const;

/**
 * Toast animations
 */
export const TOAST_ANIMATIONS = {
  enter: {
    top: 'animate-in slide-in-from-top duration-300',
    bottom: 'animate-in slide-in-from-bottom duration-300',
    left: 'animate-in slide-in-from-left duration-300',
    right: 'animate-in slide-in-from-right duration-300',
  },
  exit: {
    top: 'animate-out slide-out-to-top duration-200',
    bottom: 'animate-out slide-out-to-bottom duration-200',
    left: 'animate-out slide-out-to-left duration-200',
    right: 'animate-out slide-out-to-right duration-200',
  },
} as const;

/**
 * Prefers reduced motion wrapper
 */
export function withReducedMotion(
  animationClasses: string,
  fallbackClasses: string = 'transition-opacity duration-150'
): string {
  if (prefersReducedMotion()) {
    return fallbackClasses;
  }
  return animationClasses;
}

/**
 * CSS in JS animation helper
 */
export function createAnimation(
  keyframes: string,
  duration: number,
  easing: string = EASING.easeInOut
): React.CSSProperties {
  if (prefersReducedMotion()) {
    return { transition: 'opacity 150ms ease-in-out' };
  }

  return {
    animation: `${keyframes} ${duration}ms ${easing}`,
  };
}

/**
 * Export all animation utilities
 */
export const Animations = {
  // Classes
  ANIMATIONS,
  DURATION_CLASSES,
  TRANSITIONS,
  HOVER_EFFECTS,
  FOCUS_EFFECTS,
  LOADING,
  GLASS_ANIMATION,
  CARD_ANIMATIONS,
  BUTTON_ANIMATIONS,
  MODAL_ANIMATIONS,
  TOAST_ANIMATIONS,

  // Configurations
  DURATION,
  EASING,
  KEYFRAMES,
  PAGE_TRANSITIONS,
  SPRING,

  // Utilities
  getAnimation,
  getStaggerClasses,
  withReducedMotion,
  createAnimation,
};

export default Animations;

// Import React for hook
import * as React from 'react';
