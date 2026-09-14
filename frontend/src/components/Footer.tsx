"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-auto border-t border-slate-200 bg-navy text-blue-100">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-lg font-semibold text-white">{t("brand")}</p>
          <p className="mt-3 max-w-md text-sm leading-6">{t("footerAbout")}</p>
          <p className="mt-4 text-sm text-blue-200">{t("altTagline")}</p>
        </div>
        <div>
          <p className="font-semibold text-white">Explore</p>
          <div className="mt-3 space-y-2 text-sm">
            <Link href="/scholarships" className="block hover:text-white">{t("scholarships")}</Link>
            <Link href="/internships" className="block hover:text-white">{t("internships")}</Link>
            <Link href="/jobs" className="block hover:text-white">{t("jobs")}</Link>
            <Link href="/courses" className="block hover:text-white">{t("courses")}</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold text-white">HOH</p>
          <div className="mt-3 space-y-2 text-sm">
            <Link href="/about" className="block hover:text-white">{t("about")}</Link>
            <Link href="/register" className="block hover:text-white">{t("createAccount")}</Link>
            <Link href="/opportunities" className="block hover:text-white">{t("explore")}</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-blue-200">
        © {new Date().getFullYear()} Hargeisa Opportunity Hub
      </div>
    </footer>
  );
}
