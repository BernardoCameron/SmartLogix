"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ShipmentsService } from "@/services/shipments.service"

type Shipment = {
  trackingCode: string
  orderNumber: string
  carrier: string
  routeCode: string
  destinationAddress: string
  estimatedDeliveryDate: string
  status: string
  createdAt: string
}

const STATUS_LABEL: Record<string, string> = {
  PLANNED: "Planificado",
  PICKED_UP: "Recogido",
  IN_TRANSIT: "En transito",
  DELIVERED: "Entregado",
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ShipmentsService.getAllShipments()
      .then((data) => setShipments(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-foreground mb-6">Mis Envios</h1>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Historial de envios</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Transportista</TableHead>
                  <TableHead>Entrega estimada</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((s) => (
                  <TableRow key={s.trackingCode}>
                    <TableCell className="font-mono text-xs">{s.trackingCode}</TableCell>
                    <TableCell className="text-xs">{s.orderNumber}</TableCell>
                    <TableCell>{s.carrier} ({s.routeCode})</TableCell>
                    <TableCell>{s.estimatedDeliveryDate ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "DELIVERED" ? "default" : "secondary"}>
                        {STATUS_LABEL[s.status] ?? s.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {shipments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No hay envios registrados.
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
