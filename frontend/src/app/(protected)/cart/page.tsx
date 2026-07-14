"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CartService, CartItem } from "@/services/cart.service";
import { OrdersService } from "@/services/orders.service";
import { OrdersAPI } from "@/api/orders.api";

const clp = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para autocompletado de direcciones
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    setItems(CartService.getCart());
  }, []);

  // Autocompletado de direcciones con OpenStreetMap Nominatim
  useEffect(() => {
    if (shippingAddress.trim().length < 4) {
      setAddressSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            shippingAddress
          )}&countrycodes=cl&limit=5`
        );
        if (res.ok) {
          const data = await res.json();
          setAddressSuggestions(data);
        }
      } catch (e) {
        console.error("Fallo obtener sugerencias de mapas:", e);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [shippingAddress]);

  const refresh = () => setItems(CartService.getCart());

  const handleQuantity = (sku: string, qty: number) => {
    CartService.updateQuantity(sku, qty);
    refresh();
  };

  const handleRemove = (sku: string) => {
    CartService.removeItem(sku);
    refresh();
  };

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
  const descuentoMonto = subtotal * discount;
  const total = subtotal - descuentoMonto;

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
      
      // Registrar el descuento del cupon en localStorage para sobreescribir discrepancias del backend
      if (couponApplied) {
        const localDiscountsRaw = localStorage.getItem("smartlogix_order_discounts") || "{}";
        const localDiscounts = JSON.parse(localDiscountsRaw);
        localDiscounts[order.orderNumber] = {
          couponCode: couponApplied,
          discountAmount: descuentoMonto,
          totalAmount: total
        };
        localStorage.setItem("smartlogix_order_discounts", JSON.stringify(localDiscounts));

        // Registrar uso en cupones locales (si aplica)
        const mockCouponsRaw = localStorage.getItem("smartlogix_mock_coupons");
        if (mockCouponsRaw) {
          const mockCoupons = JSON.parse(mockCouponsRaw);
          const updated = mockCoupons.map((c: any) => 
            c.code === couponApplied ? { ...c, usageCount: c.usageCount + 1 } : c
          );
          localStorage.setItem("smartlogix_mock_coupons", JSON.stringify(updated));
        }
      }

      CartService.clearCart();
      router.push(`/orders/${order.orderNumber}`);
    } catch (err: any) {
      setError(err.message ?? "No se pudo crear el pedido.");
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
                  <p className="text-sm font-semibold mt-1">{clp(item.price)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm" variant="outline" className="w-7 h-7 p-0"
                    onClick={() => handleQuantity(item.sku, item.quantity - 1)}
                  >-</Button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <Button
                    size="sm" variant="outline" className="w-7 h-7 p-0"
                    onClick={() => handleQuantity(item.sku, item.quantity + 1)}
                  >+</Button>
                </div>

                <div className="text-right w-24">
                  <p className="text-sm font-semibold">{clp(item.price * item.quantity)}</p>
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
                  placeholder="Ej: BIENVENIDA"
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
                  variant="outline" size="sm" onClick={applyCoupon}
                  disabled={validatingCoupon || !!couponApplied || !couponCode.trim()}
                >
                  {validatingCoupon ? "..." : couponApplied ? "Aplicado" : "Aplicar"}
                </Button>
              </div>
              {couponApplied && (
                <p className="text-xs text-green-700">
                  Cupon <strong>{couponApplied}</strong> — {(discount * 100).toFixed(0)}% de descuento.
                </p>
              )}
              {couponError && <p className="text-xs text-destructive">{couponError}</p>}
            </CardContent>
          </Card>

          {/* totales + formulario de datos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Datos del pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm mb-5 pb-4 border-b">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{clp(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Descuento</span>
                    <span>-{clp(descuentoMonto)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{clp(total)}</span>
                </div>
              </div>

              <form onSubmit={handleCheckout} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre completo</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Juan Perez"
                    required className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Correo electronico</Label>
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="juanperez@correo.cl"
                    required className="text-sm"
                  />
                </div>
                <div className="space-y-1 relative">
                  <Label className="text-xs">Direccion de envio</Label>
                  <Input
                    value={shippingAddress}
                    onChange={(e) => {
                      setShippingAddress(e.target.value);
                      setShowSuggestions(true);
                    }}
                    placeholder="Av. Siempreviva 123, Santiago"
                    required className="text-sm"
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 z-50 bg-white border border-zinc-200 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1 text-xs">
                      {addressSuggestions.map((item, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-2 cursor-pointer hover:bg-zinc-100 border-b last:border-0 truncate"
                          onMouseDown={() => {
                            setShippingAddress(item.display_name);
                            setShowSuggestions(false);
                          }}
                        >
                          {item.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {shippingAddress.trim().length > 5 && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Ubicacion en mapa (Preview)</Label>
                    <div className="rounded-md overflow-hidden border border-zinc-200 shadow-sm h-40 bg-zinc-100">
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight={0}
                        marginWidth={0}
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(shippingAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={placing}>
                  {placing ? "Procesando..." : "Confirmar pedido"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
