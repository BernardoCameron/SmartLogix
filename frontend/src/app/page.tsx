import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
      <Card className="w-full max-w-lg shadow-xl border-t-4 border-t-blue-600">
        <CardHeader>
          <CardTitle className="text-3xl text-center">SmartLogix</CardTitle>
          <CardDescription className="text-center text-lg">
            Dashboard interactivo para microservicios
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 mt-4">
          <Link href="/login" className="w-full">
            <Button className="w-full" size="lg">Iniciar Sesión (Auth Service)</Button>
          </Link>
          <Link href="/orders/new" className="w-full">
            <Button className="w-full" variant="outline" size="lg">Crear Pedido (Order Service)</Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
