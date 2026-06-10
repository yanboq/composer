"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { EmailPatch, EmailProject } from "@/lib/schemas";

export type ProjectAssistantState = {
  project: EmailProject;
  initialMessages?: unknown[];
  canUndo?: boolean;
  onUndo?: () => void;
  onApplyPatches: (patches: EmailPatch[], changeSummary: string) => void | Promise<void>;
};

type AssistantContextValue = {
  activeProject: ProjectAssistantState | null;
  assistantVisible: boolean;
  setActiveProject: (state: ProjectAssistantState | null) => void;
  setAssistantVisible: (visible: boolean) => void;
};

const AssistantContext = createContext<AssistantContextValue>({
  activeProject: null,
  assistantVisible: true,
  setActiveProject: () => {},
  setAssistantVisible: () => {},
});

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [activeProject, setActiveProject] = useState<ProjectAssistantState | null>(null);
  const [assistantVisible, setAssistantVisible] = useState(true);

  return (
    <AssistantContext
      value={{
        activeProject,
        assistantVisible,
        setActiveProject,
        setAssistantVisible,
      }}
    >
      {children}
    </AssistantContext>
  );
}

export function useAssistant() {
  return useContext(AssistantContext);
}
