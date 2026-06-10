import { chatRequestSchema } from "@/lib/schemas";
import { createEmailBuilderAgent } from "@/server/agents/email-builder-agent";
import { getCurrentUserId } from "@/server/auth";
import { tracedCreateAgentUIStreamResponse as createAgentUIStreamResponse } from "@/server/langsmith";
import { getProjectForUser, saveChatMessages } from "@/server/project-store";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      return Response.json(
        { error: "DeepSeek is not configured. Set DEEPSEEK_API_KEY in .env.local." },
        { status: 400 },
      );
    }

    const userId = await getCurrentUserId();
    const body = chatRequestSchema.parse(await request.json());
    const project = await getProjectForUser(userId, body.projectId);

    if (!project) {
      return Response.json({ error: "Project not found." }, { status: 404 });
    }

    const agent = createEmailBuilderAgent({
      project: body.projectSnapshot,
      brandProfile: body.brandProfile,
      selectedSectionId: body.selectedSectionId,
    });

    const lastUserMsg = body.messages.filter((m) => m.role === "user").at(-1);
    if (lastUserMsg) await saveChatMessages(body.projectId, [lastUserMsg]);

    return createAgentUIStreamResponse({
      agent,
      uiMessages: body.messages,
      onFinish: async ({ responseMessage }) => {
        await saveChatMessages(body.projectId, [responseMessage]);
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Unable to run email builder agent." }, { status: 400 });
  }
}
