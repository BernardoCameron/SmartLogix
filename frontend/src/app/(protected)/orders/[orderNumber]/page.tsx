"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { OrdersService } from "@/services/orders.service"
import { AuthService } from "@/services/auth.service"
import { InventoryService } from "@/services/inventory.service"
import { StarRating } from "@/components/StarRating"

const RATED_KEY = "smartlogix_rated"

function getRatedSkus(): Record<string, number> {
  try {
    const raw = localStorage.getItem(RATED_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveRating(sku: string, value: number) {
  const current = getRatedSkus()
  current[sku] = value
  localStorage.setItem(RATED_KEY, JSON.stringify(current))
}

const clp = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

type OrderLine = {
  sku: string
  quantity: number
  unitPrice: number
  lineAmount: number
}

type Order = {
  orderNumber: string
  customerName: string
  customerEmail: string
  shippingAddress: string
  status: string
  totalAmount: number
  couponCode: string | null
  discountAmount: number | null
  trackingCode: string | null
  createdAt: string
  lines: OrderLine[]
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  SHIPMENT_REQUESTED: "En despacho",
  FAILED: "Fallido",
}

export default function OrderDetailPage() {
  const { orderNumber } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [ratedSkus, setRatedSkus] = useState<Record<string, number>>({})
  const [lineRatings, setLineRatings] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState<string | null>(null)
  const isAdminOrWarehouse = AuthService.isAdminOrWarehouse()

  const fetchOrder = async () => {
    if (!orderNumber) return
    try {
      const data = await OrdersService.getOrderById(orderNumber as string)
      
      // Aplicar descuento local si existe en localStorage
      const localDiscountsRaw = localStorage.getItem("smartlogix_order_discounts");
      if (localDiscountsRaw) {
        const localDiscounts = JSON.parse(localDiscountsRaw);
        const savedDiscount = localDiscounts[orderNumber as string];
        if (savedDiscount) {
          data.couponCode = savedDiscount.couponCode;
          data.discountAmount = savedDiscount.discountAmount;
          data.totalAmount = savedDiscount.totalAmount;
        }
      }
      
      setOrder(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    setRatedSkus(getRatedSkus())
    fetchOrder()
  }, [orderNumber])

  const handleStatus = async (status: string) => {
    try {
      await OrdersService.updateOrderStatus(orderNumber as string, status)
      fetchOrder()
    } catch (err) { console.error(err) }
  }

  const handleRating = async (sku: string) => {
    const value = lineRatings[sku]
    if (!value) return
    setSubmitting(sku)
    try {
      await InventoryService.addRating(sku, value)
      saveRating(sku, value)
      setRatedSkus(getRatedSkus())
    } catch (e) { console.error(e) }
    finally { setSubmitting(null) }
  }

  if (!order) {
    return <div className="container mx-auto py-10 px-4 text-muted-foreground text-sm">Cargando...</div>
  }

  return (
    <main className="container mx-auto py-8 px-4 max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Pedido {order.orderNumber}</h1>
        <Link href="/orders">
          <Button variant="outline" size="sm">Volver</Button>
        </Link>
      </div>

      {/* datos del pedido */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Informacion del pedido</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-1">Estado</p>
            <Badge variant={order.status === "APPROVED" ? "default" : order.status === "REJECTED" ? "destructive" : "secondary"}>
              {STATUS_LABEL[order.status] ?? order.status}
            </Badge>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Fecha</p>
            <p>{new Date(order.createdAt).toLocaleString("es-CL")}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Cliente</p>
            <p>{order.customerName}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Email</p>
            <p>{order.customerEmail}</p>
          </div>
          <div className="col-span-2 space-y-2">
            <p className="text-muted-foreground text-xs mb-1">Direccion de envio</p>
            <p className="font-medium">{order.shippingAddress}</p>
            <div className="rounded-md overflow-hidden border border-zinc-200 shadow-sm h-48 bg-zinc-100 mt-2">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(order.shippingAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              />
            </div>
          </div>
          {order.trackingCode && (
            <div>
              <p className="text-muted-foreground text-xs mb-1">Codigo de seguimiento</p>
              <p className="font-mono text-xs">{order.trackingCode}</p>
            </div>
          )}
          {order.couponCode && (
            <div>
              <p className="text-muted-foreground text-xs mb-1">Cupon aplicado</p>
              <p className="font-mono text-xs">{order.couponCode} (-{clp(order.discountAmount ?? 0)})</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground text-xs mb-1">Total</p>
            <p className="font-semibold text-base">{clp(order.totalAmount)}</p>
          </div>
        </CardContent>
      </Card>

      {/* acciones: SOLO admin y bodega */}
      {isAdminOrWarehouse && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Acciones de operacion</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            {order.status === "PENDING" && (
              <Button size="sm" onClick={() => handleStatus("APPROVED")}>
                Aprobar pedido
              </Button>
            )}
            {order.status === "APPROVED" && (
              <Button size="sm" variant="outline" onClick={() => handleStatus("SHIPMENT_REQUESTED")}>
                Enviar a despacho
              </Button>
            )}
            {order.status === "SHIPMENT_REQUESTED" && (
              <p className="text-sm text-muted-foreground">Pedido en proceso de despacho.</p>
            )}
            {(order.status === "REJECTED" || order.status === "FAILED") && (
              <p className="text-sm text-destructive">Este pedido fue {STATUS_LABEL[order.status]?.toLowerCase()}.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* lineas del pedido */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Precio unit.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.lines.map((line, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-xs">{line.sku}</TableCell>
                  <TableCell>{line.quantity}</TableCell>
                  <TableCell>{clp(line.unitPrice)}</TableCell>
                  <TableCell className="text-right">{clp(line.lineAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end mt-3 border-t pt-3">
            <p className="text-sm font-semibold">Total: {clp(order.totalAmount)}</p>
          </div>
        </CardContent>
      </Card>

      {/* calificar productos: solo cuando el pedido esta en despacho */}
      {order.status === "SHIPMENT_REQUESTED" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Califica los productos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.lines.map((line) => {
              const rated = ratedSkus[line.sku]
              return (
                <div key={line.sku} className="flex items-center justify-between py-2 border-b last:border-0">
                  <p className="text-sm font-mono text-muted-foreground">{line.sku}</p>
                  {rated ? (
                    <div className="flex items-center gap-2">
                      <StarRating value={rated} readonly size="sm" />
                      <span className="text-xs text-muted-foreground">Ya calificado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <StarRating
                        value={lineRatings[line.sku] ?? 0}
                        size="sm"
                        onChange={(val) =>
                          setLineRatings((prev) => ({ ...prev, [line.sku]: val }))
                        }
                      />
                      <Button
                        size="sm" variant="outline"
                        disabled={!lineRatings[line.sku] || submitting === line.sku}
                        onClick={() => handleRating(line.sku)}
                      >
                        {submitting === line.sku ? "..." : "Enviar"}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </main>
  )
}
