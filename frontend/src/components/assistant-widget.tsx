"use client";

import { useMutation } from "@tanstack/react-query";
import { Send, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";
import type { Opportunity } from "@/lib/types";
import { cn } from "@/lib/utils";

type LocalMessage = { id: string; role: string; content: string; opportunities: Opportunity[] };

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const send = useMutation({
    mutationFn: async (message: string) =>
      (await api.post<{ reply: string; opportunities: Opportunity[]; conversation_id: string | null }>("/api/ai/chat", {
        message,
        conversation_id: conversationId,
      })).data,
    onSuccess: (data) => {
      setConversationId(data.conversation_id);
      setMessages((current) => [
        ...current,
        { id: `${Date.now()}-a`, role: "assistant", content: data.reply, opportunities: data.opportunities },
      ]);
    },
  });

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("hoh-open-assistant", onOpen);
    return () => window.removeEventListener("hoh-open-assistant", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, send.isPending, open]);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const message = draft.trim();
    if (!message || send.isPending) return;
    setDraft("");
    setMessages((current) => [...current, { id: `${Date.now()}-u`, role: "user", content: message, opportunities: [] }]);
    send.mutate(message);
  }

  return (
    <div className="fixed right-5 bottom-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <section className="flex h-[min(32rem,calc(100vh-7rem))] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
          <header className="flex items-center gap-3 border-b border-border px-4 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">HOH Assistant</p>
              <p className="text-xs text-muted-foreground">Approved listings only</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted" aria-label="Close chat">
              <X className="h-4 w-4" />
            </button>
          </header>
          <div className="flex-1 space-y-3 overflow-auto px-3 py-4">
            {messages.length === 0 && (
              <div className="mr-8 rounded-2xl rounded-tl-md bg-muted px-3 py-2 text-sm leading-6">
                Hello. Ask about scholarships, jobs, internships, or deadlines.
              </div>
            )}
            {messages.map((message) => (
              <div key={message.id} className={cn("max-w-[85%]", message.role === "user" ? "ml-auto" : "mr-auto")}>
                <div className={cn("rounded-2xl px-3 py-2 text-sm leading-6 whitespace-pre-wrap", message.role === "user" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-tl-md bg-muted")}>
                  {message.content}
                </div>
                {message.opportunities.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.opportunities.slice(0, 3).map((item) => (
                      <Link key={item.id} href={`/opportunities/${item.slug}`} className="block truncate rounded-xl px-2 py-1 text-xs font-medium text-primary hover:bg-muted">
                        {item.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {send.isPending && <div className="mr-auto w-fit rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">Typing…</div>}
            <div ref={endRef} />
          </div>
          <form onSubmit={submit} className="flex items-center gap-2 border-t border-border p-2">
            <input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Aa"
              aria-label="Message"
              className="h-10 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            <button type="submit" disabled={send.isPending || !draft.trim()} aria-label="Send" className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}
      <button
        type="button"
        aria-label={open ? "Close AI Assistant" : "AI Assistant"}
        onClick={() => setOpen((value) => !value)}
        className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_30px_-12px_rgba(12,107,88,0.8)]"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>
    </div>
  );
}
