"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthService } from "@/services/auth.service";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setError(null);
    try {
      await AuthService.register({ username, password });
      setResult(`Registro Exitoso. Redirigiendo...`);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-indigo-950 via-slate-900 to-black relative overflow-hidden">
      {/* Esferas decorativas de fondo */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40"></div>

      <div className="w-full max-w-md z-10">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 sm:p-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-3">Crear Cuenta</h1>
            <p className="text-indigo-200 text-sm font-medium">Únete a la plataforma logística del futuro</p>
          </div>
          
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300 font-medium">Nuevo Usuario</Label>
              <Input 
                id="username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl h-12 px-4" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 font-medium">Contraseña</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl h-12 px-4" 
              />
            </div>
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-xl h-12 font-semibold transition-all shadow-lg shadow-purple-600/30">
              Registrarse
            </Button>
          </form>

          {result && (
            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 rounded-xl text-sm text-center">
              {result}
            </div>
          )}
          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <div className="mt-8 text-center pt-6 border-t border-white/10">
            <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
              ¿Ya tienes cuenta? Inicia Sesión
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
