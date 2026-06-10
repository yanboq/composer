import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/server/auth";
import { getUserBrand } from "@/server/brand-store";
import { syncBrandToProjects } from "@/server/project-store";

const syncSchema = z.object({
  projectIds: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const input = syncSchema.parse(await request.json());

    const brand = await getUserBrand(userId);
    if (!brand) {
      return NextResponse.json({ error: "No brand profile found." }, { status: 404 });
    }

    const synced = await syncBrandToProjects(userId, brand, input.projectIds);
    return NextResponse.json({ synced: synced.length, projectIds: synced });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to sync brand." }, { status: 400 });
  }
}
