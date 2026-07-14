"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InventoryService } from "@/services/inventory.service";
import { CartService } from "@/services/cart.service";
import { StarRating } from "@/components/StarRating";

const RATED_KEY = "smartlogix_rated";

function getRatedSkus(): Record<string, number> {
  try {
    const raw = localStorage.getItem(RATED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveRating(sku: string, value: number) {
  const current = getRatedSkus();
  current[sku] = value;
  localStorage.setItem(RATED_KEY, JSON.stringify(current));
}

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
  const [added, setAdded] = useState<string | null>(null);

  // modal de calificacion
  const [ratingModal, setRatingModal] = useState<Product | null>(null);
  const [pendingRating, setPendingRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratedSkus, setRatedSkus] = useState<Record<string, number>>({});

  useEffect(() => {
    setRatedSkus(getRatedSkus());
    setLoading(true);

    const fetchFallback = () => {
      InventoryService.getAllItems()
        .then((data) => {
          // Asignar datos por defecto a productos antiguos para que se vean bien
          const repairedData = data.map((p: any) => ({
            ...p,
            price: p.price ?? 129990,
            category: p.category || "Hardware",
            description: p.description || "Sin descripción disponible.",
            imageUrl: p.imageUrl || "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&q=80"
          }));
          setProducts(repairedData);
          setFiltered(repairedData);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    InventoryService.getCatalog()
      .then((data) => {
        if (data && data.length > 0) {
          setProducts(data);
          setFiltered(data);
          setLoading(false);
        } else {
          fetchFallback();
        }
      })
      .catch((err) => {
        console.warn("Fallo getCatalog, usando fallback completo:", err);
        fetchFallback();
      });
  }, []);

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

  const categories = [
    "Todos",
    ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
  ];

  const handleAddToCart = (product: Product) => {
    CartService.addItem({
      sku: product.sku,
      productName: product.productName,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    setAdded(product.sku);
    setTimeout(() => setAdded(null), 1500);
  };

  const openRating = (product: Product) => {
    setPendingRating(ratedSkus[product.sku] ?? 0);
    setRatingModal(product);
  };

  const submitRating = async () => {
    if (!ratingModal || pendingRating === 0) return;
    setSubmittingRating(true);
    try {
      await InventoryService.addRating(ratingModal.sku, pendingRating);
      saveRating(ratingModal.sku, pendingRating);
      setRatedSkus(getRatedSkus());
      // actualizar el promedio localmente para no recargar todo
      setProducts((prev) =>
        prev.map((p) =>
          p.sku === ratingModal.sku
            ? {
                ...p,
                averageRating:
                  (p.averageRating * p.ratingCount + pendingRating) /
                  (p.ratingCount + 1),
                ratingCount: p.ratingCount + 1,
              }
            : p
        )
      );
      setRatingModal(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto py-10 px-4">
        <p className="text-muted-foreground text-sm">Cargando productos...</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-1">Catalogo</h1>
        <p className="text-muted-foreground text-sm">
          {filtered.length} productos disponibles
        </p>
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

      {/* grid de productos */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">No se encontraron productos.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product) => {
            const myRating = ratedSkus[product.sku];
            return (
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
                    <Badge variant="secondary" className="text-xs">
                      {product.category}
                    </Badge>
                  )}
                  <h3 className="font-medium text-sm text-foreground leading-tight">
                    {product.productName}
                  </h3>
                  {product.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* estrellas promedio */}
                  <div className="flex items-center gap-1">
                    <StarRating
                      value={Math.round(product.averageRating)}
                      readonly
                      size="sm"
                    />
                    <span className="text-xs text-muted-foreground">
                      ({product.ratingCount})
                    </span>
                  </div>

                  <p className="text-foreground font-semibold text-sm">
                    {(() => {
                      const localPrices = JSON.parse(localStorage.getItem("smartlogix_local_prices") || "{}");
                      const realPrice = product.price || localPrices[product.sku] || 129990;
                      return Number(realPrice).toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
                    })()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Stock: {product.availableQuantity} unidades
                  </p>
                </CardContent>

                <CardFooter className="pt-0 pb-4">
                  <Button
                    className="w-full"
                    size="sm"
                    variant={added === product.sku ? "secondary" : "default"}
                    disabled={product.availableQuantity === 0}
                    onClick={() => handleAddToCart(product)}
                  >
                    {product.availableQuantity === 0
                      ? "Sin stock"
                      : added === product.sku
                      ? "Agregado"
                      : "Agregar al carrito"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* modal de calificacion */}
      {ratingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border rounded-xl shadow-lg p-6 w-full max-w-sm space-y-4">
            <h2 className="text-base font-semibold text-foreground">
              Calificar producto
            </h2>
            <p className="text-sm text-muted-foreground">{ratingModal.productName}</p>

            <div className="flex justify-center py-2">
              <StarRating
                value={pendingRating}
                onChange={setPendingRating}
                size="md"
              />
            </div>

            {pendingRating > 0 && (
              <p className="text-center text-xs text-muted-foreground">
                {["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"][pendingRating]}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setRatingModal(null)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                disabled={pendingRating === 0 || submittingRating}
                onClick={submitRating}
              >
                {submittingRating ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
