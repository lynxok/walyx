"use client";

import React, { useState } from "react";
import { ShoppingCart, X, Trash2, ChevronRight, Sparkles } from "lucide-react";
import { PremiumButton } from "./PremiumButton";
import { ProductData } from "./ProductCard";

interface CartItem {
  product: ProductData;
  quantity: number;
  options?: any;
}

interface FloatingCartProps {
  cartItems: CartItem[];
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
}

export const FloatingCart: React.FC<FloatingCartProps> = ({
  cartItems,
  onRemoveItem,
  onClearCart,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const totalItems = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalPrice = cartItems.reduce((acc, curr) => acc + curr.product.price * curr.quantity, 0);

  return (
    <>
      {/* Floating Trigger Badge */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-2xl shadow-amber-500/20 hover:shadow-amber-500/40 border border-amber-400/20 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer"
      >
        <ShoppingCart className="w-6 h-6" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-zinc-950 anim-pulse">
            {totalItems}
          </span>
        )}
      </button>

      {/* Cart Drawer Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed top-0 right-0 h-[100dvh] w-full sm:w-[420px] bg-zinc-950/95 backdrop-blur-2xl border-l border-zinc-800/80 shadow-2xl z-50 flex flex-col justify-between transition-all duration-300 animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-zinc-100">Carrito de compras</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {cartItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-300">Tu carrito está vacío</h4>
                    <p className="text-xs text-zinc-550 mt-1 max-w-[200px] mx-auto">Agrega viandas o productos exquisitos para comenzar tu orden.</p>
                  </div>
                </div>
              ) : (
                cartItems.map((item, index) => (
                  <div key={index} className="flex gap-4 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 relative group">
                    <img 
                      src={item.product.image} 
                      alt={item.product.name} 
                      className="w-16 h-16 object-cover rounded-lg bg-zinc-800"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-zinc-200 truncate pr-6">{item.product.name}</h4>
                        {item.options && Object.keys(item.options).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {Object.entries(item.options).map(([key, val]) => (
                              <span key={key} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/60 text-zinc-400 capitalize">
                                {key}: {String(val)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-zinc-400">Cant: {item.quantity}</span>
                        <span className="text-sm font-bold text-amber-500">${item.product.price * item.quantity}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => onRemoveItem(index)}
                      className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-rose-500/10 text-zinc-500 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary */}
            {cartItems.length > 0 && (
              <div className="p-6 border-t border-zinc-900 bg-zinc-950/90 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Total estimado:</span>
                  <span className="text-xl font-black text-amber-500">${totalPrice}</span>
                </div>
                <div className="flex gap-3">
                  <PremiumButton 
                    variant="outline" 
                    className="flex-1 font-semibold text-xs py-3"
                    onClick={onClearCart}
                  >
                    Vaciar
                  </PremiumButton>
                  <PremiumButton 
                    variant="primary" 
                    glow 
                    className="flex-2 font-bold text-xs py-3"
                    onClick={() => alert("¡Procediendo al pago premium!")}
                  >
                    Finalizar Compra
                    <ChevronRight className="w-4 h-4" />
                  </PremiumButton>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};
