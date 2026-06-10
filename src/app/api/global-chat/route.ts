import { globalChatRequestSchema } from "@/lib/schemas";
import { createBrandAssistantAgent } from "@/server/agents/brand-assistant-agent";
import { getCurrentUserId } from "@/server/auth";
import { getUserBrand } from "@/server/brand-store";
import { loadGlobalChat, saveGlobalChat } from "@/server/global-chat-store";
import { tracedCreateAgentUIStreamResponse as createAgentUIStreamResponse } from "@/server/langsmith";

export const maxDuration = 60;

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const messages = await loadGlobalChat(userId);
    return Response.json({ messages });
  } catch {
    return Response.json({ messages: [] });
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      return Response.json(
        { error: "DeepSeek is not configured. Set DEEPSEEK_API_KEY in .env.local." },
        { status: 400 },
      );
    }

    const userId = await getCurrentUserId();
    const body = globalChatRequestSchema.parse(await request.json());
    const brand = await getUserBrand(userId);

    const agent = createBrandAssistantAgent({ userId, brand });

    const lastUserMsg = body.messages.filter((m) => m.role === "user").at(-1);
    if (lastUserMsg) await saveGlobalChat(userId, [lastUserMsg]);

    return createAgentUIStreamResponse({
      agent,
      uiMessages: body.messages,
      onFinish: async ({ responseMessage }) => {
        await saveGlobalChat(userId, [responseMessage]);
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Unable to run brand assistant." }, { status: 400 });
  }
}
