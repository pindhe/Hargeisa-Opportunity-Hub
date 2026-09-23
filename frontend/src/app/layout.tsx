import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import Script from "next/script";

import { Providers } from "@/components/providers";
import { Shell } from "@/components/shell";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: { default: "HOH — Hargeisa Opportunity Hub", template: "%s · HOH" },
  description: "Scholarships, jobs, internships, courses, hackathons and more — all in one place.",
  icons: { icon: "/tablogo.png", shortcut: "/tablogo.png", apple: "/tablogo.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${display.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground">
        <Script id="hoh-theme" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem("hoh-theme");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`}
        </Script>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
