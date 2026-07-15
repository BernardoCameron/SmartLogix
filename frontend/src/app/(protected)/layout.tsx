import RouteGuard from "@/components/RouteGuard";

// protege todas las rutas de usuario autenticado
// cualquier rol puede acceder, pero si no hay token redirige a /
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      {children}
    </RouteGuard>
  );
}
