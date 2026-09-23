"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { api, errorMessage } from "@/lib/api";

const schema = z.object({
  title: z.string().min(2, "Add a title"),
  message: z.string().min(2, "Add a message"),
  type: z.string(),
  user_email: z.string().optional(),
});

const types = [
  ["SYSTEM", "Update"],
  ["NEW_OPPORTUNITY", "New listing"],
  ["RECOMMENDATION", "Match"],
  ["DEADLINE", "Deadline"],
  ["APPLICATION", "Application"],
];

export default function AdminNotificationsPage() {
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", message: "", type: "SYSTEM", user_email: "" },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">People</p>
      <h1 className="mt-1 font-display text-4xl tracking-tight">Notifications</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        Send a notice to one account, or leave the email empty to reach every student, graduate, and professional.
      </p>
      <form
        className="mt-6 space-y-4 rounded-[1.4rem] border border-border bg-card p-6"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            const response = await api.post<{ message: string }>("/api/admin/notifications", { ...values, user_email: values.user_email || null });
            setFailed(false);
            setMessage(response.data.message);
            form.reset({ title: "", message: "", type: "SYSTEM", user_email: "" });
          } catch (error) {
            setFailed(true);
            setMessage(errorMessage(error));
          }
        })}
      >
        <div>
          <Label>Title</Label>
          <Input {...form.register("title")} placeholder="A new scholarship is open" />
          {form.formState.errors.title && <p className="mt-1 text-sm text-danger">{form.formState.errors.title.message}</p>}
        </div>
        <div>
          <Label>Message</Label>
          <Textarea {...form.register("message")} placeholder="What should they do next?" />
          {form.formState.errors.message && <p className="mt-1 text-sm text-danger">{form.formState.errors.message.message}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Type</Label>
            <Select {...form.register("type")}>
              {types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </div>
          <div>
            <Label>One email</Label>
            <Input {...form.register("user_email")} placeholder="Optional" />
          </div>
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>Send notification</Button>
        {message && <p className={failed ? "text-sm text-danger" : "text-sm text-primary"}>{message}</p>}
      </form>
    </div>
  );
}
