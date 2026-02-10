/**
 * Image Optimization Utilities
 * Helper functions and constants for Next.js Image optimization
 */

/**
 * Standard image sizes for the platform
 */
export const IMAGE_SIZES = {
  // Icons and small images
  icon: { width: 32, height: 32 },
  avatar: { width: 64, height: 64 },
  thumbnail: { width: 128, height: 128 },

  // Cards and previews
  cardSmall: { width: 256, height: 192 },
  cardMedium: { width: 384, height: 256 },
  cardLarge: { width: 512, height: 384 },

  // Full images
  content: { width: 768, height: 512 },
  hero: { width: 1920, height: 1080 },

  // Charts and visualizations
  chartSmall: { width: 400, height: 300 },
  chartMedium: { width: 800, height: 600 },
  chartLarge: { width: 1200, height: 800 },
} as const;

/**
 * Quality presets for different use cases
 */
export const IMAGE_QUALITY = {
  low: 50,      // Previews, thumbnails
  medium: 75,   // Standard quality (default)
  high: 90,     // Important images
  max: 100,     // Original quality
} as const;

/**
 * Priority images that should be loaded immediately
 */
export const PRIORITY_IMAGES = [
  '/miar-logo.png',
  '/miar-badge.png',
] as const;

/**
 * Generate blur data URL for placeholder
 */
export function generateBlurDataURL(width: number = 10, height: number = 10): string {
  // Create a simple gray gradient as blur placeholder
  const canvas = typeof document !== 'undefined'
    ? document.createElement('canvas')
    : null;

  if (!canvas) {
    // Server-side fallback - return a data URL for a solid gray pixel
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN88h8AAvcB+mFVZzIAAAAASUVORK5CYII=';
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN88h8AAvcB+mFVZzIAAAAASUVORK5CYII=';
  }

  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#e5e7eb');
  gradient.addColorStop(1, '#d1d5db');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL();
}

/**
 * Get responsive srcset string for an image
 */
export function getResponsiveSizes(sizes: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
  default?: string;
}): string {
  const parts: string[] = [];

  if (sizes.mobile) parts.push(`(max-width: 640px) ${sizes.mobile}`);
  if (sizes.tablet) parts.push(`(max-width: 1024px) ${sizes.tablet}`);
  if (sizes.desktop) parts.push(`(max-width: 1920px) ${sizes.desktop}`);
  if (sizes.default) parts.push(sizes.default);

  return parts.join(', ') || '100vw';
}

/**
 * Common responsive size configurations
 */
export const RESPONSIVE_CONFIGS = {
  // Full width on all devices
  fullWidth: '100vw',

  // Container-based (typical content width)
  container: getResponsiveSizes({
    mobile: '100vw',
    tablet: '90vw',
    desktop: '1200px',
    default: '1200px',
  }),

  // Half width layouts
  halfWidth: getResponsiveSizes({
    mobile: '100vw',
    tablet: '50vw',
    desktop: '50vw',
    default: '50vw',
  }),

  // Card grid (3 columns on desktop, 2 on tablet, 1 on mobile)
  cardGrid: getResponsiveSizes({
    mobile: '100vw',
    tablet: '50vw',
    desktop: '33vw',
    default: '33vw',
  }),

  // Sidebar layouts
  mainContent: getResponsiveSizes({
    mobile: '100vw',
    tablet: '70vw',
    desktop: '70vw',
    default: '70vw',
  }),

  sidebar: getResponsiveSizes({
    mobile: '100vw',
    tablet: '30vw',
    desktop: '30vw',
    default: '30vw',
  }),
} as const;

/**
 * Check if image should be prioritized for loading
 */
export function shouldPrioritizeImage(src: string): boolean {
  return PRIORITY_IMAGES.some(priority => src.includes(priority));
}

/**
 * Get optimized image props for common scenarios
 */
export function getImageProps(scenario: keyof typeof IMAGE_SIZES, options?: {
  quality?: keyof typeof IMAGE_QUALITY;
  priority?: boolean;
  sizes?: string;
}) {
  const size = IMAGE_SIZES[scenario];
  const quality = options?.quality ? IMAGE_QUALITY[options.quality] : IMAGE_QUALITY.medium;

  return {
    width: size.width,
    height: size.height,
    quality,
    priority: options?.priority,
    sizes: options?.sizes || RESPONSIVE_CONFIGS.container,
    placeholder: 'blur' as const,
    blurDataURL: generateBlurDataURL(),
  };
}

/**
 * Image format detection
 */
export function getImageFormat(src: string): 'svg' | 'png' | 'jpg' | 'webp' | 'avif' | 'unknown' {
  const extension = src.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'svg':
      return 'svg';
    case 'png':
      return 'png';
    case 'jpg':
    case 'jpeg':
      return 'jpg';
    case 'webp':
      return 'webp';
    case 'avif':
      return 'avif';
    default:
      return 'unknown';
  }
}

/**
 * Validate image URL (basic security check)
 */
export function isValidImageURL(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Only allow https for external images
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:' && !url.startsWith('/')) {
      return false;
    }

    // Check file extension
    const format = getImageFormat(url);
    return format !== 'unknown';
  } catch {
    // If not a full URL, check if it's a valid relative path
    return url.startsWith('/') && getImageFormat(url) !== 'unknown';
  }
}

/**
 * Get loader for custom CDN (if needed)
 */
export function customImageLoader({ src, width, quality }: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // If using a custom CDN, modify this function
  // For now, use Next.js default loader
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, options?: {
  as?: 'image';
  type?: string;
  imageSrcSet?: string;
  imageSizes?: string;
}) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = options?.as || 'image';
  link.href = src;

  if (options?.type) link.type = options.type;
  if (options?.imageSrcSet) link.imageSrcset = options.imageSrcSet;
  if (options?.imageSizes) link.imageSizes = options.imageSizes;

  document.head.appendChild(link);
}

/**
 * Export data for image component documentation
 */
export const IMAGE_OPTIMIZATION_GUIDE = {
  // When to use priority prop
  usePriority: [
    'Above-the-fold images',
    'Hero images',
    'Logo in header',
    'First content image',
    'LCP (Largest Contentful Paint) candidate',
  ],

  // When to use different qualities
  useQuality: {
    low: ['Thumbnails', 'Background patterns', 'Non-critical decorative images'],
    medium: ['Standard content images', 'Product photos', 'Article images'],
    high: ['Portfolio images', 'High-detail visualizations', 'Print-quality exports'],
    max: ['Download-only images', 'Source files'],
  },

  // Responsive image best practices
  responsiveBestPractices: [
    'Use "sizes" prop to match your layout',
    'Let Next.js generate srcset automatically',
    'Use aspect ratio to prevent layout shift',
    'Add blur placeholder for better UX',
    'Prioritize images above the fold',
  ],

  // Common mistakes to avoid
  avoidMistakes: [
    'Never use Image without width/height (causes layout shift)',
    'Don\'t set priority on images below the fold',
    'Don\'t use Image for SVG icons (use regular img or inline SVG)',
    'Don\'t forget alt text for accessibility',
    'Don\'t exceed Next.js image size limit (default: 3000px)',
  ],
} as const;
