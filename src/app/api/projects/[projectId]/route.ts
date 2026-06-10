import { NextResponse } from "next/server";
import { getProjectForUser, updateProjectForUser } from "@/server/project-store";
import { updateProjectSchema } from "@/lib/schemas";
import { getCurrentUserId } from "@/server/auth";

type Context = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_request: Request, context: Context) {
  try {
    const userId = await getCurrentUserId();
    const { projectId } = await context.params;
    const project = await getProjectForUser(userId, projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch {
    return NextResponse.json({ error: "Unable to load project." }, { status: 401 });
  }
}

export async function PUT(request: Request, context: Context) {
  try {
    const userId = await getCurrentUserId();
    const { projectId } = await context.params;
    const input = updateProjectSchema.parse(await request.json());
    const project = await updateProjectForUser(userId, projectId, input);
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to save project." }, { status: 400 });
  }
}
