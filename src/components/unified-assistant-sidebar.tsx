"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Sparkles, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAssistant } from "./assistant-provider";
import { useBrand } from "./brand-provider";
import {
  ChatFeedbackButtons,
  ChatInput,
  ChatMessageList,
  ChatQuickActions,
  EmailToolCard,
  type ToolPartLike,
} from "./chat";
import type { EmailPatch } from "@/lib/schemas";

type ToolOutput = {
  updated?: Record<string, unknown>;
  navigateTo?: string;
  patches?: EmailPatch[];
  changeSummary?: string;
  rejected?: boolean;
  requiresUserChoice?: boolean;
};

const BRAND_QUICK_ACTIONS = [
  { label: "Scan my website", text: "I'd like to set up my brand by scanning my website." },
  { label: "Set brand manually", text: "Help me set up my brand colors, name, and logo manually." },
  { label: "What can you help with?", text: "What can you help me with?" },
];

const PROJECT_QUICK_ACTIONS = [
  { label: "Make premium", text: "Make this email feel premium and high-end." },
  { label: "Add urgency", text: "Add urgency to the copy with a deadline or limited availability." },
  { label: "Shorten", text: "Shorten the email. Keep it concise." },
  { label: "Add testimonial", text: "Add a testimonial section with a customer quote." },
  { label: "Apply brand", text: "Apply the saved brand settings to this email." },
  { label: "Create options", text: "Create two alternative versions of the hero section for me to choose from." },
];

function collectToolCallIds(messages: UIMessage[] | undefined) {
  const ids = new Set<string>();
  for (const message of messages ?? []) {
    for (const part of message.parts as Array<Record<string, unknown>>) {
      if (typeof part.type !== "string" || !part.type.startsWith("tool-")) continue;
      const toolCallId =
        typeof part.toolCallId === "string" ? part.toolCallId : `${message.id}:${part.type}`;
      ids.add(toolCallId);
    }
  }
  return ids;
}

function isBrandIntent(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes("apply") && lower.includes("brand") && lower.includes("email")) {
    return false;
  }

  return [
    "scan my website",
    "scan website",
    "scrape",
    "set up my brand",
    "setup my brand",
    "configure my brand",
    "brand profile",
    "brand name",
    "logo url",
    "website url",
    "font preset",
    "sender email",
    "sender name",
    "default footer",
    "sync brand",
    "update my brand",
    "change my brand",
  ].some((phrase) => lower.includes(phrase));
}

