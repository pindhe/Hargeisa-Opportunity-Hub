"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import type { Opportunity } from "@/lib/types";
import Link from "next/link";

export function AiFab() {
  const { user, token } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string; opportunities?: Opportunity[] }[]>([
    {
      role: "assistant",
      content:
        "I am HOH AI. Ask me about scholarships, internships, deadlines or eligibility. I only answer from opportunities stored on this platform.",
    },
  ]);

  if (!user) return null;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !token) return;
    const text = message.trim();
    setMessage("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    try {
      const data = await api<{ reply: string; opportunities: Opportunity[] }>("/api/ai/chat", {
        method: "POST",
        token,
        body: JSON.stringify({ message: text }),
      });
      setMessages((m) => [...m, { role: "assistant", content: data.reply, opportunities: data.opportunities }]);
    } catch (error) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: error instanceof Error ? error.message : "Something went wrong. Please try again." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg md:bottom-6"
      >
        <Sparkles className="h-4 w-4" />
        {t("askAi")}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-navy/40 p-0 md:p-6">
          <div className="flex h-[85vh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-2xl md:h-[80vh] md:rounded-3xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <p className="font-semibold text-navy">HOH AI</p>
                <p className="text-xs text-slate-500">Answers use platform opportunity data only</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-2 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5 text-sm">
              {messages.map((msg, idx) => (
                <div key={idx} className={msg.role === "user" ? "ml-8 rounded-2xl bg-primary px-4 py-3 text-white" : "mr-6 rounded-2xl bg-slate-100 px-4 py-3 text-slate-800"}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.opportunities?.length ? (
                    <ul className="mt-3 space-y-1">
                      {msg.opportunities.slice(0, 5).map((o) => (
                        <li key={o.id}>
                          <Link href={`/opportunities/${o.slug}`} className="font-medium text-primary underline">
                            {o.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
              {busy ? <p className="text-slate-500">HOH AI is thinking…</p> : null}
            </div>
            <form onSubmit={send} className="border-t p-4">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Find scholarships for Software Engineering students."
                className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:border-accent"
              />
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
