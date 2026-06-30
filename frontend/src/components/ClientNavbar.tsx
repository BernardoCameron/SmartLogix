"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AuthService } from "@/services/auth.service";

export default function ClientNavbar() {
  const pathname = usePathname();

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
