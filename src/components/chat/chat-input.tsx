"use client";

import { SendHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export type ChatInputProps = {
  status: string;
  onSend: (text: string) => void;
  onStop: () => void;
  placeholder?: string;
};

export function ChatInput({
  status,
  onSend,
  onStop,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const isReady = status === "ready";
  const isBusy = status === "submitted" || status === "streaming";

  function send() {
    if (!input.trim() || !isReady) return;
    onSend(input.trim());
    setInput("");
  }

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        placeholder={placeholder}
        disabled={!isReady}
        className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        rows={2}
      />
      {isBusy ? (
        <Button type="button" variant="outline" size="icon" onClick={onStop}>
          &times;
        </Button>
      ) : (
        <Button type="submit" size="icon" disabled={!input.trim() || !isReady}>
          <SendHorizontal />
        </Button>
      )}
    </form>
  );
}
