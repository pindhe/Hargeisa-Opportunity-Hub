"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";

import { AuthFrame } from "@/components/auth-frame";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { api, errorMessage } from "@/lib/api";

const schema = z.object({ email: z.string().email("Enter a valid email") });

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const form = useForm<{ email: string }>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  return (
    <AuthFrame title="Reset your password" subtitle="We will prepare a reset link for this email.">
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            const response = await api.post<{ message: string; reset_token: string | null }>("/api/auth/forgot-password", values);
            setMessage(response.data.message);
            setToken(response.data.reset_token);
          } catch (error) {
            setMessage(errorMessage(error));
          }
        })}
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...form.register("email")} />
          {form.formState.errors.email && <p className="mt-1 text-sm text-danger">{form.formState.errors.email.message}</p>}
        </div>
        <Button type="submit" className="w-full">Send reset link</Button>
      </form>
      {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
      {token && (
        <Link href={`/reset-password?token=${encodeURIComponent(token)}`} className="mt-3 inline-block text-sm text-primary">
          Continue to reset password
        </Link>
      )}
    </AuthFrame>
  );
}
