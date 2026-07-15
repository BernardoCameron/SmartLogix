"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/services/auth.service";

type Props = {
  children: React.ReactNode;
  // si no se pasan roles, solo requiere estar autenticado
  roles?: string[];
};

// protege rutas del lado del cliente
// redirige a login si no hay token
// redirige a /catalog si el rol no esta permitido
export default function RouteGuard({ children, roles }: Props) {
  const router = useRouter();

  useEffect(() => {
    const token = AuthService.getToken();

    if (!token) {
      router.replace("/");
      return;
    }

    if (roles && roles.length > 0) {
      const role = AuthService.getRole();
      if (!role || !roles.includes(role)) {
        router.replace("/catalog");
      }
    }
  }, []);

  return <>{children}</>;
}
