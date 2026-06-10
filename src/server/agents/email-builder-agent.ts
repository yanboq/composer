import { createDeepSeek, type DeepSeekLanguageModelOptions } from "@ai-sdk/deepseek";
import { stepCountIs, tool } from "ai";
import { z } from "zod";
import { TracedToolLoopAgent } from "@/server/langsmith";
import { emailTemplates, createEditorDocumentFromSections } from "@/lib/templates";
import { createEditorOutline, ensureBrandStructure } from "@/lib/editor-document";
import {
  editorOperationSchema,
  editorOperationsPatchValueSchema,
  emailPatchSchema,
  emailSectionSchema,
  themeOperationSchema,
  type BrandProfile,
  type EmailProject,
} from "@/lib/schemas";

function deepseekProvider() {
  return createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
  });
}

function buildBrandPatch(project: EmailProject, brandProfile: BrandProfile) {
  const footer =
    project.sections.find((section) => section.type === "footer") ??
    ({
      id: "footer",
      type: "footer",
      body: brandProfile.defaultFooter,
    } as const);

  return [
    {
      op: "setBrandProfile",
      value: brandProfile,
    },
    {
      op: "upsertSection",
      value: {
        ...footer,
        body: brandProfile.defaultFooter,
      },
    },
    {
      op: "replaceEditorDocument",
      value: ensureBrandStructure(project.editorDocument, brandProfile, project.brandProfile),
    },
  ];
}

