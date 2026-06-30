"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InventoryService } from "@/services/inventory.service";

type Product = {
  sku: string;
  productName: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
  availableQuantity: number;
  averageRating: number;
  ratingCount: number;
};

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    InventoryService.getCatalog()
      .then((data) => {
        setProducts(data);
        setFiltered(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // filtrar por busqueda y categoria
  useEffect(() => {
    let result = products;
    if (search) {
      result = result.filter((p) =>
        p.productName.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (categoryFilter !== "Todos") {
      result = result.filter((p) => p.category === categoryFilter);
    }
    setFiltered(result);
  }, [search, categoryFilter, products]);

  const categories = ["Todos", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  const renderStars = (avg: number) => {
    const full = Math.round(avg);
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < full ? "text-yellow-400" : "text-muted-foreground/30"}>
        &#9733;
      </span>
    ));
  };

  if (loading) {
    return (
      <main className="container mx-auto py-10 px-4">
        <p className="text-muted-foreground">Cargando productos...</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-1">Catalogo</h1>
        <p className="text-muted-foreground text-sm">{filtered.length} productos disponibles</p>
      </div>

      {/* filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Input
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">No se encontraron productos.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <Card key={product.sku} className="flex flex-col overflow-hidden">
              {/* imagen */}
              <div className="bg-muted h-44 flex items-center justify-center overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.productName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground text-sm">Sin imagen</span>
                )}
              </div>

              <CardContent className="pt-4 flex-1 space-y-2">
                {product.category && (
                  <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                )}
                <h3 className="font-medium text-sm text-foreground leading-tight">
                  {product.productName}
                </h3>
                {product.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                )}
                <div className="flex items-center gap-1 text-sm">
                  {renderStars(product.averageRating)}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({product.ratingCount})
                  </span>
                </div>
                <p className="text-foreground font-semibold text-sm">
                  ${Number(product.price).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Stock: {product.availableQuantity} unidades
                </p>
              </CardContent>

              <CardFooter className="pt-0 pb-4">
                <Button
                  className="w-full"
                  size="sm"
                  disabled={product.availableQuantity === 0}
                  onClick={() => {
                    // se conectara con el carrito en la siguiente tarea
                    alert(`Agregando ${product.productName} al carrito (pendiente)`);
                  }}
                >
                  {product.availableQuantity === 0 ? "Sin stock" : "Agregar al carrito"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
