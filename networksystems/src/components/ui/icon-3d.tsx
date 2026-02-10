'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * 3D Gradient Icon Component
 *
 * A modern, animated icon component with 3D depth effects created using
 * layered gradients, rotation transforms, and smooth animations.
 *
 * Features:
 * - Layered gradient backgrounds for 3D depth
 * - Rotation effects on hover
 * - Customizable color schemes
 * - Built-in animation support
 * - Responsive sizing
 */

export type Icon3DVariant = 'server' | 'plant' | 'water' | 'custom';
export type Icon3DColor = 'blue' | 'emerald' | 'cyan' | 'purple' | 'amber' | 'rose';
export type Icon3DSize = 'sm' | 'md' | 'lg' | 'xl';

interface Icon3DProps {
  /** The icon variant to display */
  variant?: Icon3DVariant;
  /** Color scheme for the icon */
  color?: Icon3DColor;
  /** Size of the icon */
  size?: Icon3DSize;
  /** Custom content to render inside the icon */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Disable hover animations */
  disableHover?: boolean;
}

const sizeClasses: Record<Icon3DSize, string> = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
  xl: 'w-24 h-24',
};

const colorGradients: Record<Icon3DColor, {
  layer1: string;
  layer2: string;
  main: string;
}> = {
  blue: {
    layer1: 'from-blue-400 via-blue-500 to-blue-600',
    layer2: 'from-blue-500 via-blue-600 to-blue-700',
    main: 'from-blue-400 to-blue-600',
  },
  emerald: {
    layer1: 'from-emerald-400 via-emerald-500 to-emerald-600',
    layer2: 'from-emerald-500 via-emerald-600 to-emerald-700',
    main: 'from-emerald-400 to-emerald-600',
  },
  cyan: {
    layer1: 'from-cyan-400 via-cyan-500 to-cyan-600',
    layer2: 'from-cyan-500 via-cyan-600 to-cyan-700',
    main: 'from-cyan-400 to-cyan-600',
  },
  purple: {
    layer1: 'from-purple-400 via-purple-500 to-purple-600',
    layer2: 'from-purple-500 via-purple-600 to-purple-700',
    main: 'from-purple-400 to-purple-600',
  },
  amber: {
    layer1: 'from-amber-400 via-amber-500 to-amber-600',
    layer2: 'from-amber-500 via-amber-600 to-amber-700',
    main: 'from-amber-400 to-amber-600',
  },
  rose: {
    layer1: 'from-rose-400 via-rose-500 to-rose-600',
    layer2: 'from-rose-500 via-rose-600 to-rose-700',
    main: 'from-rose-400 to-rose-600',
  },
};

const ServerIcon = () => (
  <div className="space-y-1">
    <div className="flex gap-1">
      <div className="w-2 h-2 bg-white/90 rounded-sm animate-pulse"></div>
      <div className="w-2 h-2 bg-white/70 rounded-sm animate-pulse" style={{ animationDelay: '0.2s' }}></div>
    </div>
    <div className="flex gap-1">
      <div className="w-2 h-2 bg-white/70 rounded-sm animate-pulse" style={{ animationDelay: '0.4s' }}></div>
      <div className="w-2 h-2 bg-white/90 rounded-sm animate-pulse" style={{ animationDelay: '0.6s' }}></div>
    </div>
  </div>
);

const PlantIcon = () => (
  <div className="space-y-0.5">
    <div className="w-1 h-3 bg-white/90 rounded-full mx-auto"></div>
    <div className="flex gap-1.5">
      <div className="w-2.5 h-2.5 bg-white/80 rounded-full animate-pulse"></div>
      <div className="w-2.5 h-2.5 bg-white/90 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
    </div>
    <div className="flex gap-1">
      <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
      <div className="w-2 h-2 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '0.9s' }}></div>
      <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '1.2s' }}></div>
    </div>
  </div>
);

const WaterIcon = () => (
  <div className="relative">
    <div className="w-5 h-6 bg-white/90 rounded-t-full rounded-b-full"></div>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-200 rounded-full animate-pulse"></div>
    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1">
      <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce"></div>
      <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
    </div>
  </div>
);

const variantIcons: Record<Icon3DVariant, React.ReactNode | null> = {
  server: <ServerIcon />,
  plant: <PlantIcon />,
  water: <WaterIcon />,
  custom: null,
};

export function Icon3D({
  variant = 'custom',
  color = 'blue',
  size = 'md',
  children,
  className,
  disableHover = false,
}: Icon3DProps) {
  const gradients = colorGradients[color];
  const iconContent = variant === 'custom' ? children : variantIcons[variant];

  return (
    <div
      className={cn(
        'relative',
        sizeClasses[size],
        !disableHover && 'group-hover:scale-110',
        'transition-transform duration-500',
        className
      )}
    >
      {/* Background Layer 1 - Rotated */}
      <div
        className={cn(
          'absolute inset-0',
          'bg-gradient-to-br',
          gradients.layer1,
          'rounded-2xl',
          'rotate-6',
          !disableHover && 'group-hover:rotate-12',
          'transition-transform duration-500',
          'shadow-lg',
          !disableHover && 'group-hover:shadow-2xl'
        )}
      />

      {/* Background Layer 2 - Counter-rotated */}
      <div
        className={cn(
          'absolute inset-0',
          'bg-gradient-to-br',
          gradients.layer2,
          'rounded-2xl',
          '-rotate-6',
          !disableHover && 'group-hover:-rotate-12',
          'transition-transform duration-500',
          'shadow-lg',
          'opacity-80'
        )}
      />

      {/* Main Content Layer */}
      <div
        className={cn(
          'absolute inset-0',
          'bg-gradient-to-br',
          gradients.main,
          'rounded-2xl',
          'flex items-center justify-center',
          'shadow-xl'
        )}
      >
        {iconContent}
      </div>
    </div>
  );
}

// Export individual icon components for convenience
export const ServerIcon3D = (props: Omit<Icon3DProps, 'variant'>) => (
  <Icon3D variant="server" color="blue" {...props} />
);

export const PlantIcon3D = (props: Omit<Icon3DProps, 'variant'>) => (
  <Icon3D variant="plant" color="emerald" {...props} />
);

export const WaterIcon3D = (props: Omit<Icon3DProps, 'variant'>) => (
  <Icon3D variant="water" color="cyan" {...props} />
);
