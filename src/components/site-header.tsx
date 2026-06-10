"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAssistant } from "@/components/assistant-provider";
import { useHeaderActions } from "@/components/header-actions";

function EditableTitle({
  title,
  onTitleChange,
}: {
  title: string;
  onTitleChange: (newTitle: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(title);
  }, [title]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.select();
    }
  }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    setEditing(false);
    if (trimmed && trimmed !== title) {
      onTitleChange(trimmed);
    } else {
      setDraft(title);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex-1 truncate rounded px-1 py-0.5 text-left text-sm font-medium hover:bg-muted"
        title="Click to rename"
      >
        {title}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") {
          setDraft(title);
          setEditing(false);
        }
      }}
      className="flex-1 rounded border border-input bg-background px-1 py-0.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  );
}

export function SiteHeader() {
  const { actions, title, onTitleChange } = useHeaderActions();
  const { assistantVisible, setAssistantVisible } = useAssistant();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card">
      <div className="flex w-full items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-1 h-4" />
        {onTitleChange ? (
          <EditableTitle title={title} onTitleChange={onTitleChange} />
        ) : title ? (
          <h1 className="flex-1 truncate text-sm font-medium">{title}</h1>
        ) : (
          <h1 className="flex-1 text-sm font-medium">Email Builder</h1>
        )}
        {actions && (
          <div className="flex items-center gap-2">{actions}</div>
        )}
        <Button
          variant={assistantVisible ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => setAssistantVisible(!assistantVisible)}
          title={assistantVisible ? "Hide assistant" : "Open assistant"}
        >
          <MessageCircle />
        </Button>
      </div>
    </header>
  );
}
