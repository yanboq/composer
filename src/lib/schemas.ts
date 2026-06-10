import { z } from "zod";

export const brandProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  websiteUrl: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  primaryColor: z.string().default("#0f766e"),
  accentColor: z.string().default("#111827"),
  fontPreset: z.string().default("Inter"),
  voiceNotes: z.string().default("Clear, polished, and conversion-focused."),
  defaultFooter: z
    .string()
    .default("You are receiving this because you signed up for updates."),
  senderName: z.string().default("Commerce Team"),
  senderEmail: z.string().email().optional().nullable(),
});

export const emailSectionSchema = z.object({
  id: z.string(),
  type: z.enum(["hero", "text", "product", "testimonial", "offer", "cta", "footer"]),
  eyebrow: z.string().optional(),
  headline: z.string().optional(),
  body: z.string().optional(),
  buttonLabel: z.string().optional(),
  buttonUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  productName: z.string().optional(),
  price: z.string().optional(),
  quote: z.string().optional(),
  attribution: z.string().optional(),
});

export type EditorNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: EditorNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> } & Record<string, unknown>>;
  text?: string;
};

export const editorNodeSchema: z.ZodType<EditorNode> = z.lazy(() =>
  z
    .object({
      type: z.string(),
      attrs: z.record(z.string(), z.unknown()).optional(),
      content: z.array(editorNodeSchema).optional(),
      marks: z
        .array(
          z
            .object({
              type: z.string(),
              attrs: z.record(z.string(), z.unknown()).optional(),
            })
            .passthrough(),
        )
        .optional(),
      text: z.string().optional(),
    })
    .passthrough(),
);

export type EditorDocument = {
  type: "doc";
  content: EditorNode[];
};

export const editorDocumentSchema: z.ZodType<EditorDocument> = z.object({
  type: z.literal("doc"),
  content: z.array(editorNodeSchema).default([]),
});

const editorPathSchema = z.array(z.number().int().nonnegative()).default([]);

export const editorOperationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("replaceNode"),
    path: editorPathSchema,
    node: editorNodeSchema,
  }),
  z.object({
    type: z.literal("insertNode"),
    parentPath: editorPathSchema,
    index: z.number().int().nonnegative(),
    node: editorNodeSchema,
  }),
  z.object({
    type: z.literal("deleteNode"),
    path: editorPathSchema,
  }),
  z.object({
    type: z.literal("moveNode"),
    fromPath: editorPathSchema,
    toParentPath: editorPathSchema,
    index: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("setText"),
    path: editorPathSchema,
    text: z.string(),
  }),
  z.object({
    type: z.literal("setAttrs"),
    path: editorPathSchema,
    attrs: z.record(z.string(), z.unknown()),
  }),
]);

export const themeableComponentSchema = z.enum([
  "body",
  "container",
  "h1",
  "h2",
  "h3",
  "link",
  "image",
  "button",
  "codeBlock",
  "inlineCode",
]);

export const themeOperationSchema = z.object({
  component: themeableComponentSchema,
  styles: z.record(z.string(), z.union([z.string(), z.number()])),
});

export const editorOperationsPatchValueSchema = z.object({
  operations: z.array(editorOperationSchema).default([]),
  themeOperations: z.array(themeOperationSchema).optional(),
});

export const emailProjectSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  templateId: z.string().default("blank"),
  subject: z.string(),
  previewText: z.string(),
  editorDocument: editorDocumentSchema,
  sections: z.array(emailSectionSchema),
  renderedHtml: z.string().optional().nullable(),
  renderedText: z.string().optional().nullable(),
  version: z.number().int().positive(),
  brandProfile: brandProfileSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const emailPatchSchema = z.object({
  op: z.enum([
    "setProjectFields",
    "replaceSections",
    "upsertSection",
    "removeSection",
    "setBrandProfile",
    "replaceEditorDocument",
    "applyEditorOperations",
  ]),
  path: z.string().optional(),
  value: z.unknown(),
});

export const patchProposalSchema = z.object({
  patches: z.array(emailPatchSchema).min(1),
  changeSummary: z.string().min(1),
});

export const createProjectSchema = z.object({
  templateId: z.string().optional(),
  title: z.string().optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().optional(),
  templateId: z.string().optional(),
  subject: z.string().optional(),
  previewText: z.string().optional(),
  editorDocument: editorDocumentSchema.optional(),
  sections: z.array(emailSectionSchema).optional(),
  renderedHtml: z.string().optional().nullable(),
  renderedText: z.string().optional().nullable(),
  brandProfile: brandProfileSchema.partial().optional(),
  patches: z.array(emailPatchSchema).optional(),
  changeSummary: z.string().optional(),
});

export const chatRequestSchema = z.object({
  projectId: z.string(),
  messages: z.array(z.record(z.string(), z.unknown())),
  projectSnapshot: emailProjectSchema,
  brandProfile: brandProfileSchema,
  selectedSectionId: z.string().optional(),
});

export const globalChatRequestSchema = z.object({
  messages: z.array(z.record(z.string(), z.unknown())),
});

export const sendTestSchema = z.object({
  projectId: z.string(),
  to: z.string().email(),
  from: z.string().email(),
});

export const exportRequestSchema = z.object({
  projectId: z.string(),
  format: z.enum(["html", "plainText", "reactEmailSource"]).default("html"),
});

export type BrandProfile = z.infer<typeof brandProfileSchema>;
export type EmailSection = z.infer<typeof emailSectionSchema>;
export type EditorOperation = z.infer<typeof editorOperationSchema>;
export type ThemeOperation = z.infer<typeof themeOperationSchema>;
export type EditorOperationsPatchValue = z.infer<typeof editorOperationsPatchValueSchema>;
export type EmailProject = z.infer<typeof emailProjectSchema>;
export type EmailPatch = z.infer<typeof emailPatchSchema>;
export type PatchProposal = z.infer<typeof patchProposalSchema>;
