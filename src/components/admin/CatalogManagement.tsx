"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Save, 
  Check, 
  X, 
  Grid, 
  List, 
  Package, 
  Layers, 
  Sparkles,
  Loader2,
  CheckSquare
} from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  updateProductsBulk 
} from "@/app/actions/product";
import { 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from "@/app/actions/category";
import { getSizeCharts, type SizeChartWithRows } from "@/app/actions/sizeChart";

interface CatalogManagementProps {
  tenant: any;
  categories: any[];
  products: any[];
  onRefresh: () => void;
}

export default function CatalogManagement({
  tenant,
  categories,
  products,
  onRefresh
}: CatalogManagementProps) {
  const hasType = categories.length > 0 ? categories[0].type : "VIANDA";

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  
  // View Mode: 'grid' for standard card list, 'bulk' for Stock/Price Bulk Editor
  const [viewMode, setViewMode] = useState<"grid" | "bulk">("grid");

  // Size charts for ROPA reference
  const [sizeCharts, setSizeCharts] = useState<SizeChartWithRows[]>([]);
  useEffect(() => {
    if (hasType === "ROPA") {
      getSizeCharts(tenant.id).then((charts) => setSizeCharts(charts));
    }
  }, [tenant.id, hasType]);

  // Bulk Edit State
  // Keep track of modified products: { [productId]: { price, stock, isActive } }
  const [bulkChanges, setBulkChanges] = useState<{
    [key: string]: { price?: number; stock?: number; isActive?: boolean };
  }>({});
  const [savingBulk, setSavingBulk] = useState(false);

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrice, setProdPrice] = useState(0);
  const [prodStock, setProdStock] = useState(0);
  const [prodImageUrl, setProdImageUrl] = useState("");
  const [prodCategoryId, setProdCategoryId] = useState("");
  
  // Clothing attributes
  const [prodSize, setProdSize] = useState("");
  const [prodColor, setProdColor] = useState("");
  const [prodMaterial, setProdMaterial] = useState("");
  
  // Viandas attributes
  const [prodCalories, setProdCalories] = useState(0);
  const [prodIngredients, setProdIngredients] = useState("");
  const [prodIsVegan, setProdIsVegan] = useState(false);
  const [prodIsGlutenFree, setProdIsGlutenFree] = useState(false);
  
  // Pasteleria attributes
  const [prodSweetness, setProdSweetness] = useState("");
  const [prodPortions, setProdPortions] = useState(1);

  // Category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [catName, setCatName] = useState("");
  const [catPrice, setCatPrice] = useState<number>(0);
  const [categoryError, setCategoryError] = useState("");

  // Sync product price with category price automatically when category changes (VIANDA only)
  useEffect(() => {
    if (hasType === "VIANDA" && prodCategoryId) {
      const selectedCat = categories.find((c) => c.id === prodCategoryId);
      if (selectedCat && selectedCat.price !== null && selectedCat.price !== undefined) {
        setProdPrice(selectedCat.price);
      }
    }
  }, [prodCategoryId, categories, hasType]);

  // Reset bulk changes when products change or switching views
  useEffect(() => {
    setBulkChanges({});
  }, [products, viewMode]);

  // Filtering products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategoryId === "all" || p.categoryId === selectedCategoryId;
      const matchesStatus = 
        statusFilter === "all" || 
        (statusFilter === "active" && p.isActive) || 
        (statusFilter === "inactive" && !p.isActive);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, selectedCategoryId, statusFilter]);

  // Product modal helpers
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProdName("");
    setProdDesc("");
    setProdPrice(0);
    setProdStock(0);
    setProdImageUrl("");
    setProdCategoryId(categories[0]?.id || "");
    setProdSize("");
    setProdColor("");
    setProdMaterial("");
    setProdCalories(0);
    setProdIngredients("");
    setProdIsVegan(false);
    setProdIsGlutenFree(false);
    setProdSweetness("");
    setProdPortions(1);
    setShowProductModal(true);
  };

  const handleOpenEditModal = (p: any) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdDesc(p.description || "");
    setProdPrice(p.price);
    setProdStock(p.stock);
    setProdImageUrl(p.imageUrl || "");
    setProdCategoryId(p.categoryId);
    setProdSize(p.size || "");
    setProdColor(p.color || "");
    setProdMaterial(p.material || "");
    setProdCalories(p.calories || 0);
    setProdIngredients(p.ingredients || "");
    setProdIsVegan(p.isVegan || false);
    setProdIsGlutenFree(p.isGlutenFree || false);
    setProdSweetness(p.sweetnessLevel || "");
    setProdPortions(p.portions || 1);
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const inheritedPrice = hasType === "VIANDA" 
      ? (categories.find(c => c.id === prodCategoryId)?.price || 0)
      : prodPrice;

    if (!prodName || inheritedPrice <= 0 || !prodCategoryId) {
      alert("Por favor asegúrate de que el producto tenga un nombre, categoría y precio válido.");
      return;
    }

    const payload = {
      name: prodName,
      description: prodDesc,
      price: inheritedPrice,
      stock: prodStock,
      imageUrl: prodImageUrl,
      tenantId: tenant.id,
      categoryId: prodCategoryId,
      size: prodSize || undefined,
      color: prodColor || undefined,
      material: prodMaterial || undefined,
      calories: prodCalories || undefined,
      ingredients: prodIngredients || undefined,
      isVegan: prodIsVegan,
      isGlutenFree: prodIsGlutenFree,
      sweetnessLevel: prodSweetness || undefined,
      portions: prodPortions || undefined,
    };

    let res;
    if (editingProduct) {
      res = await updateProduct(editingProduct.id, payload);
    } else {
      res = await createProduct(payload);
    }

    if (res.success) {
      setShowProductModal(false);
      onRefresh();
    } else {
      alert(res.error || "Error al guardar el producto.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      const res = await deleteProduct(id);
      if (res.success) {
        onRefresh();
      } else {
        alert(res.error || "Error al eliminar el producto.");
      }
    }
  };

  // Category Modal helpers
  const handleOpenCreateCategoryModal = () => {
    setEditingCategory(null);
    setCatName("");
    setCatPrice(0);
    setCategoryError("");
    setShowCategoryModal(true);
  };

  const handleOpenEditCategoryModal = (cat: any) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatPrice(cat.price || 0);
    setCategoryError("");
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;

    const catSlug = catName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    let res;
    if (editingCategory) {
      res = await updateCategory(editingCategory.id, {
        name: catName,
        slug: catSlug,
        type: hasType,
        price: hasType === "VIANDA" ? catPrice : undefined,
      });
    } else {
      res = await createCategory({
        name: catName,
        slug: catSlug,
        type: hasType,
        price: hasType === "VIANDA" ? catPrice : undefined,
        tenantId: tenant.id,
      });
    }

    if (res.success) {
      setShowCategoryModal(false);
      onRefresh();
    } else {
      setCategoryError(res.error || "Error al guardar la categoría.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta categoría? Se eliminarán también todos los productos asociados debido al borrado en cascada.")) {
      const res = await deleteCategory(id);
      if (res.success) {
        onRefresh();
      } else {
        alert(res.error || "Error al eliminar la categoría.");
      }
    }
  };

  // Bulk Edit helpers
  const handleBulkChange = (productId: string, field: "price" | "stock" | "isActive", value: any) => {
    setBulkChanges(prev => {
      const productOrig = products.find(p => p.id === productId);
      if (!productOrig) return prev;

      const currentChanges = prev[productId] || {};
      const newChanges = { ...currentChanges, [field]: value };

      // Remove change entry if it matches original value
      if (newChanges[field] === productOrig[field]) {
        delete newChanges[field];
      }

      if (Object.keys(newChanges).length === 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }

      return { ...prev, [productId]: newChanges };
    });
  };

  const handleSaveBulk = async () => {
    const updates = Object.entries(bulkChanges).map(([id, changes]) => ({
      id,
      ...changes
    }));

    if (updates.length === 0) {
      alert("No hay cambios pendientes para guardar.");
      return;
    }

    setSavingBulk(true);
    const res = await updateProductsBulk(updates);
    setSavingBulk(false);

    if (res.success) {
      alert("Productos actualizados exitosamente.");
      setBulkChanges({});
      onRefresh();
    } else {
      alert(res.error || "Error al actualizar los productos en lote.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Catálogo de Productos</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Define los artículos de venta de tu negocio.</p>
        </div>
        <div className="flex items-center gap-2">
          <PremiumButton variant="outline" size="sm" onClick={handleOpenCreateCategoryModal}>
            <Plus className="w-4 h-4" /> Categoría
          </PremiumButton>
          <PremiumButton variant="primary" size="sm" onClick={handleOpenCreateProduct} glow>
            <Plus className="w-4 h-4" /> Agregar Producto
          </PremiumButton>
        </div>
      </div>

      {/* FILTER & VIEW TOGGLE BAR */}
      <div className="glass-panel p-4 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Quick Search */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-900 text-xs text-white pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            
            {/* Status Filter Toggle */}
            <div className="flex items-center bg-zinc-950 border border-zinc-900 rounded-xl p-1 text-xs">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === "all" ? "bg-amber-500/15 text-amber-500 font-bold" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === "active" ? "bg-amber-500/15 text-amber-500 font-bold" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                Activos
              </button>
              <button
                onClick={() => setStatusFilter("inactive")}
                className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === "inactive" ? "bg-amber-500/15 text-amber-500 font-bold" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                Inactivos
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-zinc-950 border border-zinc-900 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Vista Grilla"
                className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("bulk")}
                title="Editor Masivo"
                className={`p-1.5 rounded-lg transition-all ${viewMode === "bulk" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Chips Filter */}
        <div className="flex flex-wrap items-center gap-2 border-t border-zinc-900/60 pt-3">
          <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider mr-2">Categorías:</span>
          <button
            onClick={() => setSelectedCategoryId("all")}
            className={`px-3 py-1.5 rounded-xl text-xs border transition-all ${
              selectedCategoryId === "all"
                ? "bg-amber-500/10 border-amber-500 text-amber-400 font-bold"
                : "bg-zinc-950/60 border-zinc-900 text-zinc-400 hover:border-zinc-800"
            }`}
          >
            Todas
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategoryId(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs border transition-all ${
                selectedCategoryId === c.id
                  ? "bg-amber-500/10 border-amber-500 text-amber-400 font-bold"
                  : "bg-zinc-950/60 border-zinc-900 text-zinc-400 hover:border-zinc-800"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCTS DISPLAY */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-zinc-500 text-xs">
              No se encontraron productos con los filtros seleccionados.
            </div>
          ) : (
            filteredProducts.map((p) => (
              <div 
                key={p.id} 
                className={`bg-zinc-900/20 border rounded-2xl p-5 flex gap-4 hover:border-zinc-800 transition-colors ${
                  p.isActive ? "border-zinc-900" : "border-zinc-950/40 opacity-60"
                }`}
              >
                {p.imageUrl && (
                  <img src={p.imageUrl} alt={p.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                )}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-sm truncate">{p.name}</h3>
                        <span className="text-[9px] px-1.5 py-0.2 bg-zinc-950 border border-zinc-900 text-zinc-400 rounded uppercase inline-block mt-0.5 font-semibold">
                          {p.category?.name || "Sin Categoría"}
                        </span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => handleOpenEditModal(p)} className="p-1 text-zinc-400 hover:text-amber-500 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="p-1 text-zinc-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-2 mt-1.5">{p.description || "Sin descripción"}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-amber-500 font-bold text-sm">
                      ${p.price.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500 text-xs">Stock: {p.stock}</span>
                      <span className={`w-2 h-2 rounded-full ${p.isActive ? "bg-emerald-500" : "bg-zinc-600"}`} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* BULK EDITOR VIEW */
        <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Editor Masivo de Stock/Precios</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Edita valores directamente en la grilla. Las celdas modificadas se guardarán al confirmar.</p>
            </div>
            <PremiumButton 
              variant="primary" 
              size="sm" 
              onClick={handleSaveBulk} 
              disabled={Object.keys(bulkChanges).length === 0 || savingBulk}
            >
              {savingBulk ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Guardar Cambios ({Object.keys(bulkChanges).length})
                </>
              )}
            </PremiumButton>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">Producto</th>
                  <th className="py-3 px-2">Categoría</th>
                  <th className="py-3 px-2 w-32">Precio ($)</th>
                  <th className="py-3 px-2 w-32">Stock</th>
                  <th className="py-3 px-2 w-24 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-zinc-500">
                      No se encontraron productos.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isVianda = p.category?.type === "VIANDA";
                    
                    // Current edited values or original values
                    const currentPrice = bulkChanges[p.id]?.price !== undefined 
                      ? (bulkChanges[p.id].price ?? 0)
                      : p.price;
                    const currentStock = bulkChanges[p.id]?.stock !== undefined
                      ? (bulkChanges[p.id].stock ?? 0)
                      : p.stock;
                    const currentActive = bulkChanges[p.id]?.isActive !== undefined
                      ? !!bulkChanges[p.id].isActive
                      : p.isActive;

                    const isPriceChanged = bulkChanges[p.id]?.price !== undefined;
                    const isStockChanged = bulkChanges[p.id]?.stock !== undefined;
                    const isActiveChanged = bulkChanges[p.id]?.isActive !== undefined;

                    return (
                      <tr 
                        key={p.id} 
                        className={`border-b border-zinc-900/60 hover:bg-zinc-900/10 transition-colors ${
                          currentActive ? "" : "opacity-60"
                        }`}
                      >
                        <td className="py-3 px-2 font-medium text-white">{p.name}</td>
                        <td className="py-3 px-2 text-zinc-400">{p.category?.name || "—"}</td>
                        <td className="py-3 px-2">
                          {isVianda ? (
                            <div className="flex flex-col">
                              <span className="text-amber-500 font-bold font-mono">${p.price.toFixed(2)}</span>
                              <span className="text-[9px] text-zinc-500 leading-none mt-0.5">Fijo de cat.</span>
                            </div>
                          ) : (
                            <input
                              type="number"
                              value={currentPrice}
                              onChange={(e) => handleBulkChange(p.id, "price", parseFloat(e.target.value) || 0)}
                              className={`bg-zinc-950 border text-xs text-white p-2 rounded-lg w-28 text-center outline-none transition-all ${
                                isPriceChanged ? "border-amber-500 text-amber-400 font-bold" : "border-zinc-900 focus:border-zinc-800"
                              }`}
                            />
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="number"
                            value={currentStock}
                            onChange={(e) => handleBulkChange(p.id, "stock", parseInt(e.target.value) || 0)}
                            className={`bg-zinc-950 border text-xs text-white p-2 rounded-lg w-24 text-center outline-none transition-all ${
                              isStockChanged ? "border-amber-500 text-amber-400 font-bold" : "border-zinc-900 focus:border-zinc-800"
                            }`}
                          />
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleBulkChange(p.id, "isActive", !currentActive)}
                            className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase transition-all ${
                              currentActive 
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                : "bg-zinc-950 text-zinc-500 border border-zinc-900"
                            } ${isActiveChanged ? "ring-1 ring-amber-500" : ""}`}
                          >
                            {currentActive ? "Activo" : "Inactivo"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CATEGORY LIST MANAGEMENT SECTION */}
      <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-4 mt-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Gestionar Categorías</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Edita nombres y establece precios de categoría (heredados por los productos de tipo vianda).</p>
          </div>
          <PremiumButton variant="outline" size="sm" onClick={handleOpenCreateCategoryModal}>
            <Plus className="w-4 h-4 mr-1" /> Nueva Categoría
          </PremiumButton>
        </div>
        <div className="flex flex-col gap-3">
          {categories.map((cat) => {
            const isVianda = cat.type === "VIANDA";
            return (
              <div key={cat.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center border-b border-zinc-900/80 pb-3">
                <div className="flex-1">
                  <span className="text-xs font-bold text-white">{cat.name}</span>
                  <span className="text-[9px] ml-2 px-1.5 py-0.5 bg-zinc-950 text-zinc-400 border border-zinc-900 rounded font-semibold uppercase">{cat.type}</span>
                </div>
                <div className="flex items-center gap-4">
                  {isVianda && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Precio Categoría ($):</span>
                      <input 
                        type="number"
                        defaultValue={cat.price || 0}
                        onBlur={async (e) => {
                          const newPrice = parseFloat(e.target.value) || 0;
                          const res = await updateCategory(cat.id, {
                            name: cat.name,
                            slug: cat.slug,
                            type: cat.type,
                            price: newPrice
                          });
                          if (res.success) {
                            alert(`Precio de la categoría "${cat.name}" actualizado a $${newPrice}. Los productos asociados heredaron este precio.`);
                            onRefresh();
                          }
                        }}
                        className="bg-zinc-950 border border-zinc-900 focus:border-amber-500 text-xs text-white p-2 rounded-lg w-24 text-center outline-none transition-colors"
                      />
                    </div>
                  )}
                  <div className="flex gap-2.5">
                    <button 
                      onClick={() => handleOpenEditCategoryModal(cat)} 
                      className="p-1 text-zinc-400 hover:text-amber-500 transition-colors cursor-pointer"
                      title="Editar Categoría"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)} 
                      className="p-1 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Eliminar Categoría"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PRODUCT CREATION/EDIT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-900 w-full max-w-2xl rounded-3xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-black text-white">{editingProduct ? "Editar Producto" : "Nuevo Producto"}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Ingresa los detalles básicos y específicos del rubro del producto.</p>
            </div>

            <form onSubmit={handleSaveProduct} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Nombre del Producto</label>
                  <input 
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Categoría</label>
                  <select 
                    value={prodCategoryId}
                    onChange={(e) => setProdCategoryId(e.target.value)}
                    className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Precio ($)</label>
                  {hasType === "VIANDA" ? (
                    <div className="flex flex-col gap-1">
                      <input 
                        type="number"
                        disabled
                        value={categories.find(c => c.id === prodCategoryId)?.price || 0}
                        className="bg-zinc-950 border border-zinc-900 opacity-60 text-xs text-amber-500 p-3 rounded-xl cursor-not-allowed outline-none font-bold"
                      />
                      <span className="text-[9px] text-zinc-500 font-medium">Heredado de la categoría</span>
                    </div>
                  ) : (
                    <input 
                      type="number"
                      required
                      value={prodPrice}
                      onChange={(e) => setProdPrice(parseFloat(e.target.value) || 0)}
                      className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                    />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Stock Inicial</label>
                  <input 
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(parseInt(e.target.value) || 0)}
                    className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">URL de la Imagen</label>
                  <input 
                    type="text"
                    value={prodImageUrl}
                    onChange={(e) => setProdImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Descripción</label>
                <textarea 
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none resize-none h-16"
                />
              </div>

              {/* SPECIALIZED SPECIFIC FIELDS DEPENDING ON RUBRO TYPE */}
              {hasType === "ROPA" && (
                <div className="border-t border-zinc-900 pt-4 flex flex-col gap-3">
                  <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest">Variantes y Especificaciones de Ropa</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-zinc-400 text-[10px] font-bold">Talle</label>
                      <input type="text" value={prodSize} onChange={(e) => setProdSize(e.target.value)} placeholder="Ej. S, M, L, XL" className="bg-zinc-950 border border-zinc-900 text-xs text-white p-2.5 rounded-xl outline-none" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-zinc-400 text-[10px] font-bold">Color</label>
                      <input type="text" value={prodColor} onChange={(e) => setProdColor(e.target.value)} placeholder="Ej. Azul Marino" className="bg-zinc-950 border border-zinc-900 text-xs text-white p-2.5 rounded-xl outline-none" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-zinc-400 text-[10px] font-bold">Material / Tela</label>
                      <input type="text" value={prodMaterial} onChange={(e) => setProdMaterial(e.target.value)} placeholder="Ej. Algodón 100%" className="bg-zinc-950 border border-zinc-900 text-xs text-white p-2.5 rounded-xl outline-none" />
                    </div>
                  </div>

                  {/* Size Charts Reference dropdown/list */}
                  {sizeCharts.length > 0 && (
                    <div className="flex flex-col gap-1.5 mt-2 bg-zinc-950/40 p-3.5 border border-zinc-900 rounded-xl">
                      <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Tablas de Talles de Referencia Disponibles:</label>
                      <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                        {sizeCharts.map((chart) => (
                          <div key={chart.id} className="text-[11px] text-zinc-400 flex items-center justify-between border-b border-zinc-900/60 pb-1">
                            <span>{chart.brandName} - {chart.clothingTypeName}</span>
                            <span className="text-[9px] text-zinc-500 italic font-medium">Columnas: {chart.columns.join(", ")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {hasType === "VIANDA" && (
                <div className="border-t border-zinc-900 pt-4 flex flex-col gap-3">
                  <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest">Información Nutricional (Viandas)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-zinc-400 text-[10px] font-bold">Calorías (kcal)</label>
                      <input type="number" value={prodCalories} onChange={(e) => setProdCalories(parseInt(e.target.value) || 0)} className="bg-zinc-950 border border-zinc-900 text-xs text-white p-2.5 rounded-xl outline-none" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-zinc-400 text-[10px] font-bold">Ingredientes</label>
                      <input type="text" value={prodIngredients} onChange={(e) => setProdIngredients(e.target.value)} placeholder="Pollo, arroz, calabaza" className="bg-zinc-950 border border-zinc-900 text-xs text-white p-2.5 rounded-xl outline-none" />
                    </div>
                  </div>
                  <div className="flex gap-6 mt-1.5 text-xs">
                    <label className="flex items-center gap-2 text-zinc-300">
                      <input type="checkbox" checked={prodIsVegan} onChange={(e) => setProdIsVegan(e.target.checked)} className="accent-amber-500" /> Apto Vegano
                    </label>
                    <label className="flex items-center gap-2 text-zinc-300">
                      <input type="checkbox" checked={prodIsGlutenFree} onChange={(e) => setProdIsGlutenFree(e.target.checked)} className="accent-amber-500" /> Sin TACC / Gluten-Free
                    </label>
                  </div>
                </div>
              )}

              {hasType === "PASTELERIA" && (
                <div className="border-t border-zinc-900 pt-4 flex flex-col gap-3">
                  <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest">Detalle de Pastelería</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-zinc-400 text-[10px] font-bold">Nivel de Dulzor</label>
                      <select value={prodSweetness} onChange={(e) => setProdSweetness(e.target.value)} className="bg-zinc-950 border border-zinc-900 text-xs text-white p-2.5 rounded-xl outline-none">
                        <option value="">Seleccionar...</option>
                        <option value="Bajo">Bajo</option>
                        <option value="Medio">Medio</option>
                        <option value="Alto">Alto</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-zinc-400 text-[10px] font-bold">Porciones / Cortes</label>
                      <input type="number" value={prodPortions} onChange={(e) => setProdPortions(parseInt(e.target.value) || 1)} className="bg-zinc-950 border border-zinc-900 text-xs text-white p-2.5 rounded-xl outline-none" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end border-t border-zinc-900 pt-4 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowProductModal(false)}
                  className="bg-zinc-950 border border-zinc-900 text-xs text-zinc-400 hover:text-white px-4 py-2.5 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <PremiumButton type="submit" variant="primary" size="sm">
                  {editingProduct ? "Guardar Cambios" : "Crear Producto"}
                </PremiumButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY CREATION/EDIT MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-900 w-full max-w-md rounded-3xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-black text-white">{editingCategory ? "Editar Categoría" : "Nueva Categoría"}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Ingresa los detalles básicos para agrupar tus productos.</p>
            </div>

            {categoryError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl">
                {categoryError}
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Nombre de la Categoría</label>
                <input 
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {hasType === "VIANDA" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Precio de Viandas en esta Categoría ($)</label>
                  <input 
                    type="number"
                    required
                    value={catPrice}
                    onChange={(e) => setCatPrice(parseFloat(e.target.value) || 0)}
                    className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none focus:border-amber-500 transition-colors font-bold text-amber-500"
                  />
                  <p className="text-[10px] text-zinc-500">Todas las viandas asignadas a esta categoría tomarán este precio automáticamente.</p>
                </div>
              )}

              <div className="flex gap-3 justify-end border-t border-zinc-900 pt-4 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCategoryModal(false)}
                  className="bg-zinc-950 border border-zinc-900 text-xs text-zinc-400 hover:text-white px-4 py-2.5 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <PremiumButton type="submit" variant="primary" size="sm">
                  {editingCategory ? "Guardar Cambios" : "Crear Categoría"}
                </PremiumButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
