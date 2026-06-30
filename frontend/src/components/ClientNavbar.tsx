"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AuthService } from "@/services/auth.service";
import { CartService } from "@/services/cart.service";

export default function ClientNavbar() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  // actualizar contador al montar y cuando cambia la ruta
  useEffect(() => {
    setCartCount(CartService.getCount());
  }, [pathname]);

  // ocultar en login y registro
  if (pathname === "/" || pathname === "/register") {
    return null;
  }

  const isAdminOrWarehouse = AuthService.isAdminOrWarehouse();
  const isAdmin = AuthService.isAdmin();
  const username = AuthService.getUsername();

  const linkClass = (path: string) =>
    cn(
      "text-sm font-medium transition-colors hover:text-foreground",
      pathname === path ? "text-foreground" : "text-muted-foreground"
    );

  return (
    <nav className="bg-card border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="font-semibold text-foreground">SmartLogix</div>

        <div className="flex gap-6 items-center">
          {/* links para todos los usuarios */}
          <Link href="/catalog" className={linkClass("/catalog")}>
            Productos
          </Link>
          <Link href="/cart" className={cn(linkClass("/cart"), "flex items-center gap-1")}>
            Carrito
            {cartCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center leading-none">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>
          <Link href="/orders" className={linkClass("/orders")}>
            Mis Pedidos
          </Link>
          <Link href="/shipments" className={linkClass("/shipments")}>
            Mis Envios
          </Link>

          {/* links para admin y bodega */}
          {isAdminOrWarehouse && (
            <>
              <Link href="/admin/products" className={linkClass("/admin/products")}>
                Gestion Productos
              </Link>
              <Link href="/admin/shipments" className={linkClass("/admin/shipments")}>
                Gestion Envios
              </Link>
            </>
          )}

          {/* solo admin */}
          {isAdmin && (
            <Link href="/admin/dashboard" className={linkClass("/admin/dashboard")}>
              Dashboard
            </Link>
          )}
          {/* warehouse ve su propio dashboard de productos */}
          {!isAdmin && AuthService.isWarehouse() && (
            <Link href="/admin/dashboard/warehouse" className={linkClass("/admin/dashboard/warehouse")}>
              Dashboard
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {username && (
            <span className="text-xs text-muted-foreground">{username}</span>
          )}
          <button
            onClick={() => {
              AuthService.logout();
              window.location.href = "/";
            }}
            className="text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            Cerrar sesion
          </button>
        </div>
      </div>
    </nav>
  );
}
