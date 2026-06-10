"use client";

import { composeReactEmail } from "@react-email/editor/core";
import { StarterKit } from "@react-email/editor/extensions";
import {
  EDITOR_THEMES,
  EmailTheming,
  extendTheme,
  getEmailTheming,
  imageSlashCommand,
  setCurrentTheme,
  setGlobalStyles,
  themeStylesToPanelOverrides,
  useEditorImage,
  type PanelGroup,
  type ThemeComponentStyles,
} from "@react-email/editor/plugins";
import {
  BubbleMenu,
  defaultSlashCommands,
  Inspector,
  SlashCommand,
} from "@react-email/editor/ui";
import type { Editor } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { brandThemeKey, createBrandThemeStyles, type EditorThemeBase } from "@/lib/brand-theme";
import {
  editorOperationsPatchValueSchema,
  type BrandProfile,
  type EmailPatch,
  type EmailProject,
  type ThemeOperation,
} from "@/lib/schemas";

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function InspectorSidebar() {
  return (
    <aside className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto border-l bg-background p-3 text-xs">
      <Inspector.Root>
        <nav>
          <ol className="mb-4 flex list-none items-center gap-1 p-0">
            <Inspector.Breadcrumb>
              {(segments) =>
                segments.map((segment, index) => {
                  const label = segment.node?.nodeType ?? "Layout";
                  const isLast = index === segments.length - 1;

                  return (
                    <li key={`${label}-${index}`} className="flex min-w-0 items-center gap-1">
                      {index !== 0 ? <span className="text-muted-foreground">/</span> : null}
                      {isLast ? (
                        <span className="truncate capitalize text-foreground">{label}</span>
                      ) : (
                        <button
                          type="button"
                          className="truncate bg-transparent p-0 capitalize text-muted-foreground hover:text-foreground"
                          onClick={() => segment.focus()}
                        >
                          {label}
                        </button>
                      )}
                    </li>
                  );
                })
              }
            </Inspector.Breadcrumb>
          </ol>
        </nav>
        <Inspector.Document />
        <Inspector.Node />
        <Inspector.Text />
      </Inspector.Root>
    </aside>
  );
}

