import { auth } from "@clerk/nextjs/server";

export const hasClerkConfig = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

export async function getCurrentUserId() {
  if (!hasClerkConfig) {
    return "dev-user";
  }

  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthenticated");
  }

  return userId;
}

export async function getOptionalCurrentUserId() {
  if (!hasClerkConfig) {
    return "dev-user";
  }

  const { userId } = await auth();
  return userId;
}
