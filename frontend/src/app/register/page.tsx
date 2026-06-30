"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthService } from "@/services/auth.service";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setError(null);
    setLoading(true);
    try {
      await AuthService.register({ username, password });
      setResult("Registro exitoso. Redirigiendo...");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err: any) {
      setError("No se pudo crear la cuenta. Intenta con otro usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">SmartLogix</h1>
          <p className="text-slate-500 text-sm mt-1">Crea tu cuenta para comenzar</p>
        </div>

        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-slate-800">Crear cuenta</CardTitle>
            <CardDescription>Completa los datos para registrarte</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="username" className="text-slate-700">Usuario</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Elige un nombre de usuario"
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

              {result && (
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                  {result}
                </p>
              )}
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creando cuenta..." : "Registrarse"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Link href="/" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
                Ya tienes cuenta? Inicia sesion aqui
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
