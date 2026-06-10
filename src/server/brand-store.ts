import type { Prisma } from "@/generated/prisma/client";
import type { BrandProfile } from "@/lib/schemas";
import { getPrisma } from "./prisma";

type MemoryBrandStore = {
  brands: Map<string, BrandProfile>;
};

const globalStore = globalThis as unknown as {
  memoryBrandStore?: MemoryBrandStore;
};

function memoryStore() {
  if (!globalStore.memoryBrandStore) {
    globalStore.memoryBrandStore = { brands: new Map() };
  }
  return globalStore.memoryBrandStore;
}

function ensureUser(prisma: NonNullable<ReturnType<typeof getPrisma>>, clerkUserId: string) {
  return prisma.user.upsert({
    where: { clerkUserId },
    update: {},
    create: { clerkUserId },
  });
}

function fromRecord(record: {
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
}): BrandProfile {
  return {
    id: record.id,
    name: record.name,
    websiteUrl: record.websiteUrl,
    logoUrl: record.logoUrl,
    primaryColor: record.primaryColor,
    accentColor: record.accentColor,
    fontPreset: record.fontPreset,
    voiceNotes: record.voiceNotes,
    defaultFooter: record.defaultFooter,
    senderName: record.senderName,
    senderEmail: record.senderEmail,
  };
}

export async function getUserBrand(userId: string): Promise<BrandProfile | null> {
  const prisma = getPrisma();
  if (!prisma) {
    return memoryStore().brands.get(userId) ?? null;
  }

  const user = await ensureUser(prisma, userId);
  const brand = await prisma.brandProfile.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return brand ? fromRecord(brand) : null;
}

export async function upsertUserBrand(
  userId: string,
  data: Partial<Omit<BrandProfile, "id">>,
): Promise<BrandProfile> {
  const prisma = getPrisma();

  if (!prisma) {
    const store = memoryStore();
    const existing = store.brands.get(userId);
    const brand: BrandProfile = {
      id: existing?.id ?? `brand-${Date.now()}`,
      name: data.name ?? existing?.name ?? "Commerce Studio",
      websiteUrl: data.websiteUrl ?? existing?.websiteUrl ?? null,
      logoUrl: data.logoUrl ?? existing?.logoUrl ?? null,
      primaryColor: data.primaryColor ?? existing?.primaryColor ?? "#0f766e",
      accentColor: data.accentColor ?? existing?.accentColor ?? "#111827",
      fontPreset: data.fontPreset ?? existing?.fontPreset ?? "Inter",
      voiceNotes: data.voiceNotes ?? existing?.voiceNotes ?? "Clear, polished, and conversion-focused.",
      defaultFooter: data.defaultFooter ?? existing?.defaultFooter ?? "You are receiving this because you signed up for updates.",
      senderName: data.senderName ?? existing?.senderName ?? "Commerce Team",
      senderEmail: data.senderEmail ?? existing?.senderEmail ?? null,
    };
    store.brands.set(userId, brand);
    return brand;
  }

  const user = await ensureUser(prisma, userId);
  const existing = await prisma.brandProfile.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    const updated = await prisma.brandProfile.update({
      where: { id: existing.id },
      data: {
        name: data.name ?? existing.name,
        websiteUrl: data.websiteUrl !== undefined ? data.websiteUrl : existing.websiteUrl,
        logoUrl: data.logoUrl !== undefined ? data.logoUrl : existing.logoUrl,
        primaryColor: data.primaryColor ?? existing.primaryColor,
        accentColor: data.accentColor ?? existing.accentColor,
        fontPreset: data.fontPreset ?? existing.fontPreset,
        voiceNotes: data.voiceNotes ?? existing.voiceNotes,
        defaultFooter: data.defaultFooter ?? existing.defaultFooter,
        senderName: data.senderName ?? existing.senderName,
        senderEmail: data.senderEmail !== undefined ? data.senderEmail : existing.senderEmail,
      },
    });
    return fromRecord(updated);
  }

  const created = await prisma.brandProfile.create({
    data: {
      userId: user.id,
      name: data.name ?? "Commerce Studio",
      websiteUrl: data.websiteUrl ?? null,
      logoUrl: data.logoUrl ?? null,
      primaryColor: data.primaryColor ?? "#0f766e",
      accentColor: data.accentColor ?? "#111827",
      fontPreset: data.fontPreset ?? "Inter",
      voiceNotes: data.voiceNotes ?? "Clear, polished, and conversion-focused.",
      defaultFooter: data.defaultFooter ?? "You are receiving this because you signed up for updates.",
      senderName: data.senderName ?? "Commerce Team",
      senderEmail: data.senderEmail ?? null,
    },
  });
  return fromRecord(created);
}

export function isBrandEmpty(brand: BrandProfile | null): boolean {
  if (!brand) return true;
  const isDefaultName = brand.name === "Commerce Studio";
  const hasNoWebsite = !brand.websiteUrl;
  const hasNoLogo = !brand.logoUrl;
  return isDefaultName && hasNoWebsite && hasNoLogo;
}
