import type { Metadata } from "next";
import { OptionalClerkProvider } from "@/components/clerk-wrapper";
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
  return (
    <html lang="en" className={cn("font-sans antialiased", geist.variable)} suppressHydrationWarning>
      <body>
        <OptionalClerkProvider>{children}</OptionalClerkProvider>
      </body>
    </html>
  );
}
