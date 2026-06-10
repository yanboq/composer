"use client";

import { Badge } from "@/components/ui/badge";

export function toolLabel(type: string) {
  return type
    .replace("tool-", "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase());
}

export type ToolPartLike = {
  type: string;
  state?: string;
  toolCallId?: string;
  output?: Record<string, unknown>;
  errorText?: string;
};

export function ToolStatusBadge({ toolPart }: { toolPart: ToolPartLike }) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-2">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {toolLabel(toolPart.type)}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {toolPart.state === "output-available"
            ? (toolPart.output?.changeSummary as string) ?? "Done"
            : toolPart.state === "output-error"
              ? toolPart.errorText ?? "Error"
              : "Working..."}
        </span>
      </div>
    </div>
  );
}
