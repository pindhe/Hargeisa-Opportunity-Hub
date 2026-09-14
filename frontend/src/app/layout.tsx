import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Hargeisa Opportunity Hub",
    template: "%s | Hargeisa Opportunity Hub",
  },
  description:
    "Discover scholarships, internships, jobs, courses, competitions and training opportunities for students and young professionals in Hargeisa, Somaliland.",
  openGraph: {
    title: "Hargeisa Opportunity Hub",
    description: "Discover Opportunities. Build Your Future.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hargeisa Opportunity Hub",
    description: "Discover Opportunities. Build Your Future.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background font-sans text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
