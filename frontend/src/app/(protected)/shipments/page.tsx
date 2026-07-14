"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ShipmentsService } from "@/services/shipments.service"

import { AuthService } from "@/services/auth.service"
import { OrdersService } from "@/services/orders.service"

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
  IN_TRANSIT: "En tránsito",
  DELIVERED: "Entregado",
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)

  useEffect(() => {
    const loadShipments = async () => {
      try {
        const isAdminOrWarehouse = AuthService.isAdminOrWarehouse();
        let allShipments = await ShipmentsService.getAllShipments();
        
        if (!isAdminOrWarehouse) {
          // Obtener los pedidos del cliente logueado
          const userEmail = AuthService.getUsername()?.toLowerCase();
          const allOrders = await OrdersService.getAllOrders().catch(() => []);
          const clientOrders = allOrders.filter((o: any) => o.customerEmail?.toLowerCase() === userEmail);
          const clientOrderNumbers = new Set(clientOrders.map((o: any) => o.orderNumber));
          
          // Filtrar envíos por las órdenes del cliente
          allShipments = allShipments.filter(s => clientOrderNumbers.has(s.orderNumber));
        }

        setShipments(allShipments);
        if (allShipments.length > 0) {
          setSelectedShipment(allShipments[0]);
        }
      } catch (e) {
        console.error("Error al cargar envíos:", e);
      } finally {
        setLoading(false);
      }
    };
    loadShipments();
  }, [])

  return (
    <main className="container mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Mis Envíos</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla de envíos */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Historial de envíos</CardTitle>
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
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map((s) => (
                      <TableRow
                        key={s.trackingCode}
                        className={`cursor-pointer hover:bg-zinc-800/40 transition-colors ${
                          selectedShipment?.trackingCode === s.trackingCode ? "bg-zinc-800 text-zinc-100" : ""
                        }`}
                        onClick={() => setSelectedShipment(s)}
                      >
                        <TableCell className="font-mono text-xs font-medium">{s.trackingCode}</TableCell>
                        <TableCell className="text-xs">{s.orderNumber}</TableCell>
                        <TableCell className="text-xs">{s.carrier}</TableCell>
                        <TableCell>
                          <Badge variant={s.status === "DELIVERED" ? "default" : "secondary"}>
                            {STATUS_LABEL[s.status] ?? s.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {shipments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No hay envíos registrados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detalle y mapa del envío seleccionado */}
        <div>
          {selectedShipment ? (
            <Card className="sticky top-20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Ubicación del Despacho</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Código de seguimiento</p>
                  <p className="font-mono font-medium mt-0.5">{selectedShipment.trackingCode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Dirección de destino</p>
                  <p className="font-medium mt-0.5">{selectedShipment.destinationAddress}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Entrega estimada</p>
                  <p className="mt-0.5">{selectedShipment.estimatedDeliveryDate || "Pendiente"}</p>
                </div>

                {/* Mapa */}
                <div className="rounded-md overflow-hidden border border-zinc-200 shadow-sm h-48 bg-zinc-100 mt-2">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                      selectedShipment.destinationAddress
                    )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Selecciona un envío para ver su mapa de destino.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}
