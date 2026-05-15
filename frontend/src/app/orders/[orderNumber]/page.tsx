"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"

type OrderLineResponse = {
  sku: string
  quantity: number
  unitPrice: number
  subtotal: number
}

type OrderResponse = {
  orderNumber: string
  status: string
  totalAmount: number
  trackingCode: string | null
  createdAt: string
  lines: OrderLineResponse[]
}

export default function OrderDetailsPage() {
  const { orderNumber } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<OrderResponse | null>(null)

  useEffect(() => {
    fetchOrder()
  }, [orderNumber])

  const fetchOrder = () => {
    fetch(`http://localhost:8080/api/orders/${orderNumber}`)
      .then((res) => res.json())
      .then((data) => setOrder(data))
      .catch((err) => console.error(err))
  }

  const handleUpdateStatus = async (status: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/orders/${orderNumber}/status?value=${status}`, {
        method: "PATCH"
      })
      if (res.ok) {
        fetchOrder()
      }
    } catch (err) {
      console.error("Error al actualizar", err)
    }
  }

  if (!order) return <div className="p-10 text-center">Cargando...</div>

  return (
    <main className="container mx-auto py-10 px-4 max-w-4xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Detalle de Pedido: {order.orderNumber}</CardTitle>
          <div className="space-x-2">
            <Link href="/orders">
              <Button variant="outline">Volver</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Estado</p>
              <Badge className="mt-1" variant={order.status === 'PENDING' ? 'secondary' : order.status === 'APPROVED' ? 'default' : 'outline'}>
                {order.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fecha de Creación</p>
              <p className="font-medium">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="font-medium text-lg">${order.totalAmount.toFixed(2)}</p>
            </div>
            {order.trackingCode && (
              <div>
                <p className="text-sm text-gray-500">Tracking Code (Si aplica)</p>
                <p className="font-medium">{order.trackingCode}</p>
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
            <p className="font-medium">Acciones de Operación</p>
            <div className="space-x-2">
              {order.status === "PENDING" && (
                <Button onClick={() => handleUpdateStatus("APPROVED")} variant="default">
                  Marcar como listo
                </Button>
              )}
              {order.status === "APPROVED" && (
                <Button onClick={() => handleUpdateStatus("SHIPMENT_REQUESTED")} variant="destructive">
                  Realizar envío a Despacho
                </Button>
              )}
              {order.status === "SHIPMENT_REQUESTED" && (
                <p className="text-sm text-green-600 font-medium">Envío en proceso...</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Líneas de Pedido</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio Unitario</TableHead>
                  <TableHead>Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.lines.map((line, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{line.sku}</TableCell>
                    <TableCell>{line.quantity}</TableCell>
                    <TableCell>${line.unitPrice.toFixed(2)}</TableCell>
                    <TableCell>${line.subtotal.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
