"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OrdersService } from "@/services/orders.service"
import { InventoryService } from "@/services/inventory.service"
import { ShipmentsService } from "@/services/shipments.service"

type Order = {
  orderNumber: string
  customerName: string
  totalAmount: number
  status: string
  createdAt: string
  lines: { sku: string; quantity: number; unitPrice: number }[]
}

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

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [shipments, setShipments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"ventas" | "productos">("ventas")

  useEffect(() => {
    Promise.all([
      OrdersService.getAllOrders(),
      InventoryService.getAllItems(),
      ShipmentsService.getAllShipments(),
    ])
      .then(([o, p, s]) => {
        setOrders(o)
        setProducts(p)
        setShipments(s)
      })
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

  // metricas de ventas
  const totalVentas = orders
    .filter((o) => o.status !== "REJECTED" && o.status !== "FAILED")
    .reduce((sum, o) => sum + o.totalAmount, 0)

  const ordenesPorEstado = {
    PENDING: orders.filter((o) => o.status === "PENDING").length,
    APPROVED: orders.filter((o) => o.status === "APPROVED").length,
    SHIPMENT_REQUESTED: orders.filter((o) => o.status === "SHIPMENT_REQUESTED").length,
    REJECTED: orders.filter((o) => o.status === "REJECTED").length,
  }

  // productos mas vendidos por lineas de orden
  const skuCount: Record<string, { name: string; qty: number; revenue: number }> = {}
  orders
    .filter((o) => o.status !== "REJECTED" && o.status !== "FAILED")
    .forEach((o) => {
      o.lines?.forEach((line) => {
        if (!skuCount[line.sku]) {
          const prod = products.find((p) => p.sku === line.sku)
          skuCount[line.sku] = { name: prod?.productName ?? line.sku, qty: 0, revenue: 0 }
        }
        skuCount[line.sku].qty += line.quantity
        skuCount[line.sku].revenue += line.quantity * line.unitPrice
      })
    })

  const topProductos = Object.entries(skuCount)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5)

  // clientes con mas compras
  const clienteCount: Record<string, { qty: number; total: number }> = {}
  orders.forEach((o) => {
    if (!clienteCount[o.customerName]) clienteCount[o.customerName] = { qty: 0, total: 0 }
    clienteCount[o.customerName].qty += 1
    clienteCount[o.customerName].total += o.totalAmount
  })
  const topClientes = Object.entries(clienteCount)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5)

  // metricas de productos
  const active = products.filter((p) => p.active)
  const lowStock = products.filter((p) => p.availableQuantity <= p.reorderLevel && p.active)
  const topRated = [...active]
    .filter((p) => p.ratingCount > 0)
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 5)

  const tabClass = (t: string) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      tab === t
        ? "border-foreground text-foreground"
        : "border-transparent text-muted-foreground hover:text-foreground"
    }`

  return (
    <main className="container mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Dashboard Administrador</h1>

      {/* tabs */}
      <div className="flex border-b">
        <button className={tabClass("ventas")} onClick={() => setTab("ventas")}>
          Ventas
        </button>
        <button className={tabClass("productos")} onClick={() => setTab("productos")}>
          Productos
        </button>
      </div>

      {/* panel de ventas */}
      {tab === "ventas" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total ingresos", value: `$${totalVentas.toFixed(2)}` },
              { label: "Total ordenes", value: orders.length },
              { label: "Pendientes", value: ordenesPorEstado.PENDING },
              { label: "Rechazadas", value: ordenesPorEstado.REJECTED },
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
            {/* productos mas vendidos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Productos mas vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                {topProductos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin datos de ventas.</p>
                ) : (
                  <div className="space-y-2">
                    {topProductos.map(([sku, data]) => (
                      <div key={sku} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div>
                          <p className="text-sm font-medium">{data.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{data.qty} uds</p>
                          <p className="text-xs text-muted-foreground">${data.revenue.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* mejores clientes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Clientes con mas compras</CardTitle>
              </CardHeader>
              <CardContent>
                {topClientes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin datos.</p>
                ) : (
                  <div className="space-y-2">
                    {topClientes.map(([name, data]) => (
                      <div key={name} className="flex justify-between items-center py-2 border-b last:border-0">
                        <p className="text-sm font-medium">{name}</p>
                        <div className="text-right">
                          <p className="text-sm font-semibold">${data.total.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{data.qty} ordenes</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ordenes recientes */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Ordenes recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {orders.slice(0, 8).map((o) => (
                    <div key={o.orderNumber} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="text-xs font-mono text-muted-foreground">{o.orderNumber}</p>
                        <p className="text-sm">{o.customerName}</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <Badge variant="secondary">{o.status}</Badge>
                        <p className="text-sm font-semibold">${o.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* panel de productos */}
      {tab === "productos" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total productos", value: products.length },
              { label: "Activos", value: active.length },
              { label: "Stock bajo", value: lowStock.length },
              { label: "Envios activos", value: shipments.filter((s) => s.status !== "DELIVERED").length },
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
            {/* mejor valorados */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Mejor valorados</CardTitle>
              </CardHeader>
              <CardContent>
                {topRated.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin calificaciones aun.</p>
                ) : (
                  <div className="space-y-2">
                    {topRated.map((p) => (
                      <div key={p.sku} className="flex justify-between items-center py-2 border-b last:border-0">
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

            {/* stock bajo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Productos con stock bajo</CardTitle>
              </CardHeader>
              <CardContent>
                {lowStock.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Stock en niveles normales.</p>
                ) : (
                  <div className="space-y-2">
                    {lowStock.map((p) => (
                      <div key={p.sku} className="flex justify-between items-center py-2 border-b last:border-0">
                        <p className="text-sm font-medium">{p.productName}</p>
                        <Badge variant={p.availableQuantity === 0 ? "destructive" : "secondary"}>
                          {p.availableQuantity} uds
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </main>
  )
}
