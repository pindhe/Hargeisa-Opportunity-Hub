"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";

import { AuthFrame } from "@/components/auth-frame";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const schema = z
  .object({
    full_name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirm: z.string(),
    role: z.enum(["STUDENT", "GRADUATE", "PROFESSIONAL"]),
  })
  .refine((values) => values.password === values.confirm, { path: ["confirm"], message: "Passwords do not match" });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", password: "", confirm: "", role: "STUDENT" },
  });

  return (
    <AuthFrame title="Create your profile" subtitle="After this, a short wizard tunes your feed.">
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          setFormError("");
          try {
            await registerUser({ full_name: values.full_name, email: values.email, password: values.password, role: values.role });
            router.push("/onboarding");
          } catch (error) {
            setFormError(errorMessage(error));
          }
        })}
      >
        <Field label="Full name" error={form.formState.errors.full_name?.message}>
          <Input {...form.register("full_name")} />
        </Field>
        <Field label="Email" error={form.formState.errors.email?.message}>
          <Input type="email" {...form.register("email")} />
        </Field>
        <Field label="Password" error={form.formState.errors.password?.message}>
          <Input type="password" {...form.register("password")} />
        </Field>
        <Field label="Confirm password" error={form.formState.errors.confirm?.message}>
          <Input type="password" {...form.register("confirm")} />
        </Field>
        <Field label="User type">
          <Select {...form.register("role")}>
            <option value="STUDENT">Student</option>
            <option value="GRADUATE">Graduate</option>
            <option value="PROFESSIONAL">Professional</option>
          </Select>
        </Field>
        {formError && <p className="text-sm text-danger">{formError}</p>}
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          Continue
        </Button>
      </form>
      <p className="mt-4 text-sm">
        Already registered? <Link href="/login" className="text-primary">Log in</Link>
      </p>
    </AuthFrame>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