export function ReactEmailEditorClient({
  content,
  brandProfile,
  onSnapshot,
  onRegisterPatchBridge,
}: {
  content: EmailProject["editorDocument"];
  brandProfile: BrandProfile;
  onSnapshot: (snapshot: {
    editorDocument: EmailProject["editorDocument"];
    html?: string;
    text?: string;
    shouldIncrementVersion?: boolean;
  }) => void;
  onRegisterPatchBridge?: (
    bridge:
      | ((
          document: EmailProject["editorDocument"],
          brandProfile: BrandProfile,
          patches: EmailPatch[],
        ) => Promise<{
          editorDocument: EmailProject["editorDocument"];
          html?: string;
          text?: string;
        }>)
      | null,
  ) => void;
}) {
  const theme: EditorThemeBase = "basic";
  const composingRef = useRef(false);
  const internalMutationRef = useRef(false);
  const appliedBrandThemeKey = useRef("");
  const imageExtension = useEditorImage({
    uploadImage: async (file) => ({ url: await readFileAsDataUrl(file) }),
  });
  const brandStyles = useMemo(
    () => createBrandThemeStyles(brandProfile) as ThemeComponentStyles,
    [brandProfile],
  );
  const brandTheme = useMemo(
    () => extendTheme(theme, brandStyles),
    [brandStyles, theme],
  );
  const brandPanelStyles = useMemo(
    () => themeStylesToPanelOverrides(brandStyles, EDITOR_THEMES[theme]),
    [brandStyles, theme],
  );

  const slashCommands = useMemo(
    () => [...defaultSlashCommands, imageSlashCommand],
    [],
  );
  const extensions = useMemo(
    () => [
      StarterKit.configure(),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return `Heading ${node.attrs.level}`;
          }
          return "Press '/' for commands";
        },
        includeChildren: true,
      }),
      EmailTheming.configure({ theme: brandTheme }),
      imageExtension,
    ],
    [brandTheme, imageExtension],
  );

  const emitSnapshot = useCallback(
    async (editor: Editor, shouldIncrementVersion: boolean) => {
      if (composingRef.current) {
        return;
      }

      const editorDocument = editor.getJSON() as EmailProject["editorDocument"];
      try {
        composingRef.current = true;
        const email = await composeReactEmail({ editor });
        onSnapshot({
          editorDocument,
          html: email.unformattedHtml || email.html,
          text: email.text,
          shouldIncrementVersion,
        });
      } catch {
      onSnapshot({ editorDocument, shouldIncrementVersion });
      } finally {
        composingRef.current = false;
      }
    },
    [onSnapshot],
  );

  function applyThemeOperationsToStyles(styles: PanelGroup[], operations: ThemeOperation[]) {
    if (operations.length === 0) return styles;
    const grouped = operations.reduce<Record<string, Record<string, string | number>>>(
      (acc, operation) => {
        acc[operation.component] = {
          ...(acc[operation.component] ?? {}),
          ...operation.styles,
        };
        return acc;
      },
      {},
    );

    return themeStylesToPanelOverrides(grouped as ThemeComponentStyles, styles);
  }

  const editor = useEditor(
    {
      extensions,
      content,
      immediatelyRender: false,
      onCreate: ({ editor }) => {
        void emitSnapshot(editor, false);
      },
      onUpdate: ({ editor }) => {
        if (internalMutationRef.current) {
          return;
        }
        void emitSnapshot(editor, true);
      },
    },
    [extensions],
  );

  useEffect(() => {
    if (!editor) return;
    const nextKey = brandThemeKey(brandProfile, theme);
    if (appliedBrandThemeKey.current === nextKey) return;

    appliedBrandThemeKey.current = nextKey;
    internalMutationRef.current = true;
    setCurrentTheme(editor, theme);
    setGlobalStyles(editor, brandPanelStyles);
    internalMutationRef.current = false;
    void emitSnapshot(editor, false);
  }, [brandPanelStyles, brandProfile, editor, emitSnapshot, theme]);

  useEffect(() => {
    if (!editor || !onRegisterPatchBridge) return;

    onRegisterPatchBridge(async (document, nextBrandProfile, patches) => {
      let nextDocument = document;
      let nextStyles = getEmailTheming(editor).styles;
      const hasBrandChange = patches.some((patch) => patch.op === "setBrandProfile");

      for (const patch of patches) {
        if (patch.op !== "applyEditorOperations") continue;
        const parsed = editorOperationsPatchValueSchema.parse(patch.value);
        nextStyles = applyThemeOperationsToStyles(nextStyles, parsed.themeOperations ?? []);
      }

      internalMutationRef.current = true;
      editor.commands.setContent(nextDocument);
      if (hasBrandChange) {
        setCurrentTheme(editor, theme);
        nextStyles = themeStylesToPanelOverrides(
          createBrandThemeStyles(nextBrandProfile) as ThemeComponentStyles,
          EDITOR_THEMES[theme],
        );
      }
      if (patches.some((patch) => patch.op === "applyEditorOperations")) {
        setGlobalStyles(editor, nextStyles);
      }
      internalMutationRef.current = false;

      const email = await composeReactEmail({ editor });
      return {
        editorDocument: editor.getJSON() as EmailProject["editorDocument"],
        html: email.unformattedHtml || email.html,
        text: email.text,
      };
    });

    return () => onRegisterPatchBridge(null);
  }, [editor, onRegisterPatchBridge]);

  if (!editor) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading editor...
      </div>
    );
  }

  return (
    <EditorContext.Provider value={{ editor }}>
      <div className="react-email-full-builder flex h-full min-h-0 flex-col bg-muted/20">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="min-w-0 flex-1 overflow-y-auto p-4">
            <EditorContent className="react-email-editor mx-auto max-w-4xl rounded-md bg-white" editor={editor} />
            <BubbleMenu
              hideWhenActiveNodes={["button", "horizontalRule"]}
              hideWhenActiveMarks={["link"]}
            />
            <BubbleMenu.LinkDefault />
            <BubbleMenu.ButtonDefault />
            <BubbleMenu.ImageDefault />
            <SlashCommand items={slashCommands} />
          </div>
          <InspectorSidebar />
        </div>
      </div>
    </EditorContext.Provider>
  );
}
