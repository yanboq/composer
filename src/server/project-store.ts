import type { Prisma } from "@/generated/prisma/client";
import { createBlankProject, createProjectFromTemplate } from "@/lib/templates";
import { ensureBrandStructure } from "@/lib/editor-document";
import {
  brandProfileSchema,
  emailProjectSchema,
  type BrandProfile,
  type EmailPatch,
  type EmailProject,
} from "@/lib/schemas";
import { getPrisma } from "./prisma";
import { getUserBrand, isBrandEmpty } from "./brand-store";

type MemoryStore = {
  projects: Map<string, EmailProject>;
  chatMessages: Map<string, unknown[]>;
};

const globalStore = globalThis as unknown as {
  memoryStore?: MemoryStore;
};

function memoryStore() {
  if (!globalStore.memoryStore) {
    globalStore.memoryStore = { projects: new Map(), chatMessages: new Map() };
  }
  return globalStore.memoryStore;
}

async function ensureUser(clerkUserId: string) {
  const prisma = getPrisma();
  if (!prisma) return null;

  return prisma.user.upsert({
    where: { clerkUserId },
    update: {},
    create: { clerkUserId },
  });
}

function serializeProject(project: EmailProject) {
  return {
    ...project,
    editorDocument: project.editorDocument as unknown as Prisma.InputJsonValue,
    sections: project.sections as unknown as Prisma.InputJsonValue,
  };
}

function fromRecord(record: {
  id: string;
  title: string;
  templateId: string;
  subject: string;
  previewText: string;
  editorDocument: Prisma.JsonValue;
  renderedHtml: string | null;
  renderedText: string | null;
  sections: Prisma.JsonValue;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  brandProfile: {
    id: string;
    name: string;
    websiteUrl: string | null;
    logoUrl: string | null;
    primaryColor: string;
    accentColor: string;
    fontPreset: string;
    voiceNotes: string;
    defaultFooter: string;
    senderName: string;
    senderEmail: string | null;
  } | null;
}) {
  const brandProfile = brandProfileSchema.parse(
    record.brandProfile ?? {
      id: "missing-brand",
      name: "Commerce Studio",
      websiteUrl: null,
      logoUrl: null,
      primaryColor: "#0f766e",
      accentColor: "#111827",
      fontPreset: "Inter",
      voiceNotes: "Clear, polished, and conversion-focused.",
      defaultFooter: "You are receiving this because you signed up for updates.",
      senderName: "Commerce Team",
      senderEmail: null,
    },
  );

  return emailProjectSchema.parse({
    id: record.id,
    title: record.title,
    templateId: record.templateId,
    subject: record.subject,
    previewText: record.previewText,
    editorDocument: record.editorDocument,
    renderedHtml: record.renderedHtml,
    renderedText: record.renderedText,
    sections: record.sections,
    version: record.version,
    brandProfile,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  });
}

export async function listProjectsForUser(userId: string) {
  const prisma = getPrisma();
  if (!prisma) {
    return [...memoryStore().projects.values()].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  }

  const user = await ensureUser(userId);
  if (!user) return [];

  const projects = await prisma.emailProject.findMany({
    where: { userId: user.id },
    include: { brandProfile: true },
    orderBy: { updatedAt: "desc" },
  });

  return projects.map(fromRecord);
}

export async function getProjectForUser(userId: string, projectId: string) {
  const prisma = getPrisma();
  if (!prisma) {
    return memoryStore().projects.get(projectId) ?? null;
  }

  const user = await ensureUser(userId);
  if (!user) return null;

  const project = await prisma.emailProject.findFirst({
    where: { id: projectId, userId: user.id },
    include: { brandProfile: true },
  });

  return project ? fromRecord(project) : null;
}

export async function createProjectForUser(
  userId: string,
  input: { templateId?: string; title?: string },
) {
  const project =
    !input.templateId || input.templateId === "blank"
      ? createBlankProject(input.title)
      : createProjectFromTemplate(input.templateId, input.title);

  const userBrand = await getUserBrand(userId);
  if (userBrand && !isBrandEmpty(userBrand)) {
    const previousBrand = project.brandProfile;
    project.brandProfile = { ...project.brandProfile, ...userBrand, id: project.brandProfile.id };
    const footerSection = project.sections.find((s) => s.type === "footer");
    if (footerSection && userBrand.defaultFooter) {
      footerSection.body = userBrand.defaultFooter;
    }
    project.editorDocument = ensureBrandStructure(project.editorDocument, project.brandProfile, previousBrand);
  }

  const prisma = getPrisma();

  if (!prisma) {
    memoryStore().projects.set(project.id, project);
    return project;
  }

  const user = await ensureUser(userId);
  if (!user) return project;

  const serialized = serializeProject(project);
  const brand = project.brandProfile;
  const createdBrand = await prisma.brandProfile.create({
    data: {
      name: brand.name,
      websiteUrl: brand.websiteUrl,
      logoUrl: brand.logoUrl,
      primaryColor: brand.primaryColor,
      accentColor: brand.accentColor,
      fontPreset: brand.fontPreset,
      voiceNotes: brand.voiceNotes,
      defaultFooter: brand.defaultFooter,
      senderName: brand.senderName,
      senderEmail: brand.senderEmail,
      userId: user.id,
    },
  });

  const created = await prisma.emailProject.create({
    data: {
      id: project.id,
      userId: user.id,
      brandProfileId: createdBrand.id,
      title: serialized.title,
      templateId: serialized.templateId,
      subject: serialized.subject,
      previewText: serialized.previewText,
      editorDocument: serialized.editorDocument,
      sections: serialized.sections,
      version: serialized.version,
    },
    include: { brandProfile: true },
  });

  return fromRecord(created);
}

export async function updateProjectForUser(
  userId: string,
  projectId: string,
  input: Omit<Partial<EmailProject>, "brandProfile"> & {
    brandProfile?: Partial<BrandProfile>;
    patches?: EmailPatch[];
    changeSummary?: string;
  },
) {
  const current = await getProjectForUser(userId, projectId);
  if (!current) return null;

  const next = emailProjectSchema.parse({
    ...current,
    ...input,
    brandProfile: {
      ...current.brandProfile,
      ...input.brandProfile,
    },
    version: input.version ?? current.version + 1,
    updatedAt: new Date().toISOString(),
  });

  const prisma = getPrisma();
  if (!prisma) {
    memoryStore().projects.set(projectId, next);
    return next;
  }

  const user = await ensureUser(userId);
  if (!user) return null;

  const updated = await prisma.emailProject.update({
    where: { id: projectId },
    data: {
      title: next.title,
      templateId: next.templateId,
      subject: next.subject,
      previewText: next.previewText,
      editorDocument: next.editorDocument as unknown as Prisma.InputJsonValue,
      sections: next.sections as unknown as Prisma.InputJsonValue,
      renderedHtml: next.renderedHtml,
      renderedText: next.renderedText,
      version: next.version,
      brandProfile: {
        update: {
          name: next.brandProfile.name,
          websiteUrl: next.brandProfile.websiteUrl,
          logoUrl: next.brandProfile.logoUrl,
          primaryColor: next.brandProfile.primaryColor,
          accentColor: next.brandProfile.accentColor,
          fontPreset: next.brandProfile.fontPreset,
          voiceNotes: next.brandProfile.voiceNotes,
          defaultFooter: next.brandProfile.defaultFooter,
          senderName: next.brandProfile.senderName,
          senderEmail: next.brandProfile.senderEmail,
        },
      },
      patchEvents:
        input.patches && input.changeSummary
          ? {
              create: {
                previousVersion: current.version,
                nextVersion: next.version,
                patches: input.patches as unknown as Prisma.InputJsonValue,
                summary: input.changeSummary,
                source: "agent-or-editor",
              },
            }
          : undefined,
    },
    include: { brandProfile: true },
  });

  return fromRecord(updated);
}

export async function loadChatMessages(projectId: string): Promise<unknown[]> {
  const prisma = getPrisma();
  if (!prisma) {
    return memoryStore().chatMessages.get(projectId) ?? [];
  }
  const rows = await prisma.chatMessage.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => row.message);
}

export async function saveChatMessages(projectId: string, messages: unknown[]) {
  if (messages.length === 0) return;

  const prisma = getPrisma();
  if (!prisma) {
    const store = memoryStore().chatMessages;
    const existing = store.get(projectId) ?? [];
    store.set(projectId, [...existing, ...messages]);
    return;
  }

  await prisma.chatMessage.createMany({
    data: messages.map((message) => ({
      projectId,
      role:
        typeof message === "object" &&
        message !== null &&
        "role" in message &&
        typeof message.role === "string"
          ? message.role
          : "unknown",
      message: message as Prisma.InputJsonValue,
    })),
  });
}

export async function syncBrandToProjects(
  userId: string,
  brand: BrandProfile,
  projectIds?: string[],
): Promise<string[]> {
  const prisma = getPrisma();

  if (!prisma) {
    const store = memoryStore();
    const synced: string[] = [];
    for (const [id, project] of store.projects) {
      if (projectIds && !projectIds.includes(id)) continue;
      const nextBrand = { ...brand, id: project.brandProfile.id };
      store.projects.set(id, {
        ...project,
        brandProfile: nextBrand,
        editorDocument: ensureBrandStructure(project.editorDocument, nextBrand, project.brandProfile),
        renderedHtml: null,
        renderedText: null,
        updatedAt: new Date().toISOString(),
      });
      synced.push(id);
    }
    return synced;
  }

  const user = await ensureUser(userId);
  if (!user) return [];

  const whereClause: { userId: string; id?: { in: string[] } } = { userId: user.id };
  if (projectIds) {
    whereClause.id = { in: projectIds };
  }

  const projects = await prisma.emailProject.findMany({
    where: whereClause,
    include: { brandProfile: true },
  });

  const { id: _brandId, ...brandFields } = brand;
  const synced: string[] = [];

  for (const project of projects) {
    if (!project.brandProfileId) continue;
    const nextBrand = brandProfileSchema.parse({
      ...brand,
      id: project.brandProfileId,
    });
    const previousBrand = brandProfileSchema.parse(
      project.brandProfile ?? {
        ...brand,
        id: project.brandProfileId,
      },
    );
    const nextEditorDocument = ensureBrandStructure(
      project.editorDocument as unknown as EmailProject["editorDocument"],
      nextBrand,
      previousBrand,
    );
    await prisma.brandProfile.update({
      where: { id: project.brandProfileId },
      data: {
        name: brandFields.name,
        websiteUrl: brandFields.websiteUrl,
        logoUrl: brandFields.logoUrl,
        primaryColor: brandFields.primaryColor,
        accentColor: brandFields.accentColor,
        fontPreset: brandFields.fontPreset,
        voiceNotes: brandFields.voiceNotes,
        defaultFooter: brandFields.defaultFooter,
        senderName: brandFields.senderName,
        senderEmail: brandFields.senderEmail,
      },
    });
    await prisma.emailProject.update({
      where: { id: project.id },
      data: {
        editorDocument: nextEditorDocument as unknown as Prisma.InputJsonValue,
        renderedHtml: null,
        renderedText: null,
      },
    });
    synced.push(project.id);
  }

  return synced;
}
