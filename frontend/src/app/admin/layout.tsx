import RouteGuard from "@/components/RouteGuard";

// protege todas las rutas bajo /admin
// solo ROLE_ADMIN y ROLE_WAREHOUSE pueden acceder
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard roles={["ROLE_ADMIN", "ROLE_WAREHOUSE"]}>
      {children}
    </RouteGuard>
  );
}
