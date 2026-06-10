"use client";

import { UserButton, SignInButton, useAuth } from "@clerk/nextjs";
import { LogIn, User } from "lucide-react";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function ClerkUser() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton disabled>
          <User />
          <span>Loading...</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  if (!isSignedIn) {
    return (
      <SidebarMenuItem>
        <SignInButton>
          <SidebarMenuButton tooltip="Sign in">
            <LogIn />
            <span>Sign in</span>
          </SidebarMenuButton>
        </SignInButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton className="h-10">
        <UserButton />
        <span>Account</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
