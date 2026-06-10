"use client";

import { UserButton, SignInButton, useAuth } from "@clerk/nextjs";
import { LogIn, User } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function ClerkUser() {
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

export function NavUser() {
  return (
    <SidebarMenu>
      {hasClerk ? (
        <ClerkUser />
      ) : (
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Dev user" disabled>
            <User />
            <span>Dev user</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
    </SidebarMenu>
  );
}
