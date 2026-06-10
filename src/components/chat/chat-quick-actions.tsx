"use client";

import { Button } from "@/components/ui/button";

export type QuickAction = {
  label: string;
  text: string;
};

export type ChatQuickActionsProps = {
  actions: QuickAction[];
  onAction: (text: string) => void;
  disabled?: boolean;
  limit?: number;
};

export function ChatQuickActions({
  actions,
  onAction,
  disabled,
  limit,
}: ChatQuickActionsProps) {
  const visible = limit ? actions.slice(0, limit) : actions;

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          size="xs"
          disabled={disabled}
          onClick={() => onAction(action.text)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
