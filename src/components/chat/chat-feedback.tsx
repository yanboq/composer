"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatFeedbackButtons({
  messageId,
  messageText,
  feedback,
  onFeedback,
}: {
  messageId: string;
  messageText: string;
  feedback: "up" | "down" | undefined;
  onFeedback: (messageId: string, score: "up" | "down", messageText: string) => void;
}) {
  return (
    <div className="feedback-buttons">
      <button
        type="button"
        className={cn("feedback-btn", feedback === "up" && "active")}
        disabled={!!feedback}
        onClick={() => onFeedback(messageId, "up", messageText)}
        title="Good response"
      >
        <ThumbsUp size={14} />
      </button>
      <button
        type="button"
        className={cn("feedback-btn", feedback === "down" && "active")}
        disabled={!!feedback}
        onClick={() => onFeedback(messageId, "down", messageText)}
        title="Bad response"
      >
        <ThumbsDown size={14} />
      </button>
    </div>
  );
}
