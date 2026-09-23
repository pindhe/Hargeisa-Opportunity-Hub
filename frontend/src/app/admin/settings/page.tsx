"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { api, errorMessage } from "@/lib/api";

type Settings = { site_name: string; support_email: string; announcement: string };

const empty: Settings = { site_name: "", support_email: "", announcement: "" };

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const settings = useQuery({ queryKey: ["settings"], queryFn: async () => (await api.get<Settings>("/api/admin/settings")).data });
  const [form, setForm] = useState<Settings>(empty);
  const [note, setNote] = useState("");
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings.data) setForm(settings.data);
  }, [settings.data]);

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">Site</p>
      <h1 className="mt-1 font-display text-4xl tracking-tight">Settings</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">The name and support address are stored with the site. The announcement, when it has text, appears as a banner on the home page.</p>

      <form
        className="mt-6 space-y-4 rounded-[1.4rem] border border-border bg-card p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          try {
            await api.put("/api/admin/settings", form);
            setFailed(false);
            setNote("Settings saved.");
            void queryClient.invalidateQueries({ queryKey: ["settings"] });
            void queryClient.invalidateQueries({ queryKey: ["home"] });
          } catch (error) {
            setFailed(true);
            setNote(errorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      >
        <div>
          <Label>Site name</Label>
          <Input value={form.site_name} onChange={(event) => setForm({ ...form, site_name: event.target.value })} />
        </div>
        <div>
          <Label>Support email</Label>
          <Input type="email" value={form.support_email} onChange={(event) => setForm({ ...form, support_email: event.target.value })} placeholder="hello@hargeisaopportunityhub.so" />
        </div>
        <div>
          <Label>Home announcement</Label>
          <Textarea value={form.announcement} onChange={(event) => setForm({ ...form, announcement: event.target.value })} placeholder="Leave empty to hide the banner" />
        </div>
        {form.announcement.trim() && (
          <div className="rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-950">
            <p className="text-xs font-semibold tracking-wide uppercase">Home banner</p>
            <p className="mt-1">{form.announcement}</p>
          </div>
        )}
        <Button type="submit" disabled={saving || settings.isLoading}>{saving ? "Saving" : "Save settings"}</Button>
        {note && <p className={failed ? "text-sm text-danger" : "text-sm text-primary"}>{note}</p>}
      </form>
    </div>
  );
}
