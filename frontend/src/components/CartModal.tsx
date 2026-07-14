"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CartService, CartItem } from "@/services/cart.service";
import { OrdersService } from "@/services/orders.service";
import { OrdersAPI } from "@/api/orders.api";

const clp = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartModal({ isOpen, onClose }: CartModalProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("Juan Perez");
  const [customerEmail, setCustomerEmail] = useState("juanperez@correo.cl");
  const [shippingAddress, setShippingAddress] = useState("Av. Siempreviva 123, Santiago");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Autocompletado de direcciones
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setItems(CartService.getCart());
      // Cargar credenciales del usuario logueado por defecto
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          if (payload.sub) {
            setCustomerEmail(payload.sub);
            // Nombre derivado del correo
            const namePart = payload.sub.split("@")[0];
            setCustomerName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [isOpen]);

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
        console.error(e);
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
        setCouponError(result.message ?? "Cupón no válido.");
      }
    } catch {
      setDiscount(0);
      setCouponApplied(null);
      setCouponError("Error al validar el cupón.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Obtener precios reales con fallback local
  const getProductPrice = (item: CartItem) => {
    const localPrices = JSON.parse(localStorage.getItem("smartlogix_local_prices") || "{}");
    return item.price || localPrices[item.sku] || 129990;
  };

  const subtotal = items.reduce((sum, item) => sum + getProductPrice(item) * item.quantity, 0);
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
          unitPrice: getProductPrice(i),
        })),
      };
      const order = await OrdersService.createOrder(payload);

      // Persistir el descuento localmente para evitar discrepancia visual con el backend antiguo
      const localDiscountsRaw = localStorage.getItem("smartlogix_order_discounts") || "{}";
      const localDiscounts = JSON.parse(localDiscountsRaw);
      localDiscounts[order.orderNumber] = {
        couponCode: couponApplied,
        discountAmount: descuentoMonto,
        totalAmount: total,
        // Guardamos los nombres de los productos comprados para el mensaje final
        itemsSummary: items.map(i => `${i.quantity}x ${i.productName}`).join(", ")
      };
      localStorage.setItem("smartlogix_order_discounts", JSON.stringify(localDiscounts));

      // Incrementar uso del cupón local
      if (couponApplied) {
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
      onClose();
      router.push(`/checkout/pay/${order.orderNumber}`);
    } catch (err: any) {
      setError(err.message ?? "No se pudo crear el pedido.");
    } finally {
      setPlacing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col text-zinc-100">
        
        {/* Cabecera del modal */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-foreground">Tu Carrito de Compras</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 text-lg font-semibold">
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <p className="text-zinc-400 text-sm">Tu carrito está vacío.</p>
            <Button onClick={onClose} className="bg-primary text-primary-foreground font-semibold text-xs">
              Ver Productos
            </Button>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Lista de productos */}
            <div className="lg:col-span-3 space-y-3 overflow-y-auto max-h-[50vh] pr-2">
              {items.map((item) => {
                const precioReal = getProductPrice(item);
                return (
                  <div key={item.sku} className="bg-zinc-800/40 border border-zinc-850 rounded-lg p-3 flex gap-3 items-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-12 h-12 object-cover rounded bg-zinc-800"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-zinc-800" />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-foreground truncate">{item.productName}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{item.sku}</p>
                      <p className="text-xs font-bold text-primary mt-0.5">{clp(precioReal)}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleQuantity(item.sku, item.quantity - 1)}
                        className="w-6 h-6 border border-zinc-700 rounded flex items-center justify-center hover:bg-zinc-800 text-xs"
                      >-</button>
                      <span className="w-5 text-center text-xs font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantity(item.sku, item.quantity + 1)}
                        className="w-6 h-6 border border-zinc-700 rounded flex items-center justify-center hover:bg-zinc-800 text-xs"
                      >+</button>
                    </div>

                    <div className="text-right w-24">
                      <p className="text-xs font-bold text-foreground">{clp(precioReal * item.quantity)}</p>
                      <button
                        onClick={() => handleRemove(item.sku)}
                        className="text-[10px] text-zinc-500 hover:text-red-400 mt-0.5 block ml-auto"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Checkout y totales */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Cupón */}
              <div className="bg-zinc-800/20 border border-zinc-800 rounded-lg p-4 space-y-2">
                <p className="text-xs font-bold text-foreground">Cupón de descuento</p>
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
                    className="text-xs bg-zinc-800/50 border-zinc-750"
                    disabled={!!couponApplied}
                  />
                  <Button
                    variant="outline" size="sm" onClick={applyCoupon}
                    disabled={validatingCoupon || !!couponApplied || !couponCode.trim()}
                    className="border-zinc-700 hover:bg-zinc-800 text-xs"
                  >
                    {validatingCoupon ? "..." : couponApplied ? "Listo" : "Aplicar"}
                  </Button>
                </div>
                {couponApplied && (
                  <p className="text-[11px] text-green-400 font-medium">
                    Cupón <strong>{couponApplied}</strong> activado — {(discount * 100).toFixed(0)}% desc.
                  </p>
                )}
                {couponError && <p className="text-[11px] text-red-400">{couponError}</p>}
              </div>

              {/* Totales y Datos */}
              <div className="bg-zinc-800/20 border border-zinc-800 rounded-lg p-4 space-y-4">
                <div className="space-y-1.5 text-xs pb-3 border-b border-zinc-800">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span>{clp(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-400 font-medium">
                      <span>Descuento</span>
                      <span>-{clp(descuentoMonto)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-foreground text-sm pt-1">
                    <span>Total</span>
                    <span>{clp(total)}</span>
                  </div>
                </div>

                {/* Formulario */}
                <form onSubmit={handleCheckout} className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-zinc-400">Nombre completo</Label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required className="text-xs bg-zinc-800/50 border-zinc-750"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-zinc-400">Correo electrónico</Label>
                    <Input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      required className="text-xs bg-zinc-800/50 border-zinc-750"
                    />
                  </div>
                  <div className="space-y-1 relative">
                    <Label className="text-[10px] text-zinc-400">Dirección de envío</Label>
                    <Input
                      value={shippingAddress}
                      onChange={(e) => {
                        setShippingAddress(e.target.value);
                        setShowSuggestions(true);
                      }}
                      required className="text-xs bg-zinc-800/50 border-zinc-750"
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                    {showSuggestions && addressSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 z-50 bg-zinc-800 border border-zinc-700 rounded-md shadow-2xl max-h-40 overflow-y-auto mt-1 text-[11px] text-zinc-100">
                        {addressSuggestions.map((item, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-2 cursor-pointer hover:bg-zinc-700 border-b border-zinc-750 last:border-0 truncate"
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

                  {error && (
                    <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/25 rounded px-2 py-1.5">
                      {error}
                    </p>
                  )}

                  <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold text-xs py-2 mt-2" disabled={placing}>
                    {placing ? "Procesando..." : "Confirmar y Pagar"}
                  </Button>
                </form>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
