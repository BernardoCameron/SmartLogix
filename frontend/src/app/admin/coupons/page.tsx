"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OrdersAPI } from "@/api/orders.api"

type Coupon = {
  id: number
  code: string
  discountPercent: number
  active: boolean
  expiresAt: string | null
  usageLimit: number | null
  usageCount: number
}

const emptyForm = {
  code: "",
  discountPercent: "",
  usageLimit: "",
  expiresAt: "",
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = async () => {
    try {
      const data = await OrdersAPI.getCoupons()
      setCoupons(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)
    try {
      await OrdersAPI.createCoupon({
        code: form.code,
        discountPercent: parseFloat(form.discountPercent),
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      })
      setSuccess("Cupon creado correctamente.")
      setForm(emptyForm)
      load()
    } catch (err: any) {
      setError(err.message ?? "Error al crear el cupon.")
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (id: number, current: boolean) => {
    try {
      await OrdersAPI.setCouponStatus(id, !current)
      load()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <main className="container mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Gestion de Cupones</h1>

      {/* formulario */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Crear cupon</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="code">Codigo</Label>
              <Input
                id="code"
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="Ej: VERANO20"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="discountPercent">Descuento (%)</Label>
              <Input
                id="discountPercent"
                name="discountPercent"
                type="number"
                min="1"
                max="100"
                value={form.discountPercent}
                onChange={handleChange}
                placeholder="Ej: 10"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="usageLimit">Limite de usos (opcional)</Label>
              <Input
                id="usageLimit"
                name="usageLimit"
                type="number"
                min="1"
                value={form.usageLimit}
                onChange={handleChange}
                placeholder="Sin limite si esta vacio"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="expiresAt">Fecha de expiracion (opcional)</Label>
              <Input
                id="expiresAt"
                name="expiresAt"
                type="datetime-local"
                value={form.expiresAt}
                onChange={handleChange}
              />
            </div>

            {error && (
              <p className="sm:col-span-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="sm:col-span-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                {success}
              </p>
            )}

            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Crear cupon"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* tabla */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cupones registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-medium">{c.code}</TableCell>
                    <TableCell>{c.discountPercent}%</TableCell>
                    <TableCell>
                      {c.usageCount}
                      {c.usageLimit != null ? ` / ${c.usageLimit}` : " / ilimitado"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Sin limite"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.active ? "default" : "secondary"}>
                        {c.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleStatus(c.id, c.active)}
                      >
                        {c.active ? "Desactivar" : "Activar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {coupons.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No hay cupones creados.
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
