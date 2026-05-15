"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type ShipmentResponse = {
  trackingCode: string
  orderNumber: string
  carrier: string
  routeCode: string
  estimatedDeliveryDate: string
  status: string
  createdAt: string
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentResponse[]>([])

  useEffect(() => {
    fetch("http://localhost:8080/api/shipments")
      .then((res) => res.json())
      .then((data) => setShipments(data))
      .catch((err) => console.error(err))
  }, [])

  return (
    <main className="container mx-auto py-10 px-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mis Despachos</CardTitle>
          <Link href="/">
            <Button variant="outline">Volver</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tracking Code</TableHead>
                <TableHead>N° Pedido</TableHead>
                <TableHead>Transportista</TableHead>
                <TableHead>Fecha Est. Entrega</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.map((shipment) => (
                <TableRow key={shipment.trackingCode}>
                  <TableCell className="font-medium text-blue-600">{shipment.trackingCode}</TableCell>
                  <TableCell>{shipment.orderNumber}</TableCell>
                  <TableCell>{shipment.carrier} ({shipment.routeCode})</TableCell>
                  <TableCell>{shipment.estimatedDeliveryDate}</TableCell>
                  <TableCell>
                    <Badge variant={shipment.status === 'PLANNED' ? 'default' : 'outline'}>
                      {shipment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(shipment.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {shipments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No hay despachos registrados.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
