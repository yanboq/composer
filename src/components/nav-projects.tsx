"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen, Plus } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavProjects() {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarGroupAction title="New project" render={<Link href="/templates" />}>
        <Plus />
      </SidebarGroupAction>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Projects"
            isActive={pathname === "/dashboard" || pathname.startsWith("/builder")}
            render={<Link href="/dashboard" />}
          >
            <FolderOpen />
            <span>Projects</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
