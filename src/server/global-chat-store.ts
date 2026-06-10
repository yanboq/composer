import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "./prisma";

type MemoryGlobalChatStore = {
  messages: Map<string, unknown[]>;
};

const globalStore = globalThis as unknown as {
  memoryGlobalChatStore?: MemoryGlobalChatStore;
};

function memoryStore() {
  if (!globalStore.memoryGlobalChatStore) {
    globalStore.memoryGlobalChatStore = { messages: new Map() };
  }
  return globalStore.memoryGlobalChatStore;
}

function ensureUser(prisma: NonNullable<ReturnType<typeof getPrisma>>, clerkUserId: string) {
  return prisma.user.upsert({
    where: { clerkUserId },
    update: {},
    create: { clerkUserId },
  });
}

export async function loadGlobalChat(userId: string): Promise<unknown[]> {
  const prisma = getPrisma();
  if (!prisma) {
    return memoryStore().messages.get(userId) ?? [];
  }

  const user = await ensureUser(prisma, userId);
  const rows = await prisma.globalChatMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => row.message);
}

export async function saveGlobalChat(userId: string, messages: unknown[]) {
  if (messages.length === 0) return;

  const prisma = getPrisma();
  if (!prisma) {
    const store = memoryStore().messages;
    const existing = store.get(userId) ?? [];
    store.set(userId, [...existing, ...messages]);
    return;
  }

  const user = await ensureUser(prisma, userId);
  await prisma.globalChatMessage.createMany({
    data: messages.map((message) => ({
      userId: user.id,
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
