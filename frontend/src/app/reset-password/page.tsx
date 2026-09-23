"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthFrame } from "@/components/auth-frame";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { api, errorMessage } from "@/lib/api";

const schema = z.object({ password: z.string().min(8, "Use at least 8 characters") });

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const form = useForm<{ password: string }>({ resolver: zodResolver(schema), defaultValues: { password: "" } });

  return (
    <AuthFrame title="Choose a new password" subtitle="Use at least 8 characters.">
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            const response = await api.post<{ message: string }>("/api/auth/reset-password", {
              token: params.get("token") ?? "",
              password: values.password,
            });
            setMessage(response.data.message);
            window.setTimeout(() => router.push("/login"), 800);
          } catch (error) {
            setMessage(errorMessage(error));
          }
        })}
      >
        <div>
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" {...form.register("password")} />
          {form.formState.errors.password && <p className="mt-1 text-sm text-danger">{form.formState.errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full">Update password</Button>
      </form>
      {message && <p className="mt-4 text-sm">{message}</p>}
    </AuthFrame>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
