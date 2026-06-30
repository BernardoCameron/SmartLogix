"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InventoryService } from "@/services/inventory.service";

type Product = {
  sku: string;
  productName: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
  warehouseCode: string;
  availableQuantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  averageRating: number;
  active: boolean;
};

const emptyForm = {
  sku: "",
  productName: "",
  description: "",
  category: "",
  price: "",
  imageUrl: "",
  warehouseCode: "",
  initialQuantity: "",
  reorderLevel: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      const data = await InventoryService.getAllItems();
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await InventoryService.createItem({
        sku: form.sku,
        productName: form.productName,
        description: form.description,
        category: form.category,
        price: parseFloat(form.price),
        imageUrl: form.imageUrl,
        warehouseCode: form.warehouseCode,
        initialQuantity: parseInt(form.initialQuantity),
        reorderLevel: parseInt(form.reorderLevel),
      });
      setSuccess("Producto creado correctamente.");
      setForm(emptyForm);
      loadProducts();
    } catch (err: any) {
      setError(err.message ?? "Error al crear el producto.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (sku: string, current: boolean) => {
    try {
      await InventoryService.updateStatus(sku, !current);
      loadProducts();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="container mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Gestion de Productos</h1>

      {/* formulario de creacion */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agregar nuevo producto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: "sku", label: "SKU" },
              { name: "productName", label: "Nombre" },
              { name: "category", label: "Categoria" },
              { name: "price", label: "Precio", type: "number" },
              { name: "warehouseCode", label: "Codigo bodega" },
              { name: "initialQuantity", label: "Stock inicial", type: "number" },
              { name: "reorderLevel", label: "Nivel de reorden", type: "number" },
              { name: "imageUrl", label: "URL imagen" },
            ].map(({ name, label, type }) => (
              <div key={name} className="space-y-1">
                <Label htmlFor={name}>{label}</Label>
                <Input
                  id={name}
                  name={name}
                  type={type ?? "text"}
                  value={(form as any)[name]}
                  onChange={handleChange}
                  required={name !== "imageUrl"}
                />
              </div>
            ))}

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="description">Descripcion</Label>
              <Input
                id="description"
                name="description"
                value={form.description}
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
                {saving ? "Guardando..." : "Crear producto"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* tabla de productos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Productos registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.sku}>
                    <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                    <TableCell>{p.productName}</TableCell>
                    <TableCell>{p.category || "-"}</TableCell>
                    <TableCell>${Number(p.price).toFixed(2)}</TableCell>
                    <TableCell>{p.availableQuantity}</TableCell>
                    <TableCell>
                      <Badge variant={p.active ? "default" : "secondary"}>
                        {p.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleStatus(p.sku, p.active)}
                      >
                        {p.active ? "Desactivar" : "Activar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No hay productos registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
