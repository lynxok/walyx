"use client";

import React, { useState } from "react";
import { 
  LayoutDashboard, 
  Utensils, 
  Settings, 
  ShoppingBag, 
  Users, 
  Menu, 
  X,
  Sparkles
} from "lucide-react";

interface SidebarProps {
  activeSection: string;
  onSelectSection: (section: string) => void;
}

export const GlassSidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "viandas", label: "Viandas / Menú", icon: Utensils },
    { id: "orders", label: "Pedidos", icon: ShoppingBag },
    { id: "customers", label: "Clientes", icon: Users },
    { id: "settings", label: "Configuración", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-100 backdrop-blur-md shadow-lg"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-[100dvh] lg:h-[calc(100vh-2rem)] my-0 lg:my-4 ml-0 lg:ml-4 z-45 w-72 rounded-none lg:rounded-2xl border-r lg:border border-zinc-850 bg-zinc-950/85 backdrop-blur-xl p-6 flex flex-col justify-between shadow-2xl transition-all duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col gap-8">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-zinc-950 font-bold shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-zinc-100">Catering VIP</h2>
              <p className="text-[10px] text-zinc-500 font-semibold tracking-widest uppercase">Admin Panel</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectSection(item.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-left cursor-pointer transition-all duration-200 ${
                    isActive
                      ? "bg-amber-500 text-zinc-950 font-semibold shadow-lg shadow-amber-500/10"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-zinc-950" : "text-zinc-400"}`} />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile footer info */}
        <div className="border-t border-zinc-900 pt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-sm text-zinc-200">
            GC
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-zinc-200 truncate">Chef Gourmet</h4>
            <p className="text-xs text-zinc-500 truncate">chef@catering.vip</p>
          </div>
        </div>
      </aside>
    </>
  );
};
