"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ClientNavbar() {
  const pathname = usePathname();

  // Ocultar Navbar en login y register
  if (pathname === "/" || pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="font-bold text-xl text-blue-600">SmartLogix</div>
        <div className="flex gap-6">
          <Link href="/orders/new" className={cn("text-sm font-medium hover:text-blue-600 transition-colors", pathname === "/orders/new" ? "text-blue-600" : "text-gray-600")}>
            Crear Pedido
          </Link>
          <Link href="/orders" className={cn("text-sm font-medium hover:text-blue-600 transition-colors", pathname === "/orders" ? "text-blue-600" : "text-gray-600")}>
            Mis Pedidos
          </Link>
          <Link href="/shipments" className={cn("text-sm font-medium hover:text-blue-600 transition-colors", pathname === "/shipments" ? "text-blue-600" : "text-gray-600")}>
            Mis Despachos
          </Link>
        </div>
        <div>
          <Link href="/" className="text-sm text-gray-500 hover:text-red-600 transition-colors font-medium">Cerrar Sesión</Link>
        </div>
      </div>
    </nav>
  );
}
