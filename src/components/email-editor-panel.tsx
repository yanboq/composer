"use client";

import dynamic from "next/dynamic";
import type { EmailPatch, EmailProject } from "@/lib/schemas";

const ReactEmailEditorClient = dynamic(
  () =>
    import("./react-email-editor-client").then((module) => module.ReactEmailEditorClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading editor...
      </div>
    ),
  },
);

export function EmailEditorPanel({
  project,
  editorKey,
  onEditorSnapshot,
  onRegisterPatchBridge,
}: {
  project: EmailProject;
  editorKey: number;
  onEditorSnapshot: (snapshot: {
    editorDocument: EmailProject["editorDocument"];
    html?: string;
    text?: string;
    shouldIncrementVersion?: boolean;
  }) => void;
  onRegisterPatchBridge?: (
    bridge:
      | ((
          document: EmailProject["editorDocument"],
          brandProfile: EmailProject["brandProfile"],
          patches: EmailPatch[],
        ) => Promise<{
          editorDocument: EmailProject["editorDocument"];
          html?: string;
          text?: string;
        }>)
      | null,
  ) => void;
}) {
  return (
    <ReactEmailEditorClient
      key={`${project.id}-${editorKey}`}
      content={project.editorDocument}
      brandProfile={project.brandProfile}
      onSnapshot={onEditorSnapshot}
      onRegisterPatchBridge={onRegisterPatchBridge}
    />
  );
}
