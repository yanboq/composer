"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Mail, RefreshCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useHeaderActions } from "@/components/header-actions";
import { applyEmailPatches } from "@/lib/patches";
import type { EmailPatch, EmailProject } from "@/lib/schemas";
import { useAssistant } from "./assistant-provider";
import { EmailEditorPanel } from "./email-editor-panel";

export function BuilderWorkspace({
  initialProject,
  initialChatMessages,
}: {
  initialProject: EmailProject;
  initialChatMessages?: unknown[];
}) {
  const [project, setProject] = useState(initialProject);
  const [saving, setSaving] = useState(false);
  const [exportValue, setExportValue] = useState("");
  const [exportFormat, setExportFormat] = useState<"html" | "plainText" | "reactEmailSource" | null>(null);
  const [sendTo, setSendTo] = useState("");
  const [sendFrom, setSendFrom] = useState(project.brandProfile.senderEmail ?? "");
  const [status, setStatus] = useState("");
  const [undoStack, setUndoStack] = useState<EmailProject[]>([]);
  const [editorKey, setEditorKey] = useState(0);
  const editorPatchBridge = useRef<
    | ((
        document: EmailProject["editorDocument"],
        brandProfile: EmailProject["brandProfile"],
        patches: EmailPatch[],
      ) => Promise<{
        editorDocument: EmailProject["editorDocument"];
        html?: string;
        text?: string;
      }>)
    | null
  >(null);
  const { setActions, setTitle, setOnTitleChange } = useHeaderActions();
  const { setActiveProject } = useAssistant();

  useEffect(() => {
    setTitle(project.title);
    setOnTitleChange((newTitle: string) => {
      const next = { ...project, title: newTitle, updatedAt: new Date().toISOString() };
      setProject(next);
      saveProject(next, { changeSummary: `Renamed to "${newTitle}"` });
    });
    setActions(
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => saveProject(project, { changeSummary: "Synced editor export." })}
          title="Sync editor export"
        >
          <RefreshCcw />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            <Download />
            Export
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[360px]">
            <p className="px-1.5 py-1 text-xs font-medium text-muted-foreground">Export email</p>
            <DropdownMenuGroup>
              <div className="flex gap-2 p-1">
                <Button variant="outline" size="xs" onClick={() => exportProject("html")}>
                  HTML
                </Button>
                <Button variant="outline" size="xs" onClick={() => exportProject("plainText")}>
                  Text
                </Button>
                <Button variant="outline" size="xs" onClick={() => exportProject("reactEmailSource")}>
                  React
                </Button>
              </div>
            </DropdownMenuGroup>
            {exportValue && (
              <>
                <DropdownMenuSeparator />
                <div className="flex flex-col gap-2 p-1">
                  <p className="text-xs text-muted-foreground">
                    {exportFormat === "html"
                      ? "HTML export"
                      : exportFormat === "plainText"
                        ? "Plain text export"
                        : "React source export"}
                  </p>
                  <textarea
                    className="h-44 w-full resize-none rounded-md border border-border bg-muted p-2 font-mono text-xs"
                    readOnly
                    value={exportValue}
                  />
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            <Mail />
            Test
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[340px]">
            <p className="px-1.5 py-1 text-xs font-medium text-muted-foreground">Send test email</p>
            <div className="flex flex-col gap-2 p-1">
              <Input
                placeholder="recipient@example.com"
                value={sendTo}
                onChange={(event) => setSendTo(event.target.value)}
              />
              <Input
                placeholder="sender@brand.com"
                value={sendFrom}
                onChange={(event) => setSendFrom(event.target.value)}
              />
              <Button size="sm" onClick={sendTest}>
                <Mail />
                Send test
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" disabled={saving} onClick={() => saveProject(project)}>
          <Save />
          {saving ? "Saving" : "Save"}
        </Button>
      </>
    );
    return () => {
      setTitle("");
      setActions(null);
      setOnTitleChange(null);
    };
  }, [project, saving, exportValue, exportFormat, sendTo, sendFrom]);

  async function saveProject(
    nextProject: EmailProject,
    options: { patches?: EmailPatch[]; changeSummary?: string } = {},
  ) {
    setSaving(true);
    const response = await fetch(`/api/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: nextProject.title,
        templateId: nextProject.templateId,
        subject: nextProject.subject,
        previewText: nextProject.previewText,
        editorDocument: nextProject.editorDocument,
        sections: nextProject.sections,
        renderedHtml: nextProject.renderedHtml,
        renderedText: nextProject.renderedText,
        brandProfile: nextProject.brandProfile,
        patches: options.patches,
        changeSummary: options.changeSummary,
      }),
    });
    const data = (await response.json()) as { project?: EmailProject; error?: string };
    setSaving(false);

    if (data.project) {
      setProject(data.project);
      return data.project;
    }

    setStatus(data.error ?? "Unable to save project.");
    return null;
  }

  async function applyPatches(patches: EmailPatch[], changeSummary: string) {
    setUndoStack((prev) => [...prev.slice(-19), project]);
    let next = applyEmailPatches(project, patches);
    const hasEditorOperations = patches.some((patch) => patch.op === "applyEditorOperations");

    if (hasEditorOperations && editorPatchBridge.current) {
      const snapshot = await editorPatchBridge.current(
        next.editorDocument,
        next.brandProfile,
        patches,
      );
      next = {
        ...next,
        editorDocument: snapshot.editorDocument,
        renderedHtml: snapshot.html ?? next.renderedHtml,
        renderedText: snapshot.text ?? next.renderedText,
      };
    } else {
      setEditorKey((key) => key + 1);
    }

    setProject(next);
    setStatus(changeSummary);
    await saveProject(next, { patches, changeSummary });
  }

  const undoLastChange = useCallback(async () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setEditorKey((key) => key + 1);
    setProject(previous);
    setStatus("Undid last change.");
    await saveProject(previous, { changeSummary: "Undo" });
  }, [undoStack, project]);

  useEffect(() => {
    return () => setActiveProject(null);
  }, [setActiveProject]);

  useEffect(() => {
    setActiveProject({
      project,
      initialMessages: initialChatMessages,
      canUndo: undoStack.length > 0,
      onUndo: undoLastChange,
      onApplyPatches: applyPatches,
    });
  }, [
    setActiveProject,
    project,
    initialChatMessages,
    undoStack.length,
    undoLastChange,
  ]);

  async function updateEditorSnapshot(snapshot: {
    editorDocument: EmailProject["editorDocument"];
    html?: string;
    text?: string;
    shouldIncrementVersion?: boolean;
  }) {
    const shouldIncrementVersion = snapshot.shouldIncrementVersion ?? true;
    const next = {
      ...project,
      editorDocument: snapshot.editorDocument,
      renderedHtml: snapshot.html ?? project.renderedHtml,
      renderedText: snapshot.text ?? project.renderedText,
      version: shouldIncrementVersion ? project.version + 1 : project.version,
      updatedAt: shouldIncrementVersion ? new Date().toISOString() : project.updatedAt,
    };
    setProject(next);
  }

  async function exportProject(format: "html" | "plainText" | "reactEmailSource") {
    setExportFormat(format);

    if (format === "html" && project.renderedHtml) {
      setExportValue(project.renderedHtml);
      return;
    }

    if (format === "plainText" && project.renderedText) {
      setExportValue(project.renderedText);
      return;
    }

    const response = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id, format }),
    });
    const data = (await response.json()) as { value?: string; error?: string };
    setExportValue(data.value ?? data.error ?? "");
  }

  async function sendTest() {
    setStatus("Sending test...");
    const response = await fetch("/api/send-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id, to: sendTo, from: sendFrom }),
    });
    const data = (await response.json()) as { id?: string; error?: string };
    setStatus(data.id ? `Test sent: ${data.id}` : data.error ?? "Unable to send test.");
  }

  return (
    <div className="flex h-full min-h-0 p-3">
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm">Email editor</CardTitle>
            <div className="text-xs text-muted-foreground">v{project.version}</div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-0">
          <EmailEditorPanel
            project={project}
            editorKey={editorKey}
            onEditorSnapshot={updateEditorSnapshot}
            onRegisterPatchBridge={(bridge) => {
              editorPatchBridge.current = bridge;
            }}
          />
        </CardContent>
        {status && (
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            {status}
          </div>
        )}
      </Card>
    </div>
  );
}
