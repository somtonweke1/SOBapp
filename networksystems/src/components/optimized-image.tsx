'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';
import {
  getImageProps,
  shouldPrioritizeImage,
  isValidImageURL,
  IMAGE_SIZES,
  IMAGE_QUALITY,
  RESPONSIVE_CONFIGS,
} from '@/lib/image-utils';

/**
 * OptimizedImage Component
 * Wrapper around Next.js Image with built-in optimizations and error handling
 */

export interface OptimizedImageProps extends Omit<ImageProps, 'width' | 'height' | 'src' | 'quality'> {
  src: string;
  alt: string;

  // Size presets or custom dimensions
  preset?: keyof typeof IMAGE_SIZES;
  width?: number;
  height?: number;

  // Quality preset
  quality?: keyof typeof IMAGE_QUALITY | number;

  // Responsive configuration
  responsiveConfig?: keyof typeof RESPONSIVE_CONFIGS;

  // Fallback image on error
  fallbackSrc?: string;

  // Custom class names
  containerClassName?: string;
  imageClassName?: string;

  // Loading state UI
  showLoadingState?: boolean;

  // Auto-priority based on image source
  autoPriority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  preset = 'content',
  width,
  height,
  quality = 'medium',
  responsiveConfig = 'container',
  fallbackSrc = '/placeholder-image.png',
  containerClassName = '',
  imageClassName = '',
  showLoadingState = true,
  autoPriority = true,
  priority: explicitPriority,
  sizes,
  className,
  ...props
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Validate image URL
  if (!isValidImageURL(src) && !hasError) {
    console.warn(`Invalid image URL: ${src}`);
    setHasError(true);
  }

  // Determine dimensions
  const dimensions = preset && !width && !height
    ? IMAGE_SIZES[preset]
    : { width: width || 800, height: height || 600 };

  // Determine quality
  const imageQuality = typeof quality === 'number'
    ? quality
    : IMAGE_QUALITY[quality];

  // Determine priority
  const shouldBePriority = explicitPriority !== undefined
    ? explicitPriority
    : autoPriority && shouldPrioritizeImage(src);

  // Determine sizes attribute
  const sizesAttr = sizes || RESPONSIVE_CONFIGS[responsiveConfig];

  // Handle error
  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  // Handle load complete
  const handleLoadComplete = () => {
    setIsLoading(false);
  };

  // Use fallback image if error occurred
  const imageSrc = hasError ? fallbackSrc : src;

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {/* Loading state */}
      {showLoadingState && isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ aspectRatio: `${dimensions.width} / ${dimensions.height}` }}
        />
      )}

      {/* Optimized Image */}
      <Image
        src={imageSrc}
        alt={alt}
        width={dimensions.width}
        height={dimensions.height}
        quality={imageQuality}
        priority={shouldBePriority}
        sizes={sizesAttr}
        className={`${imageClassName} ${className || ''} ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoadComplete}
        {...props}
      />

      {/* Error state (if needed) */}
      {hasError && src !== fallbackSrc && (
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-red-500/80 text-white text-xs rounded">
          Image failed to load
        </div>
      )}
    </div>
  );
}

/**
 * Specialized image components for common use cases
 */

export function AvatarImage({
  src,
  alt,
  size = 64,
  ...props
}: Omit<OptimizedImageProps, 'preset' | 'width' | 'height'> & {
  size?: 32 | 64 | 128;
}) {
  const preset: keyof typeof IMAGE_SIZES = size === 32 ? 'icon' : size === 64 ? 'avatar' : 'thumbnail';

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      preset={preset}
      containerClassName="rounded-full"
      imageClassName="rounded-full object-cover"
      quality="high"
      {...props}
    />
  );
}

export function ThumbnailImage({
  src,
  alt,
  ...props
}: Omit<OptimizedImageProps, 'preset'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      preset="thumbnail"
      containerClassName="rounded-md"
      imageClassName="object-cover"
      quality="low"
      {...props}
    />
  );
}

export function CardImage({
  src,
  alt,
  size = 'medium',
  ...props
}: Omit<OptimizedImageProps, 'preset'> & {
  size?: 'small' | 'medium' | 'large';
}) {
  const preset: keyof typeof IMAGE_SIZES =
    size === 'small' ? 'cardSmall' :
    size === 'large' ? 'cardLarge' :
    'cardMedium';

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      preset={preset}
      containerClassName="rounded-lg"
      imageClassName="object-cover"
      responsiveConfig="cardGrid"
      {...props}
    />
  );
}

export function HeroImage({
  src,
  alt,
  ...props
}: Omit<OptimizedImageProps, 'preset' | 'priority' | 'responsiveConfig'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      preset="hero"
      priority={true}
      responsiveConfig="fullWidth"
      imageClassName="object-cover"
      quality="high"
      {...props}
    />
  );
}

export function ChartImage({
  src,
  alt,
  size = 'medium',
  ...props
}: Omit<OptimizedImageProps, 'preset'> & {
  size?: 'small' | 'medium' | 'large';
}) {
  const preset: keyof typeof IMAGE_SIZES =
    size === 'small' ? 'chartSmall' :
    size === 'large' ? 'chartLarge' :
    'chartMedium';

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      preset={preset}
      quality="high"
      {...props}
    />
  );
}

/**
 * Logo component with automatic priority
 */
export function Logo({
  variant = 'default',
  size = 'medium',
  ...props
}: Omit<OptimizedImageProps, 'src' | 'alt' | 'preset'> & {
  variant?: 'default' | 'badge';
  size?: 'small' | 'medium' | 'large';
}) {
  const src = variant === 'badge' ? '/miar-badge.png' : '/miar-logo.png';
  const dimensions = {
    small: { width: 32, height: 32 },
    medium: { width: 48, height: 48 },
    large: { width: 64, height: 64 },
  }[size];

  return (
    <OptimizedImage
      src={src}
      alt="SOBapp Platform Logo"
      width={dimensions.width}
      height={dimensions.height}
      priority={true}
      quality="high"
      {...props}
    />
  );
}

export default OptimizedImage;
