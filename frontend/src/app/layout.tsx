import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";

import { Providers } from "@/components/providers";
import { Shell } from "@/components/shell";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: { default: "HOH — Hargeisa Opportunity Hub", template: "%s · HOH" },
  description: "Scholarships, jobs, internships, courses, hackathons and more — all in one place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
