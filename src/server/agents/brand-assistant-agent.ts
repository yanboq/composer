import { createDeepSeek, type DeepSeekLanguageModelOptions } from "@ai-sdk/deepseek";
import { stepCountIs, tool } from "ai";
import { z } from "zod";
import { TracedToolLoopAgent } from "@/server/langsmith";
import { brandProfileSchema, type BrandProfile } from "@/lib/schemas";
import { upsertUserBrand, getUserBrand, isBrandEmpty } from "@/server/brand-store";
import { scrapeBrandFromUrl } from "@/server/scrape-brand";
import { syncBrandToProjects } from "@/server/project-store";

function deepseekProvider() {
  return createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
  });
}

export function createBrandAssistantAgent({
  userId,
  brand,
}: {
  userId: string;
  brand: BrandProfile | null;
}) {
  const deepseek = deepseekProvider();
  const model = deepseek(process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash");
  const brandEmpty = isBrandEmpty(brand);

  return new TracedToolLoopAgent({
    id: "brand-assistant-agent",
    model,
    stopWhen: stepCountIs(6),
    providerOptions: {
      deepseek: {
        thinking: { type: "disabled" },
      } satisfies DeepSeekLanguageModelOptions,
    },
    instructions: `You are a helpful brand setup assistant for an ecommerce email builder.

Your job is to help the user configure their brand profile — name, colors, logo, fonts, voice, and sender details. Be concise and friendly.

Rules:
- When the user provides a website URL, call scrapeWebsite to pull brand info automatically.
- After scraping, present the extracted info clearly and ask for confirmation before applying.
- When the user confirms, call updateBrand to save the changes.
- You can also help with manual brand setup — just ask what they want to change and call updateBrand.
- If the user asks about their email projects, templates, or wants to navigate, call navigateUser.
- Be proactive: if the brand is empty, suggest they share a website URL or set things up manually.
- After updating brand, offer to sync the changes to existing projects using syncToProjects.
- Keep responses short and action-oriented.

Current brand state:
${brand ? JSON.stringify(brand, null, 2) : "No brand profile set up yet."}

Brand is ${brandEmpty ? "EMPTY — guide the user to set it up" : "configured"}.`,
    tools: {
      scrapeWebsite: tool({
        description: "Fetch a website URL and extract brand elements (colors, logo, name, fonts).",
        inputSchema: z.object({
          url: z.string().describe("The website URL to scrape"),
        }),
        execute: async ({ url }) => {
          const scraped = await scrapeBrandFromUrl(url);
          return {
            scraped,
            suggestion: "Review the extracted brand info above. Ask the user if they want to apply these settings.",
          };
        },
      }),
      updateBrand: tool({
        description: "Update the user's brand profile with the given fields.",
        inputSchema: z.object({
          fields: z.object({
            name: z.string().optional(),
            websiteUrl: z.string().optional().nullable(),
            logoUrl: z.string().optional().nullable(),
            primaryColor: z.string().optional(),
            accentColor: z.string().optional(),
            fontPreset: z.string().optional(),
            voiceNotes: z.string().optional(),
            defaultFooter: z.string().optional(),
            senderName: z.string().optional(),
            senderEmail: z.string().optional().nullable(),
          }).describe("Brand profile fields to update"),
        }),
        execute: async ({ fields }) => {
          const updated = await upsertUserBrand(userId, fields);
          return {
            updated,
            isEmpty: isBrandEmpty(updated),
            changeSummary: `Updated brand: ${Object.keys(fields).join(", ")}`,
          };
        },
      }),
      getBrandStatus: tool({
        description: "Get the current brand profile and whether it needs setup.",
        inputSchema: z.object({}),
        execute: async () => {
          return {
            brand,
            isEmpty: brandEmpty,
          };
        },
      }),
      syncToProjects: tool({
        description: "Sync the current brand profile to existing email projects. Call this after updating brand when the user wants to apply changes to their projects.",
        inputSchema: z.object({
          projectIds: z.array(z.string()).optional().describe("Specific project IDs to sync. Omit to sync all projects."),
        }),
        execute: async ({ projectIds }) => {
          const currentBrand = await getUserBrand(userId);
          if (!currentBrand) {
            return { synced: 0, changeSummary: "No brand profile found to sync." };
          }
          const synced = await syncBrandToProjects(userId, currentBrand, projectIds);
          return {
            synced: synced.length,
            projectIds: synced,
            changeSummary: `Synced brand to ${synced.length} project${synced.length === 1 ? "" : "s"}.`,
          };
        },
      }),
      navigateUser: tool({
        description: "Suggest navigating the user to a different page in the app.",
        inputSchema: z.object({
          page: z.enum(["home", "brand", "templates", "builder"]),
          message: z.string().describe("Message to show during navigation"),
        }),
        execute: async ({ page, message }) => {
          const routes: Record<string, string> = {
            home: "/",
            brand: "/brand",
            templates: "/templates",
            builder: "/builder",
          };
          return {
            navigateTo: routes[page],
            message,
          };
        },
      }),
    },
  });
}
