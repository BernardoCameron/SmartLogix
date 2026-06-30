"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { InventoryService } from "@/services/inventory.service"

type Product = {
  sku: string
  productName: string
  category: string
  price: number
  availableQuantity: number
  reservedQuantity: number
  reorderLevel: number
  averageRating: number
  ratingCount: number
  active: boolean
}

export default function WarehouseDashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    InventoryService.getAllItems()
      .then((data) => setProducts(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <main className="container mx-auto py-10 px-4">
        <p className="text-muted-foreground text-sm">Cargando dashboard...</p>
      </main>
    )
  }

  const active = products.filter((p) => p.active)
  const inactive = products.filter((p) => !p.active)
  const lowStock = products.filter((p) => p.availableQuantity <= p.reorderLevel && p.active)
  const outOfStock = products.filter((p) => p.availableQuantity === 0 && p.active)

  // top 5 mejor valorados
  const topRated = [...active]
    .filter((p) => p.ratingCount > 0)
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 5)

  // top 5 con mas unidades reservadas (mas pedidos en proceso)
  const mostOrdered = [...active]
    .sort((a, b) => b.reservedQuantity - a.reservedQuantity)
    .slice(0, 5)

  return (
    <main className="container mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Dashboard de Bodega</h1>

      {/* metricas generales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total productos", value: products.length },
          { label: "Activos", value: active.length },
          { label: "Stock bajo", value: lowStock.length },
          { label: "Sin stock", value: outOfStock.length },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* productos con stock bajo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Productos con stock bajo</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todos los productos tienen stock suficiente.</p>
            ) : (
              <div className="space-y-2">
                {lowStock.map((p) => (
                  <div key={p.sku} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{p.productName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={p.availableQuantity === 0 ? "destructive" : "secondary"}>
                        {p.availableQuantity === 0 ? "Sin stock" : `${p.availableQuantity} uds`}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">min: {p.reorderLevel}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* mejor valorados */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Mejor valorados</CardTitle>
          </CardHeader>
          <CardContent>
            {topRated.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aun no hay calificaciones.</p>
            ) : (
              <div className="space-y-2">
                {topRated.map((p) => (
                  <div key={p.sku} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{p.productName}</p>
                      <p className="text-xs text-muted-foreground">{p.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{p.averageRating.toFixed(1)} / 5</p>
                      <p className="text-xs text-muted-foreground">{p.ratingCount} resenas</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* mas pedidos en proceso */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Mas pedidos activos (reserva)</CardTitle>
          </CardHeader>
          <CardContent>
            {mostOrdered.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin pedidos activos.</p>
            ) : (
              <div className="space-y-2">
                {mostOrdered.map((p) => (
                  <div key={p.sku} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{p.productName}</p>
                      <p className="text-xs font-mono text-muted-foreground">{p.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{p.reservedQuantity} reservadas</p>
                      <p className="text-xs text-muted-foreground">{p.availableQuantity} disponibles</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* productos inactivos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Productos desactivados</CardTitle>
          </CardHeader>
          <CardContent>
            {inactive.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay productos desactivados.</p>
            ) : (
              <div className="space-y-2">
                {inactive.map((p) => (
                  <div key={p.sku} className="flex items-center justify-between py-2 border-b last:border-0">
                    <p className="text-sm">{p.productName}</p>
                    <Badge variant="outline">Inactivo</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
