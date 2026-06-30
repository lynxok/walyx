"use client";

import React, { useState } from "react";

interface Tenant {
  id: string;
  name: string;
  type: "viandas" | "clothing" | "bakery";
  logoUrl?: string;
}

interface TenantSelectorProps {
  tenants: Tenant[];
  activeTenantId: string;
  onSelectTenant: (tenant: Tenant) => void;
}

export const TenantSelector: React.FC<TenantSelectorProps> = ({
  tenants,
  activeTenantId,
  onSelectTenant,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const activeTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0];

  const getBadgeColor = (type: Tenant["type"]) => {
    switch (type) {
      case "viandas":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "clothing":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "bakery":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";
    }
  };

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 text-zinc-100 transition-all duration-200 cursor-pointer text-left select-none min-w-[210px] shadow-lg shadow-black/20"
      >
        <div className="flex-1">
          <div className="text-xs text-zinc-500 font-semibold tracking-wider uppercase">Negocio Activo</div>
          <div className="text-sm font-bold text-zinc-200 flex items-center gap-2">
            {activeTenant?.name}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-normal uppercase ${getBadgeColor(activeTenant?.type)}`}>
              {activeTenant?.type}
            </span>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[calc(100%+8px)] left-0 w-full rounded-2xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-xl p-2 shadow-2xl shadow-black/80 flex flex-col gap-1 anim-fade-in">
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => {
                  onSelectTenant(tenant);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between w-full p-2.5 rounded-xl text-left cursor-pointer transition-all duration-150 ${
                  tenant.id === activeTenantId
                    ? "bg-zinc-800/80 text-zinc-100"
                    : "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div>
                  <div className="text-sm font-semibold">{tenant.name}</div>
                  <div className="text-xs text-zinc-500 capitalize">{tenant.type}</div>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold uppercase ${getBadgeColor(tenant.type)}`}>
                  {tenant.type}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
