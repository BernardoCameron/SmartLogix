"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"

type OrderResponse = {
  orderNumber: string
  status: string
  totalAmount: number
  trackingCode: string | null
  createdAt: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([])

  const fetchOrders = () => {
    fetch("http://localhost:8080/api/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data))
      .catch((err) => console.error(err))
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleUpdateStatus = async (orderNumber: string, status: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/orders/${orderNumber}/status?value=${status}`, {
        method: "PATCH"
      })
      if (res.ok) {
        fetchOrders()
      }
    } catch (err) {
      console.error("Error al actualizar", err)
    }
  }

  return (
    <main className="container mx-auto py-10 px-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mis Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Pedido</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.orderNumber}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === 'PENDING' ? 'secondary' : order.status === 'APPROVED' ? 'default' : 'outline'}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.trackingCode || "-"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {order.status === "PENDING" && (
                      <Button onClick={() => handleUpdateStatus(order.orderNumber, "APPROVED")} variant="default" size="sm">
                        Marcar Listo
                      </Button>
                    )}
                    {order.status === "APPROVED" && (
                      <Button onClick={() => handleUpdateStatus(order.orderNumber, "SHIPMENT_REQUESTED")} variant="destructive" size="sm">
                        Enviar
                      </Button>
                    )}
                    {order.status === "SHIPMENT_REQUESTED" && (
                      <span className="text-xs text-green-600 font-medium mr-2 bg-green-50 px-2 py-1 rounded">En proceso</span>
                    )}
                    <Link href={`/orders/${order.orderNumber}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      Detalle
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No hay pedidos registrados.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
