import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import "../globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Composer — Open Source Agentic Email Editor",
  description:
    "Build beautiful, brand-consistent emails through natural conversation. Powered by AI agents, built on React Email.",
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const content = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
    <ClerkProvider>{children}</ClerkProvider>
  ) : (
    children
  );

  return (
    <html lang="en" className={cn("font-sans antialiased", geist.variable)} suppressHydrationWarning>
      <body>{content}</body>
    </html>
  );
}
