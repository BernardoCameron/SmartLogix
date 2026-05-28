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
      // Not logged in and trying to access a protected route
      window.location.href = "/";
    } else if (token && isAuthRoute) {
      // Logged in and trying to access login/register
      router.push("/orders/new");
    } else {
      setIsChecking(false);
    }
  }, [pathname, router]);

  // Si aún está comprobando y no es ruta pública, mejor no renderizar nada 
  // para evitar pantallazos de rutas protegidas
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
