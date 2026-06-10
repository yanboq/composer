"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EmailPatch } from "@/lib/schemas";
import { toolLabel, type ToolPartLike } from "./tool-status-badge";

type EmailToolOutput = {
  patches?: EmailPatch[];
  changeSummary?: string;
  rejected?: boolean;
  targetSectionId?: string;
  targetSectionLabel?: string;
  fieldsChanged?: string[];
  requiresUserChoice?: boolean;
  optionA?: { label: string; description: string; patches: EmailPatch[] };
  optionB?: { label: string; description: string; patches: EmailPatch[] };
};

export function EmailToolCard({
  toolPart,
  onApplyPatches,
  chosenOptions,
}: {
  toolPart: ToolPartLike;
  onApplyPatches: (patches: EmailPatch[], changeSummary: string) => void;
  chosenOptions: React.RefObject<Map<string, string>>;
}) {
  const output = toolPart.output as EmailToolOutput | undefined;
  const toolCallId = toolPart.toolCallId ?? "";

  if (
    toolPart.state === "output-available" &&
    output?.requiresUserChoice &&
    output.optionA &&
    output.optionB
  ) {
    const chosen = chosenOptions.current.get(toolCallId);
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-3">
        <div className="mb-1 flex items-center gap-2">
          <Badge variant="secondary">{toolLabel(toolPart.type)}</Badge>
          {output.targetSectionId && (
            <Badge variant="outline">{output.targetSectionLabel ?? output.targetSectionId}</Badge>
          )}
        </div>
        <p className="mb-2 text-xs text-muted-foreground">{output.changeSummary}</p>
        <div className="grid grid-cols-2 gap-2">
          {(["optionA", "optionB"] as const).map((key) => {
            const option = output[key]!;
            const isChosen = chosen === key;
            const isDisabled = !!chosen && !isChosen;
            return (
              <button
                key={key}
                type="button"
                className={cn(
                  "rounded-lg border p-3 text-left text-sm transition-colors",
                  isChosen
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-muted",
                  isDisabled && "cursor-not-allowed opacity-50",
                )}
                disabled={isDisabled}
                onClick={() => {
                  if (chosen) return;
                  chosenOptions.current.set(toolCallId, key);
                  onApplyPatches(option.patches, `Chose: ${option.label}`);
                }}
              >
                <strong className="block text-sm">{option.label}</strong>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/50 p-3">
      <div className="mb-1 flex items-center gap-2">
        <Badge variant="secondary">{toolLabel(toolPart.type)}</Badge>
        {output?.targetSectionId && toolPart.state === "output-available" && (
          <Badge variant="outline">{output.targetSectionLabel ?? output.targetSectionId}</Badge>
        )}
      </div>
      {output?.fieldsChanged && output.fieldsChanged.length > 0 && toolPart.state === "output-available" && (
        <p className="mb-1 text-xs text-muted-foreground">{output.fieldsChanged.join(", ")}</p>
      )}
      <p className="text-xs text-muted-foreground">
        {toolPart.state === "output-available"
          ? output?.changeSummary ?? "Done"
          : toolPart.state === "output-error"
            ? toolPart.errorText ?? "Tool error"
            : "Working..."}
      </p>
    </div>
  );
}
