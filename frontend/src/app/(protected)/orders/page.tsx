"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { OrdersService } from "@/services/orders.service"

type OrderSummary = {
  orderNumber: string
  status: string
  totalAmount: number
  trackingCode: string | null
  createdAt: string
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  SHIPMENT_REQUESTED: "En despacho",
  FAILED: "Fallido",
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  SHIPMENT_REQUESTED: "outline",
  FAILED: "destructive",
}

const clp = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    OrdersService.getAllOrders()
      .then((data) => {
        // Sobrescribir montos con descuentos locales si existen
        const localDiscountsRaw = localStorage.getItem("smartlogix_order_discounts");
        if (localDiscountsRaw && data) {
          const localDiscounts = JSON.parse(localDiscountsRaw);
          const mapped = data.map((o: any) => {
            const saved = localDiscounts[o.orderNumber];
            return saved ? { ...o, totalAmount: saved.totalAmount } : o;
          });
          setOrders(mapped);
        } else {
          setOrders(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Mis Pedidos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Aqui puedes ver el estado de todos tus pedidos.
        </p>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <p className="text-muted-foreground text-sm py-4">Cargando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Pedido</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead className="text-right">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.orderNumber}>
                    <TableCell className="font-mono text-xs">{order.orderNumber}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(order.createdAt).toLocaleDateString("es-CL")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {clp(order.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[order.status] ?? "secondary"}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {order.trackingCode ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/orders/${order.orderNumber}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Ver detalle
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Aun no tienes pedidos. Ve al catalogo para comprar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
