import { NextResponse } from "next/server";
import { Resend } from "resend";
import { sendTestSchema } from "@/lib/schemas";
import { getCurrentUserId } from "@/server/auth";
import { getProjectForUser } from "@/server/project-store";
import { renderProjectToHtml, renderProjectToText } from "@/server/render-project-email";

export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Resend is not configured." }, { status: 400 });
    }

    const userId = await getCurrentUserId();
    const input = sendTestSchema.parse(await request.json());
    const project = await getProjectForUser(userId, input.projectId);

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    if (project.brandProfile.senderEmail && project.brandProfile.senderEmail !== input.from) {
      return NextResponse.json(
        { error: "Sender must match the saved brand sender email." },
        { status: 400 },
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const html = await renderProjectToHtml(project);
    const text = await renderProjectToText(project);
    const result = await resend.emails.send({
      to: input.to,
      from: input.from,
      subject: `[Test] ${project.subject}`,
      html,
      text,
    });

    if (result.error) {
      console.error(result.error);
      return NextResponse.json({ error: "Resend rejected the test email." }, { status: 400 });
    }

    return NextResponse.json({ id: result.data?.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to send test email." }, { status: 400 });
  }
}
