import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-light ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    
    const variantClasses = {
      default: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all",
      destructive: "bg-rose-600 text-white hover:bg-rose-700 shadow-md hover:shadow-lg transition-all",
      outline: "border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 transition-colors",
      secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 transition-colors",
      ghost: "hover:bg-zinc-100 text-zinc-700 transition-colors",
      link: "text-emerald-600 underline-offset-4 hover:underline hover:text-emerald-700 transition-colors"
    };
    
    const sizeClasses = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10"
    };

    return (
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };