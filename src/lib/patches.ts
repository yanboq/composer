import { createEditorDocumentFromSections } from "./templates";
import { applyEditorOperationsToDocument, ensureBrandStructure } from "./editor-document";
import {
  brandProfileSchema,
  editorOperationsPatchValueSchema,
  emailPatchSchema,
  emailSectionSchema,
  type EmailPatch,
  type EmailProject,
} from "./schemas";

export function applyEmailPatches(project: EmailProject, patches: EmailPatch[]): EmailProject {
  let next: EmailProject = structuredClone(project);
  let contentChanged = false;
  let brandChanged = false;

  for (const patch of patches.map((item) => emailPatchSchema.parse(item))) {
    if (patch.op === "setProjectFields") {
      const value = patch.value as Partial<EmailProject>;
      next = {
        ...next,
        title: typeof value.title === "string" ? value.title : next.title,
        templateId: typeof value.templateId === "string" ? value.templateId : next.templateId,
        subject: typeof value.subject === "string" ? value.subject : next.subject,
        previewText: typeof value.previewText === "string" ? value.previewText : next.previewText,
      };
    }

    if (patch.op === "replaceSections") {
      const rawSections = (patch.value as Array<Record<string, unknown>>).map((s, i) => ({
        id: s.id ?? `section-${i + 1}`,
        type: s.type ?? "text",
        ...s,
      }));
      const sections = emailSectionSchema.array().parse(rawSections);
      next = {
        ...next,
        sections,
        editorDocument: createEditorDocumentFromSections(sections, next.brandProfile),
      };
      contentChanged = true;
    }

    if (patch.op === "upsertSection") {
      const raw = patch.value as Record<string, unknown>;
      const section = emailSectionSchema.parse({
        id: raw.id ?? `section-${Date.now()}`,
        type: raw.type ?? "text",
        ...raw,
      });
      const existingIndex = next.sections.findIndex((item) => item.id === section.id);
      const sections =
        existingIndex >= 0
          ? next.sections.map((item) => (item.id === section.id ? section : item))
          : [...next.sections.filter((item) => item.type !== "footer"), section, ...next.sections.filter((item) => item.type === "footer")];
      next = { ...next, sections, editorDocument: createEditorDocumentFromSections(sections, next.brandProfile) };
      contentChanged = true;
    }

    if (patch.op === "removeSection") {
      const id = typeof patch.value === "string" ? patch.value : patch.path;
      const sections = next.sections.filter((section) => section.id !== id);
      next = { ...next, sections, editorDocument: createEditorDocumentFromSections(sections, next.brandProfile) };
      contentChanged = true;
    }

    if (patch.op === "setBrandProfile") {
      const previousBrand = next.brandProfile;
      next = {
        ...next,
        brandProfile: brandProfileSchema.parse({
          ...next.brandProfile,
          ...(patch.value as Record<string, unknown>),
        }),
      };
      next = {
        ...next,
        editorDocument: ensureBrandStructure(next.editorDocument, next.brandProfile, previousBrand),
      };
      brandChanged = true;
      contentChanged = true;
    }

    if (patch.op === "replaceEditorDocument") {
      next = {
        ...next,
        editorDocument: ensureBrandStructure(
          patch.value as EmailProject["editorDocument"],
          next.brandProfile,
        ),
      };
      contentChanged = true;
    }

    if (patch.op === "applyEditorOperations") {
      editorOperationsPatchValueSchema.parse(patch.value);
      next = {
        ...next,
        editorDocument: applyEditorOperationsToDocument(
          next.editorDocument,
          patch.value,
          next.brandProfile,
        ),
      };
      contentChanged = true;
    }
  }

  if (brandChanged) {
    next.sections = next.sections.map((section) =>
      section.type === "footer" ? { ...section, body: next.brandProfile.defaultFooter } : section,
    );
  }

  return {
    ...next,
    renderedHtml: contentChanged ? null : next.renderedHtml,
    renderedText: contentChanged ? null : next.renderedText,
    version: project.version + 1,
    updatedAt: new Date().toISOString(),
  };
}
