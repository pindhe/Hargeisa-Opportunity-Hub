"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button, Input, Select } from "@/components/ui";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    organizationName: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await register(form);
      router.push(user.role === "organization" ? "/org/dashboard" : "/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={onSubmit} className="rounded-3xl bg-white p-8">
        <h1 className="text-2xl font-semibold text-navy">Create your profile</h1>
        <p className="mt-2 text-sm text-slate-600">Join Hargeisa Opportunity Hub and start discovering opportunities.</p>
        {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <label className="mt-6 block text-sm font-medium">Full name
          <Input className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label className="mt-4 block text-sm font-medium">Email
          <Input className="mt-1" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </label>
        <label className="mt-4 block text-sm font-medium">Password
          <Input className="mt-1" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
        </label>
        <label className="mt-4 block text-sm font-medium">I am a
          <Select className="mt-1" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="student">Student</option>
            <option value="job_seeker">Graduate / job seeker</option>
            <option value="organization">Organization</option>
          </Select>
        </label>
        {form.role === "organization" ? (
          <label className="mt-4 block text-sm font-medium">Organization name
            <Input className="mt-1" value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })} required />
          </label>
        ) : null}
        <Button className="mt-6 w-full" disabled={busy}>{busy ? "Creating..." : "Create account"}</Button>
        <p className="mt-4 text-sm">Already have an account? <Link href="/login" className="font-semibold text-primary">Login</Link></p>
      </form>
    </div>
  );
}
