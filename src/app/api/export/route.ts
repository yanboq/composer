import { NextResponse } from "next/server";
import { exportRequestSchema } from "@/lib/schemas";
import { getCurrentUserId } from "@/server/auth";
import { getProjectForUser } from "@/server/project-store";
import {
  createProjectEmailSource,
  renderProjectToHtml,
  renderProjectToText,
} from "@/server/render-project-email";

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const input = exportRequestSchema.parse(await request.json());
    const project = await getProjectForUser(userId, input.projectId);

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const value =
      input.format === "plainText"
        ? project.renderedText ?? await renderProjectToText(project)
        : input.format === "reactEmailSource"
          ? await createProjectEmailSource(project)
          : project.renderedHtml ?? await renderProjectToHtml(project);

    return NextResponse.json({ format: input.format, value });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to export project." }, { status: 400 });
  }
}
