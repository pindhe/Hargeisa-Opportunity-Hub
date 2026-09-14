"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api } from "@/lib/api";
import { Button, Input } from "@/components/ui";

function ResetForm() {
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const data = await api<{ message: string }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: params.get("token"), password }),
      });
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl bg-white p-8">
      <h1 className="text-2xl font-semibold text-navy">Choose a new password</h1>
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
      <Input className="mt-6" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
      <Button className="mt-4 w-full">Update password</Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Suspense>
        <ResetForm />
      </Suspense>
    </div>
  );
}
