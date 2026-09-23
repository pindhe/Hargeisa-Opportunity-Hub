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

export default function AdminNotificationsPage() {
  const [message, setMessage] = useState("");
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", message: "", type: "SYSTEM", user_email: "" },
  });
  return (
    <div>
      <h1 className="font-display text-4xl">Send a notification</h1>
      <form
        className="mt-4 max-w-xl space-y-3 rounded-3xl border border-border bg-white p-5"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            const response = await api.post<{ message: string }>("/api/admin/notifications", { ...values, user_email: values.user_email || null });
            setMessage(response.data.message);
            form.reset();
          } catch (error) {
            setMessage(errorMessage(error));
          }
        })}
      >
        <div><Label>Title</Label><Input {...form.register("title")} />{form.formState.errors.title && <p className="text-sm text-danger">{form.formState.errors.title.message}</p>}</div>
        <div><Label>Message</Label><Textarea {...form.register("message")} />{form.formState.errors.message && <p className="text-sm text-danger">{form.formState.errors.message.message}</p>}</div>
        <div>
          <Label>Type</Label>
          <Select {...form.register("type")}>
            {["SYSTEM", "NEW_OPPORTUNITY", "RECOMMENDATION", "DEADLINE", "APPLICATION"].map((type) => <option key={type}>{type}</option>)}
          </Select>
        </div>
        <div><Label>User email, optional</Label><Input {...form.register("user_email")} placeholder="Leave empty to notify every non-admin" /></div>
        <Button type="submit">Send</Button>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </form>
    </div>
  );
}
