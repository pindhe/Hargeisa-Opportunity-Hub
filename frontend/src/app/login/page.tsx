"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";

import { AuthFrame } from "@/components/auth-frame";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  return (
    <AuthFrame title="Welcome back" subtitle="Sign in to your opportunity feed.">
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          setFormError("");
          try {
            const user = await login(values.email, values.password);
            const next = new URLSearchParams(window.location.search).get("next");
            if (user.role === "ADMIN") router.push(next?.startsWith("/admin") ? next : "/admin");
            else if (!user.onboarding_complete) router.push("/onboarding");
            else router.push(next && next.startsWith("/") ? next : "/dashboard");
          } catch (error) {
            setFormError(errorMessage(error));
          }
        })}
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...form.register("email")} />
          {form.formState.errors.email && <p className="mt-1 text-sm text-danger">{form.formState.errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...form.register("password")} />
        </div>
        {formError && <p className="text-sm text-danger">{formError}</p>}
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          Log in
        </Button>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <Link href="/forgot-password" className="text-primary">Forgot password</Link>
        <Link href="/register" className="text-primary">Create profile</Link>
      </div>
      <div className="mt-6 rounded-2xl bg-muted p-4 text-sm leading-6 text-muted-foreground">
        <p className="font-medium text-foreground">Demo accounts</p>
        <p>Student: ayaan@uoh.edu.so / Student123!</p>
        <p>Admin: admin@hargeisaopportunityhub.so / Admin123!</p>
      </div>
    </AuthFrame>
  );
}

