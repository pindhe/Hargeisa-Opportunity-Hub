"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button, Input } from "@/components/ui";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("student@hoh.local");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await login(email, password);
      router.push(user.role === "admin" ? "/admin" : user.role === "organization" ? "/org/dashboard" : "/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid email or password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={onSubmit} className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-navy">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-600">Log in to save opportunities and track applications.</p>
        {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <label className="mt-6 block text-sm font-medium">Email
          <Input className="mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="mt-4 block text-sm font-medium">Password
          <Input className="mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <Button className="mt-6 w-full" disabled={busy}>{busy ? "Signing in..." : "Login"}</Button>
        <p className="mt-4 text-sm text-slate-600">
          <Link href="/forgot-password" className="text-primary">Forgot password?</Link>
        </p>
        <p className="mt-2 text-sm text-slate-600">
          New here? <Link href="/register" className="font-semibold text-primary">Create account</Link>
        </p>
        <p className="mt-6 text-xs text-slate-500">Demo: student@hoh.local / admin@hoh.local / org@hoh.local — Password123!</p>
      </form>
    </div>
  );
}
