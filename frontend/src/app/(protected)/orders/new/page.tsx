"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { OrdersService } from "@/services/orders.service";
import { InventoryService } from "@/services/inventory.service";

interface InventoryItem {
  sku: string;
  productName: string;
  price?: number;
  availableQuantity: number;
}

export default function CreateOrder() {
  const [customerName, setCustomerName] = useState("Juan Perez");
  const [customerEmail, setCustomerEmail] = useState("juanperez@correo.cl");
  const [shippingAddress, setShippingAddress] = useState("Av. Siempreviva 123, Santiago");
  const [selectedSku, setSelectedSku] = useState("");
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // cargar datos de inventario
    InventoryService.getAllItems()
      .then(data => {
        setInventoryItems(data);
        if (data.length > 0) {
          setSelectedSku(data[0].sku);
        }
      })
      .catch(err => console.error("Failed to load inventory", err));
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setError(null);
    
    const selectedItem = inventoryItems.find(i => i.sku === selectedSku);
    const itemPrice = selectedItem && selectedItem.price ? Number(selectedItem.price) : 129990;

    const payload = {
      customerName,
      customerEmail,
      shippingAddress,
      lines: [
        {
          sku: selectedSku,
          quantity: 1, // fijo en 1 por ahora
          unitPrice: itemPrice
        }
      ]
    };

    try {
      const data = await OrdersService.createOrder(payload);
      setResult(data);
    } catch (err: any) {
      setError(`Error de red: ${err.message}`);
    }
  };

  const formatCLP = (val: any) => {
    const num = Number(val || 0);
    return num.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
  };

  return (
    <main className="min-h-screen flex flex-col items-center p-8 bg-slate-50 gap-6">
      
      {/* tabla de inventario */}
      <Card className="w-full max-w-2xl shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl">Inventario Disponible</CardTitle>
          <CardDescription>Datos de prueba cargados desde /api/inventory/items</CardDescription>
        </CardHeader>
        <CardContent>
          {inventoryItems.length === 0 ? (
            <p className="text-sm text-gray-500">Cargando inventario...</p>
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-2">SKU</th>
                  <th className="py-2">Producto</th>
                  <th className="py-2 text-right">Precio</th>
                  <th className="py-2 text-right">Stock Disponible</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map(item => (
                  <tr key={item.sku} className="border-b">
                    <td className="py-2 font-mono">{item.sku}</td>
                    <td className="py-2">{item.productName}</td>
                    <td className="py-2 text-right">{formatCLP(item.price ?? 129990)}</td>
                    <td className="py-2 text-right">{item.availableQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl">Crear Pedido Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateOrder} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Nombre del Cliente</Label>
                <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Correo</Label>
                <Input id="customerEmail" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingAddress">Dirección</Label>
              <Input id="shippingAddress" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} required />
            </div>
            
            <div className="space-y-2 border-t pt-4 mt-4">
              <Label htmlFor="skuSelect">Seleccionar Producto a comprar (Cant: 1)</Label>
              <select 
                id="skuSelect"
                value={selectedSku} 
                onChange={(e) => setSelectedSku(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
              >
                {inventoryItems.map(item => (
                  <option key={item.sku} value={item.sku}>
                    {item.productName} ({item.sku}) - {formatCLP(item.price ?? 129990)} - {item.availableQuantity} disp.
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" className="w-full mt-4">Crear Pedido</Button>
          </form>

          {result && (
            <div className="mt-4 p-2 bg-green-50 text-green-800 border border-green-200 rounded text-xs overflow-auto">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
          {error && (
            <div className="mt-4 p-2 bg-red-50 text-red-800 border border-red-200 rounded text-xs">
              {error}
            </div>
          )}
          <div className="mt-6 text-center">
            <Link href="/orders" className="text-sm text-blue-600 hover:underline">Volver a Mis Pedidos</Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
