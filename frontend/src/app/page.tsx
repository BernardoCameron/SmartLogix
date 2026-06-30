"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

import { AuthService } from "@/services/auth.service";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await AuthService.login({ username, password });
      window.location.href = "/orders/new";
    } catch (err: any) {
      setError("Usuario o contrasena incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">SmartLogix</h1>
          <p className="text-slate-500 text-sm mt-1">Ingresa para continuar</p>
        </div>

        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-slate-800">Iniciar sesion</CardTitle>
            <CardDescription>Ingresa tus credenciales de acceso</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="username" className="text-slate-700">Usuario</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password" className="text-slate-700">Contrasena</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Link href="/register" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
                No tienes cuenta? Registrate aqui
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
