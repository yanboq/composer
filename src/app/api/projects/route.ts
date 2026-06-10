import { NextResponse } from "next/server";
import { createProjectForUser, listProjectsForUser } from "@/server/project-store";
import { createProjectSchema } from "@/lib/schemas";
import { getCurrentUserId } from "@/server/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    return NextResponse.json({ projects: await listProjectsForUser(userId) });
  } catch {
    return NextResponse.json({ error: "Unable to load projects." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const input = createProjectSchema.parse(await request.json());
    const project = await createProjectForUser(userId, input);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to create project." }, { status: 400 });
  }
}
