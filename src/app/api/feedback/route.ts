import { Client } from "langsmith";

export async function POST(request: Request) {
  try {
    const { messageId, messageText, score, comment } = (await request.json()) as {
      messageId: string;
      messageText?: string;
      score: number;
      comment?: string;
    };

    if (!process.env.LANGSMITH_API_KEY) {
      return Response.json({ ok: false, error: "LangSmith not configured" }, { status: 400 });
    }

    const client = new Client();
    const runId = crypto.randomUUID();

    await client.createRun({
      id: runId,
      name: "user-feedback",
      run_type: "chain",
      project_name: process.env.LANGSMITH_PROJECT ?? "composer",
      inputs: { messageId, messageText: messageText ?? "" },
      outputs: { score, comment: comment ?? "" },
      start_time: Date.now(),
      end_time: Date.now(),
    });

    await client.createFeedback(runId, "user-thumbs", {
      score,
      comment,
      feedbackSourceType: "app",
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Feedback error:", error);
    return Response.json({ ok: false, error: "Failed to submit feedback" }, { status: 500 });
  }
}
