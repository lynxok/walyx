"use client";

import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  icon,
}) => {
  return (
    <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
      {/* Decorative radial gradient background glow */}
      <div className="absolute -right-10 -top-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500" />
      
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-zinc-400">{title}</span>
        {icon && (
          <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-amber-500 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-3xl font-bold text-zinc-50 tracking-tight mb-2 group-hover:text-amber-400 transition-colors duration-300">
          {value}
        </h3>
        <p className="flex items-center gap-1.5 text-xs">
          <span className={`font-semibold ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
            {isPositive ? "+" : ""}{change}
          </span>
          <span className="text-zinc-500">desde el último mes</span>
        </p>
      </div>
    </div>
  );
};
