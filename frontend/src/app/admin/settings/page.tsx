"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { api } from "@/lib/api";

type Settings = { site_name: string; support_email: string; announcement: string };

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const settings = useQuery({ queryKey: ["settings"], queryFn: async () => (await api.get<Settings>("/api/admin/settings")).data });
  const [form, setForm] = useState<Settings>({ site_name: "", support_email: "", announcement: "" });
  useEffect(() => {
    if (settings.data) setForm(settings.data);
  }, [settings.data]);
  return (
    <div>
      <h1 className="font-display text-4xl">Settings</h1>
      <form
        className="mt-4 max-w-xl space-y-3 rounded-3xl border border-border bg-card p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          await api.put("/api/admin/settings", form);
          void queryClient.invalidateQueries({ queryKey: ["settings"] });
        }}
      >
        <div><Label>Site name</Label><Input value={form.site_name} onChange={(event) => setForm({ ...form, site_name: event.target.value })} /></div>
        <div><Label>Support email</Label><Input value={form.support_email} onChange={(event) => setForm({ ...form, support_email: event.target.value })} /></div>
        <div><Label>Announcement</Label><Textarea value={form.announcement} onChange={(event) => setForm({ ...form, announcement: event.target.value })} placeholder="Shown on the home page when set" /></div>
        <Button type="submit">Save settings</Button>
      </form>
    </div>
  );
}
