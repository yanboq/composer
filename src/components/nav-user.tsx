"use client";

import dynamic from "next/dynamic";
import { User } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const ClerkUser = dynamic(
  () => import("./clerk-user").then((mod) => mod.ClerkUser),
  {
    ssr: false,
    loading: () => (
      <SidebarMenuItem>
        <SidebarMenuButton disabled>
          <User />
          <span>Loading...</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ),
  },
);

export function NavUser() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Dev user" disabled>
            <User />
            <span>Dev user</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <ClerkUser />
    </SidebarMenu>
  );
}
