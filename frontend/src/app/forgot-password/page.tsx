"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button, Input } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = await api<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    setMessage(data.message);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={onSubmit} className="rounded-3xl bg-white p-8">
        <h1 className="text-2xl font-semibold text-navy">Reset password</h1>
        <p className="mt-2 text-sm text-slate-600">We will send a reset link if the account exists.</p>
        <Input className="mt-6" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email" />
        <Button className="mt-4 w-full">Send reset link</Button>
        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
      </form>
    </div>
  );
}
