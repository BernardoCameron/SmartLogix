"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setError(null);
    try {
      const res = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const token = await res.text();
        setResult(`Token JWT: ${token}`);
      } else {
        const err = await res.text();
        setError(`Error: ${err}`);
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            Conectando a /auth/login a través de API Gateway
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full">Entrar</Button>
          </form>
          {result && (
            <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md text-sm break-all">
              {result}
            </div>
          )}
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="mt-6 text-center space-y-2">
            <div><Link href="/register" className="text-sm text-blue-600 hover:underline">¿No tienes cuenta? Regístrate aquí</Link></div>
            <div><Link href="/" className="text-sm text-gray-500 hover:underline">Volver al inicio</Link></div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