export function UnifiedAssistantSidebar() {
  const [loadedBrandHistory, setLoadedBrandHistory] = useState(false);
  const [scope, setScope] = useState<"brand" | "project">("brand");
  const [feedbackMap, setFeedbackMap] = useState<Record<string, "up" | "down">>({});
  const [showSyncPrompt, setShowSyncPrompt] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const handledBrandToolCalls = useRef(new Set<string>());
  const appliedToolCalls = useRef(new Set<string>());
  const chosenOptions = useRef(new Map<string, string>());
  const { activeProject, assistantVisible } = useAssistant();
  const activeProjectRef = useRef(activeProject);
  const router = useRouter();
  const { brand, brandEmpty, refreshBrand } = useBrand();

  activeProjectRef.current = activeProject;

  const brandTransport = useMemo(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: "/api/global-chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: { messages },
        }),
      }),
    [],
  );

  const projectTransport = useMemo(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages }) => {
          const current = activeProjectRef.current;
          if (!current) {
            return { body: { messages } };
          }

          return {
            body: {
              projectId: current.project.id,
              messages,
              projectSnapshot: current.project,
              brandProfile: brand ?? current.project.brandProfile,
            },
          };
        },
      }),
    [brand],
  );

  const brandChat = useChat({
    id: "brand-assistant",
    transport: brandTransport,
  });

  const projectChat = useChat({
    id: activeProject ? `project-${activeProject.project.id}` : "project-none",
    transport: projectTransport,
    messages: activeProject?.initialMessages as UIMessage[] | undefined,
  });

  useEffect(() => {
    if (activeProject) {
      setScope("project");
      appliedToolCalls.current = collectToolCallIds(activeProject.initialMessages as UIMessage[] | undefined);
      chosenOptions.current = new Map();
    } else {
      setScope("brand");
      appliedToolCalls.current = new Set();
      chosenOptions.current = new Map();
    }
  }, [activeProject?.project.id]);

  useEffect(() => {
    if (loadedBrandHistory) return;
    fetch("/api/global-chat")
      .then((r) => r.json())
      .then((data: { messages?: unknown[] }) => {
        if (data.messages?.length) {
          const messages = data.messages as UIMessage[];
          handledBrandToolCalls.current = collectToolCallIds(messages);
          brandChat.setMessages(messages);
        }
      })
      .catch(() => {})
      .finally(() => setLoadedBrandHistory(true));
  }, [brandChat.setMessages, loadedBrandHistory]);

  useEffect(() => {
    for (const message of brandChat.messages) {
      for (const part of message.parts as Array<Record<string, unknown>>) {
        if (typeof part.type !== "string" || !part.type.startsWith("tool-")) continue;
        if (part.state !== "output-available") continue;

        const toolCallId =
          typeof part.toolCallId === "string" ? part.toolCallId : `${message.id}:${part.type}`;
        if (handledBrandToolCalls.current.has(toolCallId)) continue;
        handledBrandToolCalls.current.add(toolCallId);

        const output = part.output as ToolOutput | undefined;
        if (!output) continue;

        if (output.navigateTo) {
          router.push(output.navigateTo);
        }

        if (output.updated) {
          refreshBrand();
          setShowSyncPrompt(true);
        }
      }
    }
  }, [brandChat.messages, router, refreshBrand]);

  useEffect(() => {
    if (!activeProject) return;

    for (const message of projectChat.messages) {
      for (const part of message.parts as Array<Record<string, unknown>>) {
        if (typeof part.type !== "string" || !part.type.startsWith("tool-")) continue;
        if (part.state !== "output-available") continue;

        const toolCallId =
          typeof part.toolCallId === "string" ? part.toolCallId : `${message.id}:${part.type}`;
        if (appliedToolCalls.current.has(toolCallId)) continue;

        const output = part.output as ToolOutput | undefined;
        if (output?.requiresUserChoice) continue;
        if (output?.patches?.length && !output.rejected) {
          appliedToolCalls.current.add(toolCallId);
          activeProject.onApplyPatches(output.patches, output.changeSummary ?? "Applied agent patch.");
        }
      }
    }
  }, [activeProject, projectChat.messages]);

  function handleFeedback(messageId: string, score: "up" | "down", messageText: string) {
    setFeedbackMap((prev) => ({ ...prev, [messageId]: score }));
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, messageText, score: score === "up" ? 1 : 0 }),
    }).catch(() => {});
  }

  async function handleSyncAll() {
    setSyncing(true);
    try {
      await fetch("/api/brand/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch {}
    setSyncing(false);
    setShowSyncPrompt(false);
  }

  function sendProjectMessage(text: string) {
    if (!activeProject || projectChat.status !== "ready") return;
    setScope("project");
    projectChat.sendMessage({ text });
  }

  function sendBrandMessage(text: string) {
    if (brandChat.status !== "ready") return;
    setScope("brand");
    brandChat.sendMessage({ text });
  }

  function handleSend(text: string) {
    if (activeProject && !isBrandIntent(text)) {
      sendProjectMessage(text);
      return;
    }

    sendBrandMessage(text);
  }

  function handleQuickAction(text: string) {
    if (activeProject && scope === "project") {
      sendProjectMessage(text);
      return;
    }

    sendBrandMessage(text);
  }

  const renderEmailToolPart = useCallback(
    (part: ToolPartLike) => (
      <EmailToolCard
        toolPart={part}
        chosenOptions={chosenOptions}
        onApplyPatches={(patches, changeSummary) => {
          activeProjectRef.current?.onApplyPatches(patches, changeSummary);
        }}
      />
    ),
    [],
  );

  const renderMessageFooter = useCallback(
    (message: UIMessage, index: number) => {
      const msgId = message.id || `msg-${index}`;
      const msgText = message.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("\n");
      return (
        <ChatFeedbackButtons
          messageId={msgId}
          messageText={msgText}
          feedback={feedbackMap[msgId]}
          onFeedback={handleFeedback}
        />
      );
    },
    [feedbackMap],
  );

  const currentChat = scope === "project" && activeProject ? projectChat : brandChat;
  const currentMessages = currentChat.messages;
  const currentStatus = currentChat.status;
  const currentError = currentChat.error;
  const currentStop = currentChat.stop;
  const currentLabel = scope === "project" && activeProject ? "Current email" : "Brand";
  const currentPlaceholder =
    scope === "project" && activeProject ? "Describe the edit you want..." : "Ask about your brand...";
  const showBrandQuickActions = scope === "brand" && brandEmpty && brandChat.messages.length === 0;
  const showProjectQuickActions = scope === "project" && !!activeProject;

  const proactiveMessage =
    showBrandQuickActions
      ? "Welcome! I can help you set up your brand. Share your website URL and I'll pull your colors, logo, and name automatically, or set things up manually."
      : undefined;

  const projectEmptyState = activeProject ? (
    <>
      <div className="rounded-lg border border-dashed border-border p-4 text-center">
        <strong className="block text-sm">Ask the agent to edit the email.</strong>
        <span className="text-xs text-muted-foreground">
          Try: Make this a premium skincare launch with 20% off.
        </span>
      </div>
      <ChatQuickActions
        actions={PROJECT_QUICK_ACTIONS}
        onAction={sendProjectMessage}
        disabled={projectChat.status !== "ready"}
      />
    </>
  ) : null;

  if (!assistantVisible) {
    return null;
  }

  return (
    <aside
      aria-label="Assistant"
      className="flex h-[360px] min-h-0 shrink-0 flex-col border-t bg-card lg:h-full lg:w-[380px] lg:border-l lg:border-t-0 xl:w-[420px]"
    >
      <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <Sparkles className="text-primary" />
        <h2 className="text-sm font-semibold">Assistant</h2>
        <Badge variant="secondary" className="ml-auto">
          {currentLabel}
        </Badge>
        {scope === "project" && activeProject?.canUndo && (
          <Button variant="ghost" size="icon-xs" onClick={activeProject.onUndo} title="Undo last change">
            <Undo2 />
          </Button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4">
        <ChatMessageList
          messages={currentMessages}
          renderToolPart={scope === "project" ? renderEmailToolPart : undefined}
          renderMessageFooter={renderMessageFooter}
          proactiveMessage={proactiveMessage}
          emptyState={scope === "project" ? projectEmptyState : undefined}
        />

        {currentError && <p className="text-xs text-destructive">{currentError.message}</p>}

        {showSyncPrompt && (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs">
            <span className="flex-1">Brand updated. Apply to existing projects?</span>
            <Button size="xs" variant="outline" disabled={syncing} onClick={handleSyncAll}>
              {syncing ? "Syncing..." : "Sync all"}
            </Button>
            <Button size="xs" variant="ghost" onClick={() => setShowSyncPrompt(false)}>
              Skip
            </Button>
          </div>
        )}

        {showBrandQuickActions && (
          <ChatQuickActions
            actions={BRAND_QUICK_ACTIONS}
            onAction={handleQuickAction}
            disabled={brandChat.status !== "ready"}
          />
        )}

        {showProjectQuickActions && projectChat.messages.length > 0 && projectChat.status === "ready" && (
          <ChatQuickActions actions={PROJECT_QUICK_ACTIONS} onAction={sendProjectMessage} limit={4} />
        )}

        <ChatInput
          status={currentStatus}
          onSend={handleSend}
          onStop={currentStop}
          placeholder={currentPlaceholder}
        />
      </div>
    </aside>
  );
}
