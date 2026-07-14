"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OrdersService } from "@/services/orders.service"

const clp = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export default function PaymentGatewayPage() {
  const { orderNumber } = useParams()
  const router = useRouter()
  const [total, setTotal] = useState<number>(0)
  const [loadingOrder, setLoadingOrder] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [statusText, setStatusText] = useState("")
  
  // Estado para la felicitacion de compra exitosa
  const [isSuccessPay, setIsSuccessPay] = useState(false)
  const [purchasedItems, setPurchasedItems] = useState("")

  // Campos de la tarjeta (modo prueba)
  const [cardNumber, setCardNumber] = useState("4111 1111 1111 1111")
  const [expiry, setExpiry] = useState("12/29")
  const [cvv, setCvv] = useState("123")
  const [cardName, setCardName] = useState("JUAN PEREZ")

  useEffect(() => {
    if (!orderNumber) return

    const loadOrderData = async () => {
      try {
        const orderData = await OrdersService.getOrderById(orderNumber as string)
        let amount = orderData.totalAmount || 0

        // Aplicar descuento local del cupón si existe para reflejar el CLP real
        const localDiscountsRaw = localStorage.getItem("smartlogix_order_discounts");
        if (localDiscountsRaw) {
          const localDiscounts = JSON.parse(localDiscountsRaw);
          const savedDiscount = localDiscounts[orderNumber as string];
          if (savedDiscount) {
            amount = savedDiscount.totalAmount;
            setPurchasedItems(savedDiscount.itemsSummary || "");
          }
        }
        
        // Fallback si no hay itemsSummary local, intentamos leer las lineas
        if (!purchasedItems && orderData.lines) {
          const summary = orderData.lines.map((l: any) => `${l.quantity}x ${l.sku}`).join(", ");
          setPurchasedItems(summary);
        }

        setTotal(amount)
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingOrder(false)
      }
    }
    loadOrderData()
  }, [orderNumber])

  const processPayment = (simulateApproved: boolean) => {
    setProcessing(true)
    setStatusText("Conectando con el emisor...")

    setTimeout(() => {
      setStatusText("Verificando fondos y credenciales de seguridad...")
      setTimeout(async () => {
        try {
          const targetStatus = simulateApproved ? "APPROVED" : "REJECTED"
          await OrdersService.updateOrderStatus(orderNumber as string, targetStatus)
          
          if (simulateApproved) {
            setStatusText("¡Pago aprobado con éxito!")
            setTimeout(() => {
              setIsSuccessPay(true)
              setProcessing(false)
            }, 1000)
          } else {
            setStatusText("Transacción rechazada por el banco.")
            setTimeout(() => {
              router.push(`/orders/${orderNumber}`)
            }, 1200)
          }
        } catch (e) {
          console.error(e)
          router.push(`/orders/${orderNumber}`)
        }
      }, 1200)
    }, 1000)
  }

  if (loadingOrder) {
    return (
      <main className="container mx-auto py-12 px-4 max-w-md text-center text-muted-foreground">
        Cargando orden de pago...
      </main>
    )
  }

  if (isSuccessPay) {
    return (
      <main className="container mx-auto py-12 px-4 max-w-md space-y-6">
        <Card className="border-green-800 shadow-2xl bg-zinc-900 text-center p-6 space-y-4">
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto">
            <span className="text-green-400 text-2xl">✓</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-green-400">¡Felicidades por tu compra!</h1>
            <p className="text-xs text-zinc-400">Tu pago ha sido procesado de forma segura.</p>
          </div>
          
          <div className="bg-zinc-800/40 border border-zinc-800 rounded-lg p-4 text-xs text-left space-y-2">
            <p className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Detalle de Adquisición</p>
            <p className="text-zinc-200 text-xs font-medium leading-relaxed">{purchasedItems || "Productos del pedido"}</p>
            <div className="flex justify-between border-t border-zinc-800 pt-2 mt-2">
              <span className="text-zinc-400">Orden N°:</span>
              <span className="font-mono text-zinc-200">{orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Total pagado:</span>
              <span className="font-bold text-primary">{clp(total)}</span>
            </div>
          </div>

          <Button
            onClick={() => router.push(`/orders/${orderNumber}`)}
            className="w-full bg-primary text-primary-foreground font-bold text-xs py-2.5 mt-2"
          >
            Ver Detalle del Pedido
          </Button>
        </Card>
      </main>
    )
  }

  return (
    <main className="container mx-auto py-12 px-4 max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground tracking-tight">SmartPay</h1>
        <p className="text-xs text-muted-foreground mt-1">Portal de Pagos e-Commerce Seguro</p>
      </div>

      <Card className="border-zinc-800 shadow-xl bg-zinc-900/50">
        <CardHeader className="pb-4 border-b border-zinc-800">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-sm font-semibold">Resumen de Pago</CardTitle>
              <CardDescription className="text-xs">Pedido: {orderNumber}</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total a pagar</p>
              <p className="text-lg font-bold text-primary">{clp(total)}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-4">
          {processing ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium animate-pulse">{statusText}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-zinc-800/40 border border-zinc-800 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                <p>🔒 <strong>Modo Desarrollo/Prueba</strong></p>
                <p>Ingresa cualquier tarjeta para simular. Los botones inferiores te permiten definir el resultado bancario.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cardName" className="text-xs">Nombre del Titular</Label>
                <Input
                  id="cardName"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  className="bg-zinc-800/50 border-zinc-700 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cardNumber" className="text-xs">Número de Tarjeta</Label>
                <Input
                  id="cardNumber"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4111 1111 1111 1111"
                  className="bg-zinc-800/50 border-zinc-700 font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="expiry" className="text-xs">Expiración (MM/AA)</Label>
                  <Input
                    id="expiry"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="12/29"
                    className="bg-zinc-800/50 border-zinc-700 font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cvv" className="text-xs">Código CVV</Label>
                  <Input
                    id="cvv"
                    type="password"
                    maxLength={4}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="123"
                    className="bg-zinc-800/50 border-zinc-700 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800">
                <Button
                  onClick={() => processPayment(true)}
                  className="bg-primary text-primary-foreground font-semibold text-xs py-2.5"
                >
                  Simular Aprobado
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => processPayment(false)}
                  className="bg-zinc-800 text-zinc-200 font-semibold text-xs py-2.5"
                >
                  Simular Rechazo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
