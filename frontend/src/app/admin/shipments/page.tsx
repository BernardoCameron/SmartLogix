"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShipmentsService } from "@/services/shipments.service"

type Shipment = {
  trackingCode: string
  orderNumber: string
  carrier: string
  routeCode: string
  destinationAddress: string
  totalUnits: number
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

// siguiente estado logico de cada uno
const NEXT_STATUS: Record<string, { label: string; value: string } | null> = {
  PLANNED: { label: "Marcar como recogido", value: "PICKED_UP" },
  PICKED_UP: { label: "Marcar en transito", value: "IN_TRANSIT" },
  IN_TRANSIT: { label: "Marcar como entregado", value: "DELIVERED" },
  DELIVERED: null,
}

export default function AdminShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const load = async () => {
    try {
      const data = await ShipmentsService.getAllShipments()
      setShipments(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleStatus = async (trackingCode: string, status: string) => {
    setUpdating(trackingCode)
    try {
      await ShipmentsService.updateStatus(trackingCode, status)
      await load()
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(null)
    }
  }

  const stats = {
    total: shipments.length,
    planned: shipments.filter((s) => s.status === "PLANNED").length,
    inTransit: shipments.filter((s) => s.status === "IN_TRANSIT").length,
    delivered: shipments.filter((s) => s.status === "DELIVERED").length,
  }

  return (
    <main className="container mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Gestion de Envios</h1>

      {/* resumen rapido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total },
          { label: "Planificados", value: stats.planned },
          { label: "En transito", value: stats.inTransit },
          { label: "Entregados", value: stats.delivered },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* tabla de envios */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Todos los envios</CardTitle>
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
                  <TableHead>Unidades</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((s) => {
                  const next = NEXT_STATUS[s.status]
                  return (
                    <TableRow key={s.trackingCode}>
                      <TableCell className="font-mono text-xs">{s.trackingCode}</TableCell>
                      <TableCell className="text-xs">{s.orderNumber}</TableCell>
                      <TableCell>{s.carrier} ({s.routeCode})</TableCell>
                      <TableCell>{s.totalUnits}</TableCell>
                      <TableCell>
                        <Badge variant={s.status === "DELIVERED" ? "default" : "secondary"}>
                          {STATUS_LABEL[s.status] ?? s.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {next ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updating === s.trackingCode}
                            onClick={() => handleStatus(s.trackingCode, next.value)}
                          >
                            {updating === s.trackingCode ? "..." : next.label}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Completado</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {shipments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
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
