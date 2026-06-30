"use client";

import React from "react";

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  glow?: boolean;
  children: React.ReactNode;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  variant = "primary",
  size = "md",
  glow = false,
  className = "",
  children,
  ...props
}) => {
  const baseStyles = "relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 active:scale-[0.97] cursor-pointer outline-none select-none overflow-hidden";
  
  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3 text-base",
  };

  const variantStyles = {
    primary: "bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 border border-amber-400/20 animate-shine",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/60 shadow-md",
    outline: "bg-transparent border border-zinc-700 hover:border-amber-500/50 hover:bg-amber-500/5 text-zinc-300 hover:text-amber-500",
    ghost: "bg-transparent hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200",
  };

  const glowStyles = glow && variant === "primary"
    ? "before:absolute before:inset-0 before:bg-amber-400/30 before:blur-xl before:-z-10 hover:before:opacity-100 before:transition-opacity"
    : "";

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${glowStyles} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
};