export function createEmailBuilderAgent({
  project,
  brandProfile,
  selectedSectionId,
}: {
  project: EmailProject;
  brandProfile: BrandProfile;
  selectedSectionId?: string;
}) {
  const deepseek = deepseekProvider();
  const model = deepseek(process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash");

  return new TracedToolLoopAgent({
    id: "email-builder-agent",
    model,
    stopWhen: stepCountIs(6),
    providerOptions: {
      deepseek: {
        thinking: { type: "disabled" },
      } satisfies DeepSeekLanguageModelOptions,
    },
    instructions: `You are an agentic ecommerce email builder.

Your job is to help the user conversationally edit the current email. Be concise and action-oriented.

Rules:
- Never send campaign emails or list emails.
- Never call tools that send email. The only send-related tool is requestSendTest, which only proposes the explicit test-send request.
- Use tools for concrete email edits. Tools must return patch proposals, not raw HTML.
- Preserve ecommerce email structure: subject, preview text, sections, clear CTA, and footer.
- Prefer small validated patches that the frontend can apply and save.
- When the user asks for a new email style, call createTemplate.
- When the user asks to switch to a curated template, call selectTemplate.
- When changing copy, layout, or sections, call updateEmailPatch.
- When asked to apply brand settings, call applyBrand.
- When the user asks to compare alternatives or create options, call proposeOptions.
- Prefer updateEditorElements for edits to visible editor elements, buttons, links, images, layout blocks, or inspector-style/theme properties.
- Preserve the saved brand name, colors, and font unless the user explicitly asks to change brand identity.

Risky edits — ask the user a clarifying question before executing these changes:
1. Template replacement (selectTemplate or replaceSections with all new sections)
2. Section deletion (removeSection)
3. Ambiguous target (request could apply to multiple sections)
4. Discount/offer changes (prices, codes, offer terms)
5. Footer/legal changes (footer text, compliance content)
6. Sender identity changes (senderName, senderEmail)
Only call the tool after the user confirms.

Current project:
${JSON.stringify(project, null, 2)}

Current brand:
${JSON.stringify(brandProfile, null, 2)}

Editor outline for path-based edits:
${JSON.stringify(createEditorOutline(project.editorDocument), null, 2)}

Theme style components you may update through themeOperations:
body, container, h1, h2, h3, link, image, button, codeBlock, inlineCode.${selectedSectionId ? `\n\nThe user has selected section "${selectedSectionId}". Prefer editing this section unless they specify otherwise.` : ""}`,
    tools: {
      selectTemplate: tool({
        description: "Propose switching the project to a curated template.",
        inputSchema: z.object({
          templateId: z.string(),
        }),
        execute: async ({ templateId }) => {
          const template =
            emailTemplates.find((item) => item.id === templateId) ?? emailTemplates[0];
          return {
            changeSummary: `Selected ${template.name}.`,
            patches: [
              {
                op: "setProjectFields",
                value: {
                  title: template.name,
                  templateId: template.id,
                  subject: template.subject,
                  previewText: template.previewText,
                },
              },
              {
                op: "replaceSections",
                value: template.sections,
              },
              {
                op: "replaceEditorDocument",
                value: createEditorDocumentFromSections(template.sections, brandProfile),
              },
            ],
          };
        },
      }),
      createTemplate: tool({
        description: "Propose a new ecommerce email template from a campaign type and section plan.",
        inputSchema: z.object({
          name: z.string(),
          campaignType: z.string(),
          sectionPlan: z.array(
            z.object({
              type: emailSectionSchema.shape.type,
              headline: z.string().optional(),
              body: z.string().optional(),
            }),
          ),
        }),
        execute: async ({ name, campaignType, sectionPlan }) => {
          const sections = sectionPlan.map((section, index) =>
            emailSectionSchema.parse({
              id: `${section.type}-${index + 1}`,
              type: section.type,
              eyebrow: index === 0 ? campaignType : undefined,
              headline:
                section.headline ??
                (section.type === "hero" ? `${name} customers will notice` : "A focused section"),
              body:
                section.body ??
                "Use this section to make the offer concrete, useful, and easy to act on.",
              buttonLabel: section.type === "hero" || section.type === "cta" ? "Shop now" : undefined,
              buttonUrl: section.type === "hero" || section.type === "cta" ? brandProfile.websiteUrl ?? "https://example.com" : undefined,
            }),
          );

          if (!sections.some((section) => section.type === "footer")) {
            sections.push({
              id: "footer",
              type: "footer",
              body: brandProfile.defaultFooter,
            });
          }

          return {
            changeSummary: `Created a new ${campaignType} template named ${name}.`,
            patches: [
              {
                op: "setProjectFields",
                value: {
                  title: name,
                  templateId: "agent-created",
                  subject: `${name}: a fresh offer for your customers`,
                  previewText: "A new email draft created from the conversation.",
                },
              },
              { op: "replaceSections", value: sections },
              {
                op: "replaceEditorDocument",
                value: createEditorDocumentFromSections(sections, brandProfile),
              },
            ],
          };
        },
      }),
      updateEmailPatch: tool({
        description: "Propose validated patches for copy, layout, subject, preview text, and sections.",
        inputSchema: z.object({
          projectId: z.string(),
          patches: z.array(emailPatchSchema).min(1),
          changeSummary: z.string(),
        }),
        execute: async ({ projectId, patches, changeSummary }) => {
          if (projectId !== project.id) {
            return {
              changeSummary: "Rejected patch because it targets a different project.",
              patches: [],
              rejected: true,
            };
          }

          return {
            changeSummary,
            patches: patches.map((patch) => emailPatchSchema.parse(patch)),
          };
        },
      }),
      updateEditorElements: tool({
        description:
          "Propose safe path-based edits to the full React Email editor document and inspector/theme styles.",
        inputSchema: z.object({
          projectId: z.string(),
          operations: z.array(editorOperationSchema).default([]),
          themeOperations: z.array(themeOperationSchema).optional(),
          changeSummary: z.string(),
        }),
        execute: async ({ projectId, operations, themeOperations, changeSummary }) => {
          if (projectId !== project.id) {
            return {
              changeSummary: "Rejected editor operations because they target a different project.",
              patches: [],
              rejected: true,
            };
          }

          const value = editorOperationsPatchValueSchema.parse({
            operations,
            themeOperations,
          });

          return {
            changeSummary,
            patches: [
              {
                op: "applyEditorOperations",
                value,
              },
            ],
          };
        },
      }),
      applyBrand: tool({
        description: "Propose applying saved brand settings to the current email.",
        inputSchema: z.object({
          projectId: z.string(),
          scope: z.enum(["colors", "copy", "footer", "all"]).default("all"),
        }),
        execute: async ({ projectId, scope }) => {
          if (projectId !== project.id) {
            return {
              changeSummary: "Rejected brand patch because it targets a different project.",
              patches: [],
              rejected: true,
            };
          }

          return {
            changeSummary: `Applied brand ${scope}.`,
            patches: buildBrandPatch(project, brandProfile),
          };
        },
      }),
      requestSendTest: tool({
        description: "Record an explicit request for a test email; this tool never sends email.",
        inputSchema: z.object({
          projectId: z.string(),
          to: z.string().email(),
          from: z.string().email(),
        }),
        execute: async ({ projectId, to, from }) => ({
          projectId,
          to,
          from,
          readyForExplicitTestSend: projectId === project.id,
          changeSummary:
            projectId === project.id
              ? "Test send details captured. Use the Send test button to send exactly one test email."
              : "Rejected test request because it targets a different project.",
        }),
      }),
      proposeOptions: tool({
        description: "Propose two alternative versions for the user to choose between. Do NOT apply either — wait for the user's choice.",
        inputSchema: z.object({
          projectId: z.string(),
          targetSectionId: z.string().optional(),
          optionA: z.object({
            label: z.string(),
            description: z.string(),
            patches: z.array(emailPatchSchema).min(1),
          }),
          optionB: z.object({
            label: z.string(),
            description: z.string(),
            patches: z.array(emailPatchSchema).min(1),
          }),
        }),
        execute: async ({ projectId, targetSectionId, optionA, optionB }) => {
          if (projectId !== project.id) {
            return { changeSummary: "Wrong project.", rejected: true };
          }
          return {
            changeSummary: `Proposed two options${targetSectionId ? ` for ${targetSectionId}` : ""}.`,
            requiresUserChoice: true,
            targetSectionId,
            optionA: { ...optionA, patches: optionA.patches.map((p) => emailPatchSchema.parse(p)) },
            optionB: { ...optionB, patches: optionB.patches.map((p) => emailPatchSchema.parse(p)) },
          };
        },
      }),
    },
  });
}
