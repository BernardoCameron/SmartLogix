"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CartService, CartItem } from "@/services/cart.service";
import { OrdersService } from "@/services/orders.service";
import { OrdersAPI } from "@/api/orders.api";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError(null);
    setValidatingCoupon(true);
    try {
      const result = await OrdersAPI.validateCoupon(couponCode.trim());
      if (result.valid) {
        setDiscount(Number(result.discountPercent) / 100);
        setCouponApplied(result.code);
      } else {
        setDiscount(0);
        setCouponApplied(null);
        setCouponError(result.message ?? "Cupon no valido.");
      }
    } catch {
      setDiscount(0);
      setCouponApplied(null);
      setCouponError("Error al validar el cupon.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const subtotal = CartService.getTotal();
  const total = subtotal * (1 - discount);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setError(null);
    setPlacing(true);

    try {
      const payload = {
        customerName,
        customerEmail,
        shippingAddress,
        couponCode: couponApplied ?? undefined,
        lines: items.map((i) => ({
          sku: i.sku,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
      };

      const order = await OrdersService.createOrder(payload);
      CartService.clearCart();
      router.push(`/orders/${order.orderNumber}`);
    } catch (err: any) {
      setError(err.message ?? "No se pudo crear el pedido. Verifica el stock.");
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="container mx-auto py-10 px-4">
        <h1 className="text-2xl font-semibold mb-4">Carrito</h1>
        <p className="text-muted-foreground text-sm">Tu carrito esta vacio.</p>
        <Button className="mt-4" onClick={() => router.push("/catalog")}>
          Ver productos
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-6 text-foreground">Carrito</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* lista de productos */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <Card key={item.sku}>
              <CardContent className="pt-4 flex gap-4 items-center">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-16 h-16 object-cover rounded-md bg-muted"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-md bg-muted" />
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{item.productName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                  <p className="text-sm font-semibold mt-1">${Number(item.price).toFixed(2)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-7 h-7 p-0"
                    onClick={() => handleQuantity(item.sku, item.quantity - 1)}
                  >
                    -
                  </Button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-7 h-7 p-0"
                    onClick={() => handleQuantity(item.sku, item.quantity + 1)}
                  >
                    +
                  </Button>
                </div>

                <div className="text-right w-20">
                  <p className="text-sm font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => handleRemove(item.sku)}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors mt-1"
                  >
                    Eliminar
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* resumen y checkout */}
        <div className="space-y-4">
          {/* cupon */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Cupon de descuento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Codigo"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    setCouponApplied(null);
                    setCouponError(null);
                    setDiscount(0);
                  }}
                  className="text-sm"
                  disabled={!!couponApplied}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyCoupon}
                  disabled={validatingCoupon || !!couponApplied || !couponCode.trim()}
                >
                  {validatingCoupon ? "..." : couponApplied ? "Aplicado" : "Aplicar"}
                </Button>
              </div>
              {couponApplied && (
                <p className="text-xs text-green-700">
                  Cupon <strong>{couponApplied}</strong> aplicado — {(discount * 100).toFixed(0)}% de descuento.
                </p>
              )}
              {couponError && (
                <p className="text-xs text-destructive">{couponError}</p>
              )}
            </CardContent>
          </Card>

          {/* totales y formulario de envio */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Resumen del pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm mb-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Descuento</span>
                    <span>-${(subtotal * discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <form onSubmit={handleCheckout} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Tu nombre completo"
                    required
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Direccion de envio</Label>
                  <Input
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Calle, numero, ciudad"
                    required
                    className="text-sm"
                  />
                </div>

                {error && (
                  <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={placing}>
                  {placing ? "Procesando..." : "Realizar pedido"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
