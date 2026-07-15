"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const isAuthRoute = pathname === "/" || pathname === "/register";

    if (!token && !isAuthRoute) {
      // no logueado intentando entrar a ruta protegida
      window.location.href = "/";
    } else if (token && isAuthRoute) {
      // logueado intentando entrar a login o registro
      router.push("/catalog");
    } else {
      setIsChecking(false);
    }
  }, [pathname, router]);

  // si esta comprobando no renderizar nada
  // para evitar mostrar rutas protegidas
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
