/**
 * Accessibility Utilities
 * WCAG 2.1 AA compliant helpers for the SOBapp platform
 */

import React from 'react';

/**
 * ARIA live region announcer for screen readers
 */
export class A11yAnnouncer {
  private static announcer: HTMLElement | null = null;

  /**
   * Initialize the announcer (call once on app mount)
   */
  static initialize() {
    if (typeof window === 'undefined' || this.announcer) return;

    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.setAttribute('role', 'status');
    this.announcer.className = 'sr-only'; // Screen reader only
    document.body.appendChild(this.announcer);
  }

  /**
   * Announce a message to screen readers
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.announcer) this.initialize();
    if (!this.announcer) return;

    this.announcer.setAttribute('aria-live', priority);
    this.announcer.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.announcer) this.announcer.textContent = '';
    }, 1000);
  }
}

/**
 * Skip navigation link for keyboard users
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-lg focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}

/**
 * Generate unique ID for accessibility attributes
 */
let idCounter = 0;
export function generateId(prefix: string = 'a11y'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Keyboard navigation helper
 */
export const KeyboardNav = {
  /**
   * Handle arrow key navigation in lists
   */
  handleArrowKeys: (
    event: React.KeyboardEvent,
    currentIndex: number,
    totalItems: number,
    onNavigate: (newIndex: number) => void
  ) => {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        newIndex = (currentIndex + 1) % totalItems;
        event.preventDefault();
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        newIndex = (currentIndex - 1 + totalItems) % totalItems;
        event.preventDefault();
        break;
      case 'Home':
        newIndex = 0;
        event.preventDefault();
        break;
      case 'End':
        newIndex = totalItems - 1;
        event.preventDefault();
        break;
      default:
        return;
    }

    onNavigate(newIndex);
  },

  /**
   * Handle Enter/Space key activation
   */
  handleActivation: (
    event: React.KeyboardEvent,
    callback: () => void
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  },

  /**
   * Handle Escape key
   */
  handleEscape: (
    event: React.KeyboardEvent,
    callback: () => void
  ) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      callback();
    }
  },

  /**
   * Trap focus within a modal/dialog
   */
  trapFocus: (
    event: React.KeyboardEvent,
    containerRef: React.RefObject<HTMLElement>
  ) => {
    if (event.key !== 'Tab') return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      lastElement.focus();
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      firstElement.focus();
      event.preventDefault();
    }
  },
};

/**
 * Focus management utilities
 */
export const FocusManager = {
  /**
   * Save current focus element
   */
  saveFocus: (): HTMLElement | null => {
    return document.activeElement as HTMLElement;
  },

  /**
   * Restore focus to saved element
   */
  restoreFocus: (element: HTMLElement | null) => {
    if (element && element.focus) {
      element.focus();
    }
  },

  /**
   * Focus first focusable element in container
   */
  focusFirst: (container: HTMLElement) => {
    const focusable = container.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  },

  /**
   * Move focus to element by ID
   */
  focusById: (id: string) => {
    const element = document.getElementById(id);
    element?.focus();
  },
};

/**
 * Color contrast checker (WCAG AA = 4.5:1, AAA = 7:1)
 */
