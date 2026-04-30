"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setError(null);
    try {
      const res = await fetch("http://localhost:8080/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const msg = await res.text();
        setResult(`Registro Exitoso: ${msg}`);
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
      <Card className="w-full max-w-md shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl">Registro de Usuario</CardTitle>
          <CardDescription>
            Crear cuenta en authdb
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nuevo Usuario</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full">Registrarse</Button>
          </form>
          {result && (
            <div className="mt-4 p-2 bg-green-50 text-green-700 border border-green-200 rounded text-sm">
              {result}
            </div>
          )}
          {error && (
            <div className="mt-4 p-2 bg-red-50 text-red-700 border border-red-200 rounded text-sm">
              {error}
            </div>
          )}
          <div className="mt-6 text-center space-y-2">
            <div><Link href="/login" className="text-sm text-blue-600 hover:underline">Ir a Iniciar Sesión</Link></div>
            <div><Link href="/" className="text-sm text-gray-500 hover:underline">Volver al inicio</Link></div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
