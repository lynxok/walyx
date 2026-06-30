"use client";

import React, { useState } from "react";
import { Sparkles, ShoppingCart, Heart, Activity } from "lucide-react";
import { PremiumButton } from "./PremiumButton";

export type ProductType = "clothing" | "vianda" | "bakery";

export interface ProductData {
  id: string;
  name: string;
  price: number;
  image: string;
  type: ProductType;
  description: string;
  // Specific data
  calories?: number;
  protein?: string;
  carbs?: string;
  sizes?: string[];
  colors?: string[];
  portions?: number[];
}

interface ProductCardProps {
  product: ProductData;
  onAddToCart: (product: ProductData, options: any) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "");
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "");
  const [selectedPortions, setSelectedPortions] = useState(product.portions?.[0] || 1);
  const [liked, setLiked] = useState(false);

  // Clothing Config Selector
  const renderClothingSelector = () => (
    <div className="flex flex-col gap-3 mt-4">
      <div>
        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1.5">Tallas</div>
        <div className="flex gap-2">
          {product.sizes?.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold border flex items-center justify-center transition-all cursor-pointer ${
                selectedSize === size
                  ? "bg-amber-500 text-zinc-950 border-amber-500"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1.5">Colores</div>
        <div className="flex gap-2">
          {product.colors?.map((color) => {
            const colorMap: Record<string, string> = {
              Negro: "bg-black",
              Blanco: "bg-white border-zinc-700",
              Rojo: "bg-rose-600",
              Azul: "bg-blue-600",
            };
            return (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                  selectedColor === color ? "border-amber-500 scale-110" : "border-transparent"
                } ${colorMap[color] || "bg-zinc-500"}`}
                title={color}
              />
            );
          })}
        </div>
      </div>
    </div>
  );

  // Vianda Nutrition Stats
  const renderViandaStats = () => (
    <div className="mt-4 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-around gap-2 text-center">
      <div className="flex flex-col items-center">
        <Activity className="w-4 h-4 text-amber-500 mb-0.5" />
        <span className="text-[10px] text-zinc-500">Calorías</span>
        <span className="text-xs font-bold text-zinc-200">{product.calories} kcal</span>
      </div>
      <div className="w-px h-8 bg-zinc-800" />
      <div>
        <div className="text-[10px] text-zinc-500">Proteína</div>
        <div className="text-xs font-bold text-zinc-200">{product.protein}</div>
      </div>
      <div className="w-px h-8 bg-zinc-800" />
      <div>
        <div className="text-[10px] text-zinc-500">Carbos</div>
        <div className="text-xs font-bold text-zinc-200">{product.carbs}</div>
      </div>
    </div>
  );

  // Bakery Portions
  const renderBakerySelector = () => (
    <div className="mt-4">
      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1.5">Porciones</div>
      <div className="flex gap-2">
        {product.portions?.map((port) => (
          <button
            key={port}
            onClick={() => setSelectedPortions(port)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center justify-center transition-all cursor-pointer ${
              selectedPortions === port
                ? "bg-amber-500 text-zinc-950 border-amber-500"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {port} {port === 1 ? "unidad" : "porciones"}
          </button>
        ))}
      </div>
    </div>
  );

  const handleAdd = () => {
    const options: any = {};
    if (product.type === "clothing") {
      options.size = selectedSize;
      options.color = selectedColor;
    } else if (product.type === "bakery") {
      options.portions = selectedPortions;
    }
    onAddToCart(product, options);
  };

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl overflow-hidden flex flex-col group h-full">
      {/* Product Image Panel */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
        <img
          src={product.image}
          alt={product.name}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
        {/* Type Badge */}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-amber-500">
          {product.type === "vianda" ? "Vianda FIT" : product.type === "clothing" ? "Moda" : "Pastelería"}
        </span>
        {/* Like Button */}
        <button
          onClick={() => setLiked(!liked)}
          className="absolute top-3 right-3 p-2 rounded-lg bg-zinc-950/85 backdrop-blur-md border border-zinc-800 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-rose-500 text-rose-500" : ""}`} />
        </button>
      </div>

      {/* Product details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-lg text-zinc-100 group-hover:text-amber-400 transition-colors duration-300">
              {product.name}
            </h3>
            <span className="text-lg font-black text-amber-500 whitespace-nowrap">
              ${product.price}
            </span>
          </div>
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Dynamic configs per Type */}
          {product.type === "clothing" && renderClothingSelector()}
          {product.type === "vianda" && renderViandaStats()}
          {product.type === "bakery" && renderBakerySelector()}
        </div>

        <div className="mt-5 pt-4 border-t border-zinc-900 flex gap-2">
          {product.type === "vianda" && (
            <PremiumButton variant="outline" size="sm" className="flex-1 text-[11px]" onClick={() => alert("Personalización nutricional!")}>
              Personalizar
            </PremiumButton>
          )}
          <PremiumButton
            variant="primary"
            size="sm"
            className="flex-1 font-bold text-[11px]"
            onClick={handleAdd}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Añadir
          </PremiumButton>
        </div>
      </div>
    </div>
  );
};