export const ColorContrast = {
  /**
   * Calculate relative luminance
   */
  getLuminance: (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  /**
   * Calculate contrast ratio
   */
  getContrastRatio: (hex1: string, hex2: string): number => {
    const lum1 = ColorContrast.getLuminance(hex1);
    const lum2 = ColorContrast.getLuminance(hex2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * Check if contrast meets WCAG AA (4.5:1)
   */
  meetsAA: (foreground: string, background: string): boolean => {
    return ColorContrast.getContrastRatio(foreground, background) >= 4.5;
  },

  /**
   * Check if contrast meets WCAG AAA (7:1)
   */
  meetsAAA: (foreground: string, background: string): boolean => {
    return ColorContrast.getContrastRatio(foreground, background) >= 7;
  },
};

/**
 * ARIA attributes helpers
 */
export const AriaHelpers = {
  /**
   * Loading state attributes
   */
  loading: (isLoading: boolean) => ({
    'aria-busy': isLoading,
    'aria-live': 'polite' as const,
  }),

  /**
   * Expanded/collapsed state
   */
  expandable: (isExpanded: boolean, controlsId: string) => ({
    'aria-expanded': isExpanded,
    'aria-controls': controlsId,
  }),

  /**
   * Selected state for options/tabs
   */
  selectable: (isSelected: boolean) => ({
    'aria-selected': isSelected,
    tabIndex: isSelected ? 0 : -1,
  }),

  /**
   * Disabled state
   */
  disabled: (isDisabled: boolean) => ({
    'aria-disabled': isDisabled,
    tabIndex: isDisabled ? -1 : 0,
  }),

  /**
   * Invalid/error state
   */
  invalid: (isInvalid: boolean, errorId?: string) => ({
    'aria-invalid': isInvalid,
    ...(errorId && { 'aria-describedby': errorId }),
  }),

  /**
   * Required field
   */
  required: () => ({
    'aria-required': true,
    required: true,
  }),

  /**
   * Live region
   */
  liveRegion: (priority: 'polite' | 'assertive' = 'polite') => ({
    'aria-live': priority,
    'aria-atomic': true,
    role: 'status',
  }),

  /**
   * Hidden from screen readers
   */
  hidden: () => ({
    'aria-hidden': true,
  }),

  /**
   * Label by ID
   */
  labelledBy: (labelId: string) => ({
    'aria-labelledby': labelId,
  }),

  /**
   * Described by ID
   */
  describedBy: (descriptionId: string) => ({
    'aria-describedby': descriptionId,
  }),
};

/**
 * Screen reader only CSS class
 */
export const srOnly = 'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 [clip:rect(0,0,0,0)]';

/**
 * Accessible button/link component props
 */
export interface AccessibleClickableProps {
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
}

/**
 * Get appropriate ARIA attributes for clickable elements
 */
export function getClickableProps(props: AccessibleClickableProps) {
  const { onClick, disabled, ariaLabel, ariaDescribedBy, ariaExpanded, ariaControls } = props;

  return {
    onClick,
    disabled,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-expanded': ariaExpanded,
    'aria-controls': ariaControls,
    ...(disabled && { 'aria-disabled': true, tabIndex: -1 }),
  };
}

/**
 * Reduce motion preference check
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * High contrast mode detection
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Accessible form validation
 */
export const FormValidation = {
  /**
   * Get validation attributes for input
   */
  getInputProps: (
    error?: string,
    errorId?: string,
    required?: boolean
  ) => ({
    'aria-invalid': !!error,
    'aria-describedby': error && errorId ? errorId : undefined,
    'aria-required': required,
    required,
  }),

  /**
   * Announce form errors to screen readers
   */
  announceError: (fieldName: string, error: string) => {
    A11yAnnouncer.announce(`Error in ${fieldName}: ${error}`, 'assertive');
  },

  /**
   * Announce form success
   */
  announceSuccess: (message: string) => {
    A11yAnnouncer.announce(message, 'polite');
  },
};

/**
 * Accessible loading state
 */
export function LoadingAnnouncement({ message = 'Loading...' }: { message?: string }) {
  return (
    <div {...AriaHelpers.liveRegion('polite')} className={srOnly}>
      {message}
    </div>
  );
}

/**
 * Accessible error message
 */
export function ErrorMessage({
  id,
  message,
}: {
  id: string;
  message: string;
}) {
  return (
    <div
      id={id}
      role="alert"
      aria-live="assertive"
      className="text-sm text-red-600 mt-1"
    >
      {message}
    </div>
  );
}

/**
 * Visually hidden but screen reader accessible
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className={srOnly}>{children}</span>;
}

export default {
  A11yAnnouncer,
  KeyboardNav,
  FocusManager,
  ColorContrast,
  AriaHelpers,
  FormValidation,
  generateId,
  getClickableProps,
  prefersReducedMotion,
  prefersHighContrast,
  srOnly,
};
