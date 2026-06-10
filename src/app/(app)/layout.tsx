import type { Metadata } from "next";
import { OptionalClerkProvider } from "@/components/clerk-wrapper";
import { Geist } from "next/font/google";
import { AssistantProvider } from "@/components/assistant-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { BrandProvider } from "@/components/brand-provider";
import { HeaderActionsProvider } from "@/components/header-actions";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UnifiedAssistantSidebar } from "@/components/unified-assistant-sidebar";
import { cn } from "@/lib/utils";
import "../globals.css";
import "@react-email/editor/themes/default.css";
import "@react-email/editor/styles/bubble-menu.css";
import "@react-email/editor/styles/slash-command.css";
import "@react-email/editor/styles/inspector.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Composer — Agentic Email Editor",
  description: "Conversational React Email builder for ecommerce campaigns.",
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <BrandProvider>
        <AssistantProvider>
          <SidebarProvider>
            <HeaderActionsProvider>
              <AppSidebar />
              <SidebarInset className="h-svh overflow-hidden">
                <SiteHeader />
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
                  <main className="min-h-0 min-w-0 flex-1 overflow-auto">{children}</main>
                  <UnifiedAssistantSidebar />
                </div>
              </SidebarInset>
            </HeaderActionsProvider>
          </SidebarProvider>
        </AssistantProvider>
      </BrandProvider>
    </TooltipProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body>
        <OptionalClerkProvider>
          <Shell>{children}</Shell>
        </OptionalClerkProvider>
      </body>
    </html>
  );
}
