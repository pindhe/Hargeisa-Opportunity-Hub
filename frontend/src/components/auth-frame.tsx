"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";

import { Logo } from "@/components/logo";
import { api } from "@/lib/api";
import type { HomePayload } from "@/lib/types";

export function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const [socialNote, setSocialNote] = useState("");
  const home = useQuery({
    queryKey: ["home"],
    queryFn: async () => (await api.get<HomePayload>("/api/home")).data,
  });
  const stats = [
    [home.data?.stats.opportunities, "Open listings"],
    [home.data?.stats.organizations, "Organizations"],
    [home.data?.stats.students, "Students"],
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative min-h-72 overflow-hidden lg:min-h-screen">
        <motion.img
          src="/bghero-straight.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,21,16,0.28)_0%,rgba(7,21,16,0.55)_70%,rgba(7,21,16,0.78)_100%)]" />
        <Link href="/" aria-label="HOH home" className="absolute top-6 left-6 z-10 lg:top-10 lg:left-10">
          <Logo tone="onDark" size="sm" />
        </Link>
        <div className="relative flex h-full items-center justify-center px-6 py-16 text-center text-white">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="max-w-md">
            <p className="text-sm font-medium tracking-[0.18em] text-emerald-100 uppercase">Hargeisa Opportunity Hub</p>
            <h2 className="mt-3 font-display text-4xl leading-tight lg:text-5xl">Find your next opportunity in Hargeisa</h2>
            <p className="mt-3 text-sm leading-6 text-white/80">Scholarships, jobs, internships, and courses, gathered in one catalogue.</p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {stats.map(([value, label]) => (
                <div key={String(label)} className="rounded-2xl border border-white/20 bg-white/10 px-2 py-3 backdrop-blur-sm">
                  <p className="font-display text-2xl">{value ?? "—"}</p>
                  <p className="mt-1 text-[11px] tracking-wide text-white/75 uppercase">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative flex items-center justify-center bg-background px-6 py-10 lg:px-12">
        <div className="pointer-events-none absolute top-0 bottom-0 left-0 hidden w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent lg:block" />
        <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="w-full max-w-md">
          <h1 className="font-display text-4xl tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setSocialNote("Continue with email. Google sign-in is not connected on this server.")} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted">
              <GoogleMark />
              Google
            </button>
            <button type="button" onClick={() => setSocialNote("Continue with email. GitHub sign-in is not connected on this server.")} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted">
              <GitHubMark />
              GitHub
            </button>
          </div>
          {socialNote && <p className="mt-3 text-sm text-muted-foreground">{socialNote}</p>}
          <div className="my-6 flex items-center gap-3 text-xs tracking-wide text-muted-foreground uppercase">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          {children}
        </motion.div>
      </section>
    </div>
  );
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.84c.85 0 1.7.12 2.5.34 1.9-1.32 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.81 0 .27.18.6.69.49A10.04 10.04 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8.1l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.2-4.1 5.5l6.3 5.3C39.2 36.4 44 31 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}
