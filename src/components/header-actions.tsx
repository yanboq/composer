"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type TitleChangeCallback = ((newTitle: string) => void) | null;

const HeaderActionsContext = createContext<{
  actions: ReactNode;
  title: string;
  onTitleChange: TitleChangeCallback;
  setActions: (actions: ReactNode) => void;
  setTitle: (title: string) => void;
  setOnTitleChange: (cb: TitleChangeCallback) => void;
}>({
  actions: null,
  title: "",
  onTitleChange: null,
  setActions: () => {},
  setTitle: () => {},
  setOnTitleChange: () => {},
});

export function HeaderActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ReactNode>(null);
  const [title, setTitle] = useState("");
  const [onTitleChange, setOnTitleChange] = useState<TitleChangeCallback>(null);

  return (
    <HeaderActionsContext.Provider
      value={{
        actions,
        title,
        onTitleChange,
        setActions,
        setTitle,
        setOnTitleChange: (cb) => setOnTitleChange(() => cb),
      }}
    >
      {children}
    </HeaderActionsContext.Provider>
  );
}

export function useHeaderActions() {
  return useContext(HeaderActionsContext);
}
