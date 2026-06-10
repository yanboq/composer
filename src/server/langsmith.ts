import * as ai from "ai";
import { wrapAISDK } from "langsmith/experimental/vercel";

const wrapped = wrapAISDK(ai);

export const TracedToolLoopAgent = wrapped.ToolLoopAgent;
export const tracedCreateAgentUIStreamResponse = wrapped.createAgentUIStreamResponse;
