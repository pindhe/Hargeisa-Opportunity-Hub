"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useRef, useState } from "react";

import { OpportunityCard } from "@/components/opportunity-card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { SUGGESTED_QUESTIONS, type Conversation, type Opportunity } from "@/lib/types";
import { cn } from "@/lib/utils";

type LocalMessage = { id: string; role: string; content: string; opportunities: Opportunity[] };

export default function AssistantPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const conversations = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => (await api.get<Conversation[]>("/api/ai/conversations")).data,
    enabled: Boolean(user),
  });
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
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, send.isPending]);

  async function openConversation(id: string) {
    const response = await api.get<Conversation>(`/api/ai/conversations/${id}`);
    setConversationId(id);
    setMessages(response.data.messages ?? []);
  }

  function submit(event?: FormEvent, preset?: string) {
    event?.preventDefault();
    const message = (preset ?? draft).trim();
    if (!message || send.isPending) return;
    setDraft("");
    setMessages((current) => [...current, { id: `${Date.now()}-u`, role: "user", content: message, opportunities: [] }]);
    send.mutate(message);
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-3xl border border-border bg-card p-3">
        <div className="flex items-center justify-between px-2">
          <p className="font-semibold">History</p>
          <button type="button" className="text-xs text-primary" onClick={() => { setConversationId(null); setMessages([]); }}>New</button>
        </div>
        <div className="mt-2 space-y-1">
          {(conversations.data ?? []).map((item) => (
            <button key={item.id} type="button" onClick={() => void openConversation(item.id)} className={cn("block w-full truncate rounded-xl px-2 py-2 text-left text-sm hover:bg-muted", conversationId === item.id && "bg-accent")}>
              {item.title}
            </button>
          ))}
          {!user && <p className="px-2 py-3 text-xs text-muted-foreground">Sign in to keep conversation history.</p>}
        </div>
      </aside>
      <section className="flex min-h-[70vh] flex-col rounded-[2rem] border border-border bg-card">
        <header className="border-b border-border px-5 py-4">
          <h1 className="font-display text-2xl">HOH AI Assistant</h1>
          <p className="text-sm text-muted-foreground">Ask about approved opportunities, deadlines, and what fits your profile.</p>
        </header>
        <div className="flex-1 space-y-4 overflow-auto px-5 py-5">
          {messages.length === 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button key={question} type="button" className="rounded-2xl border border-border px-3 py-3 text-left text-sm hover:border-primary" onClick={() => submit(undefined, question)}>
                  {question}
                </button>
              ))}
            </div>
          )}
          {messages.map((message) => (
            <div key={message.id} className={cn("max-w-3xl", message.role === "user" && "ml-auto")}>
              <div className={cn("rounded-3xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap", message.role === "user" ? "bg-ink text-white" : "bg-muted")}>
                {message.content}
              </div>
              {message.opportunities.length > 0 && (
                <div className="mt-3 grid gap-3">
                  {message.opportunities.map((item) => <OpportunityCard key={item.id} opportunity={item} layout="list" />)}
                </div>
              )}
            </div>
          ))}
          {send.isPending && (
            <div className="flex w-fit items-center gap-1 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              HOH is looking through listings
            </div>
          )}
          <div ref={endRef} />
        </div>
        <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about scholarships, internships, or deadlines" className="h-12 flex-1 rounded-2xl border border-border px-4 text-sm outline-none focus:border-primary" aria-label="Message" />
          <Button type="submit" disabled={send.isPending}>Send</Button>
        </form>
      </section>
    </div>
  );
}
