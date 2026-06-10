"use client";

import { useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";

export function SidebarCollapse() {
  const { setOpen } = useSidebar();

  useEffect(() => {
    setOpen(false);
    return () => setOpen(true);
  }, [setOpen]);

  return null;
}
