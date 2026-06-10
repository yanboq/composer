import type { BrandProfile, EditorDocument, EditorNode, EmailProject, EmailSection } from "./schemas";
import { ensureBrandStructure } from "./editor-document";

const DEMO_ASSET_BASE = "https://demo.react.email";
const DEFAULT_URL = "https://example.com/";

type TextMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type EmailTemplate = {
  id: string;
  name: string;
  campaignType: string;
  description: string;
  subject: string;
  previewText: string;
  sourceUrl: string;
  rawSourceUrl: string;
  demoUrl: string;
  preserveSourceLayout?: boolean;
  sections: EmailSection[];
  editorDocument?: EditorDocument;
};

function textNode(text: string, marks?: TextMark[]): EditorNode {
  return { type: "text", text, ...(marks ? { marks } : {}) };
}

function paragraphNode(
  text: string,
  style?: string,
  attrs?: Record<string, unknown>,
  marks?: TextMark[],
): EditorNode {
  return {
    type: "paragraph",
    attrs: { ...(style ? { style } : {}), ...(attrs ?? {}) },
    content: [textNode(text, marks)],
  };
}

function headingNode(level: 1 | 2 | 3, text: string, style?: string): EditorNode {
  return {
    type: "heading",
    attrs: { level, ...(style ? { style } : {}) },
    content: [textNode(text)],
  };
}

function sectionNode(content: EditorNode[], style?: string, attrs?: Record<string, unknown>): EditorNode {
  return {
    type: "section",
    attrs: { ...(style ? { style } : {}), ...(attrs ?? {}) },
    content,
  };
}

function imageNode(file: string, width: number, style?: string): EditorNode {
  return {
    type: "image",
    attrs: {
      src: `${DEMO_ASSET_BASE}${file}`,
      alt: "",
      width,
      height: "auto",
      alignment: "center",
      ...(style ? { style } : {}),
    },
  };
}

function buttonNode(label: string, href = DEFAULT_URL, alignment: "left" | "center" = "center"): EditorNode {
  return {
    type: "button",
    attrs: {
      href,
      alignment,
      style:
        "background:#111111;color:#ffffff;border-radius:8px;padding:14px 28px;font-size:16px;font-weight:600;text-decoration:none;",
    },
    content: [textNode(label)],
  };
}

function linkedText(label: string, href = DEFAULT_URL): EditorNode {
  return paragraphNode(label, "margin:0;color:#111111;font-size:16px;font-weight:600;", undefined, [
    { type: "link", attrs: { href, target: "_blank", rel: "noopener noreferrer nofollow" } },
  ]);
}

function columnCell(content: EditorNode[], style?: string): EditorNode {
  return {
    type: "tableCell",
    attrs: {
      style: `vertical-align:top;padding:0;${style ?? ""}`,
    },
    content,
  };
}

function rowNode(cells: EditorNode[], style?: string): EditorNode {
  return {
    type: "tableRow",
    attrs: { ...(style ? { style } : {}) },
    content: cells,
  };
}

function tableNode(rows: EditorNode[], style?: string): EditorNode {
  return {
    type: "table",
    attrs: {
      width: "100%",
      style: `border-collapse:collapse;width:100%;${style ?? ""}`,
    },
    content: rows,
  };
}

function card(content: EditorNode[], extraStyle = ""): EditorNode {
  return sectionNode(
    content,
    `background:#f7f7f8;border-radius:10px;margin:0 0 24px;padding:40px 28px;${extraStyle}`,
  );
}

function barebonesHeader(companyName = "Barebones"): EditorNode {
  return sectionNode(
    [
      tableNode([
        rowNode([
          columnCell([imageNode("/static/shared/logo-black.png", 23, "display:block;")], "width:50%;"),
          columnCell(
            [
              paragraphNode(
                companyName,
                "margin:0;color:#737373;font-size:13px;text-align:right;",
              ),
            ],
            "width:50%;",
          ),
        ]),
      ]),
    ],
    "background:#ffffff;margin:0 0 12px;padding:7px 24px;",
  );
}

function barebonesFooter(companyName = "Barebones", href = DEFAULT_URL): EditorNode {
  return sectionNode(
    [
      paragraphNode(
        `${companyName} is the catchy slogan that perfectly encapsulates the vision of our company.`,
        "margin:0 auto 30px;max-width:280px;color:#737373;font-size:13px;line-height:1.5;text-align:center;",
      ),
      tableNode(
        [
          rowNode([
            columnCell([imageNode("/static/shared/social-x-black.png", 18)], "width:25%;text-align:center;"),
            columnCell([imageNode("/static/shared/social-in-black.png", 18)], "width:25%;text-align:center;"),
            columnCell([imageNode("/static/shared/social-yt-black.png", 18)], "width:25%;text-align:center;"),
            columnCell([imageNode("/static/shared/social-gh-black.png", 18)], "width:25%;text-align:center;"),
          ]),
        ],
        "max-width:140px;margin:0 auto 28px;",
      ),
      paragraphNode(
        "123 Market Street, Floor 1\nTech City, CA, 94102",
        "margin:0 0 18px;color:#737373;font-size:11px;line-height:1.6;text-align:center;white-space:pre-line;",
      ),
      paragraphNode(
        `Unsubscribe from ${companyName} marketing emails.`,
        "margin:0;color:#737373;font-size:11px;line-height:1.6;text-align:center;",
        undefined,
        [{ type: "link", attrs: { href } }],
      ),
    ],
    "background:#ffffff;padding:40px 24px;text-align:center;",
  );
}

function barebonesContainer(content: EditorNode[]): EditorDocument {
  return {
    type: "doc",
    content: [
      {
        type: "container",
        attrs: {
          style: "max-width:640px;width:100%;background:#ffffff;padding:16px 24px;margin:32px auto;",
        },
        content,
      },
    ],
  };
}

function bulletTable(text: string, rounded = "999px"): EditorNode {
  const bullet = paragraphNode(" ", `border:1px solid #d4d4d4;border-radius:${rounded};width:24px;height:24px;margin:0 0 20px;`);
  const cell = () =>
    columnCell(
      [
        bullet,
        paragraphNode(text, "margin:0;color:#525252;font-size:16px;line-height:1.55;text-align:left;"),
      ],
      "width:50%;padding-right:28px;",
    );

  return tableNode([rowNode([cell(), cell()]), rowNode([cell(), cell()], "margin-top:24px;")]);
}

function featureImageCard(title: string, body: string): EditorNode {
  return sectionNode(
    [
      imageNode(
        "/static/barebones/barebones-image.png",
        592,
        "display:block;width:100%;max-width:592px;border-radius:12px;margin:0 auto 24px;",
      ),
      paragraphNode(title, "margin:0 0 12px;color:#111111;font-size:24px;font-weight:600;text-align:left;"),
      paragraphNode(body, "margin:0 0 28px;max-width:420px;color:#525252;font-size:16px;line-height:1.55;text-align:left;"),
      buttonNode("Try it out", DEFAULT_URL, "left"),
    ],
    "margin:0 0 72px;text-align:left;",
  );
}

function createWelcomeEditorDocument(): EditorDocument {
  return barebonesContainer([
    barebonesHeader(),
    card(
      [
        imageNode(
          "/static/barebones/barebones-image.png",
          600,
          "display:block;width:100%;max-width:600px;border-radius:12px;margin:0 auto 40px;",
        ),
        paragraphNode("Thanks for joining us", "margin:0 0 24px;color:#737373;font-size:13px;text-align:center;"),
        headingNode(1, "Welcome to Barebones", "margin:0 0 24px;color:#111111;font-size:40px;line-height:1.1;text-align:center;"),
        paragraphNode(
          "You're all set. Open your dashboard to explore the basics, connect a few tools, and invite your team when you're ready.",
          "margin:0 auto;max-width:422px;color:#525252;font-size:16px;line-height:1.55;text-align:center;",
        ),
      ],
      "padding-top:20px;padding-bottom:56px;",
    ),
    card(
      [
        imageNode(
          "/static/barebones/barebones-image.png",
          600,
          "display:block;width:100%;max-width:600px;border-radius:12px;margin:0 auto 40px;",
        ),
        headingNode(2, "Getting started", "margin:0 0 40px;color:#111111;font-size:32px;line-height:1.15;"),
        bulletTable(
          "Bring your team, tools, and workflows together in one place—with permissions that match how you work.",
        ),
        sectionNode([buttonNode("Open dashboard")], "margin:40px 0 0;text-align:center;"),
      ],
      "padding-top:20px;padding-bottom:56px;",
    ),
    card([
      paragraphNode("Some new things", "margin:0 0 56px;color:#111111;font-size:32px;line-height:1.15;text-align:center;"),
      tableNode([
        rowNode([
          columnCell(
            [
              imageNode("/static/barebones/barebones-image.png", 280, "display:block;width:100%;max-width:280px;border-radius:12px;margin:0 auto 24px;"),
              paragraphNode("Team workspaces", "margin:0 0 4px;color:#111111;font-size:16px;font-weight:600;text-align:left;"),
              paragraphNode(
                "Roles, guests, and access levels so the right people see the right work—without extra admin overhead.",
                "margin:0;color:#525252;font-size:16px;line-height:1.55;text-align:left;",
              ),
            ],
            "width:50%;padding-right:12px;",
          ),
          columnCell(
            [
              imageNode("/static/barebones/barebones-image.png", 280, "display:block;width:100%;max-width:280px;border-radius:12px;margin:0 auto 24px;"),
              paragraphNode("Connect your stack", "margin:0 0 4px;color:#111111;font-size:16px;font-weight:600;text-align:left;"),
              paragraphNode(
                "Plug in the apps your team already uses and keep updates flowing without jumping between tabs.",
                "margin:0;color:#525252;font-size:16px;line-height:1.55;text-align:left;",
              ),
            ],
            "width:50%;padding-left:12px;",
          ),
        ]),
      ]),
      sectionNode([buttonNode("Explore features")], "margin:40px 0 0;text-align:center;"),
    ]),
    card([
      imageNode("/static/shared/logo-white.png", 32, "display:block;background:#000000;border-radius:12px;padding:12px;margin:0 auto 32px;"),
      paragraphNode(
        "Start using Barebones\nThe fastest, easiest way to use Barebones.",
        "margin:0 0 32px;color:#525252;font-size:28px;line-height:1.3;text-align:center;white-space:pre-line;",
      ),
      buttonNode("Go to Dashboard"),
    ]),
    barebonesFooter(),
  ]);
}

function numberedStep(n: string, title: string, body: string): EditorNode {
  return tableNode(
    [
      rowNode([
        columnCell(
          [paragraphNode(n, "border:1px solid #d4d4d4;border-radius:10px;margin:0;width:28px;padding:4px 0;text-align:center;color:#111111;")],
          "width:44px;padding-right:12px;",
        ),
        columnCell(
          [
            paragraphNode(title, "margin:0 0 4px;color:#111111;font-size:16px;font-weight:600;text-align:left;"),
            paragraphNode(body, "margin:0;color:#525252;font-size:16px;line-height:1.55;text-align:left;"),
          ],
          "padding-bottom:28px;",
        ),
      ]),
    ],
  );
}

function createProductUpdateEditorDocument(): EditorDocument {
  const repeatedBody =
    "Built for teams who need reliability at scale: clearer behavior, better defaults, and less back-and-forth to get work done.";

  return barebonesContainer([
    barebonesHeader(),
    card(
      [
        paragraphNode("Product update", "margin:0 0 24px;color:#737373;font-size:13px;text-align:center;"),
        headingNode(1, "Here's what's new with Barebones", "margin:0 0 24px;color:#111111;font-size:40px;line-height:1.1;text-align:center;"),
        paragraphNode(
          "We shipped a new release with improvements to help you move faster and stay in sync. Open the dashboard to explore the full changelog.",
          "margin:0 auto 24px;max-width:422px;color:#525252;font-size:16px;line-height:1.55;text-align:center;",
        ),
        buttonNode("View in dashboard"),
        imageNode(
          "/static/barebones/barebones-image.png",
          592,
          "display:block;width:100%;max-width:592px;border-radius:12px;margin:40px auto 0;",
        ),
      ],
      "padding-top:56px;padding-bottom:20px;",
    ),
    card([
      headingNode(2, "Starting is easy", "margin:0 0 40px;color:#111111;font-size:32px;line-height:1.15;"),
      numberedStep("1", "Review the highlights", "Skim what's new and jump straight to the features that matter for your team."),
      numberedStep("2", "Try it when you're ready", "Turn on new options on your timeline—no forced migration or downtime for your workflow."),
      numberedStep("3", "Share with your team", "Invite teammates so everyone sees the same improvements and clear next steps."),
      sectionNode([buttonNode("Explore updates")], "margin:16px 0 0;text-align:center;"),
    ]),
    card([
      paragraphNode("Some new things", "margin:0 0 56px;color:#111111;font-size:32px;line-height:1.15;text-align:center;"),
      tableNode([
        rowNode([
          columnCell(
            [
              imageNode("/static/barebones/barebones-image-2.png", 288, "display:block;width:100%;max-width:288px;border-radius:12px;margin:0 auto 24px;"),
              paragraphNode("Quality-of-life fixes", "margin:0 0 4px;color:#111111;font-size:16px;font-weight:600;text-align:left;"),
              paragraphNode(
                "Expect faster load times, clearer status, and fewer clicks for everyday tasks. We also tightened the spots where teams tend to get stuck.",
                "margin:0;color:#525252;font-size:16px;line-height:1.55;text-align:left;",
              ),
            ],
            "width:50%;padding-right:12px;",
          ),
          columnCell(
            [
              imageNode("/static/barebones/barebones-image-2.png", 288, "display:block;width:100%;max-width:288px;border-radius:12px;margin:0 auto 24px;"),
              paragraphNode("Under the hood", "margin:0 0 4px;color:#111111;font-size:16px;font-weight:600;text-align:left;"),
              paragraphNode(
                "Expect faster load times, clearer status, and fewer clicks for everyday tasks. We also tightened the spots where teams tend to get stuck.",
                "margin:0;color:#525252;font-size:16px;line-height:1.55;text-align:left;",
              ),
            ],
            "width:50%;padding-left:12px;",
          ),
        ]),
      ]),
      sectionNode([buttonNode("Explore updates")], "margin:40px 0 0;text-align:center;"),
    ]),
    card([
      headingNode(2, "Some new things", "margin:0 0 40px;color:#111111;font-size:32px;line-height:1.15;"),
      tableNode([
        rowNode([
          columnCell([imageNode("/static/barebones/barebones-image-2.png", 311, "display:block;width:100%;max-width:311px;border-radius:12px;")], "width:48%;padding-right:20px;padding-bottom:28px;"),
          columnCell([paragraphNode("Workflow improvements", "margin:0 0 4px;color:#111111;font-size:16px;font-weight:600;text-align:left;"), paragraphNode(repeatedBody, "margin:0 0 12px;color:#525252;font-size:16px;line-height:1.55;text-align:left;"), linkedText("Learn about Pro")], "width:52%;padding-bottom:28px;"),
        ]),
        rowNode([
          columnCell([paragraphNode("Reporting & visibility", "margin:0 0 4px;color:#111111;font-size:16px;font-weight:600;text-align:left;"), paragraphNode(repeatedBody, "margin:0 0 12px;color:#525252;font-size:16px;line-height:1.55;text-align:left;"), linkedText("Learn about Pro")], "width:52%;padding-right:20px;padding-bottom:28px;"),
          columnCell([imageNode("/static/barebones/barebones-image-2.png", 311, "display:block;width:100%;max-width:311px;border-radius:12px;")], "width:48%;padding-bottom:28px;"),
        ]),
        rowNode([
          columnCell([imageNode("/static/barebones/barebones-image-2.png", 311, "display:block;width:100%;max-width:311px;border-radius:12px;")], "width:48%;padding-right:20px;"),
          columnCell([paragraphNode("API & integrations", "margin:0 0 4px;color:#111111;font-size:16px;font-weight:600;text-align:left;"), paragraphNode(repeatedBody, "margin:0 0 12px;color:#525252;font-size:16px;line-height:1.55;text-align:left;"), linkedText("Learn about Pro")], "width:52%;"),
        ]),
      ]),
    ]),
    card([
      headingNode(2, "Some new things", "margin:0 0 40px;color:#111111;font-size:32px;line-height:1.15;"),
      bulletTable("These updates roll out gradually. Check your workspace to see what's available to you today.", "8px"),
      sectionNode([buttonNode("Explore updates")], "margin:40px 0 0;text-align:center;"),
    ]),
    card(
      [
        imageNode("/static/shared/logo-white.png", 32, "display:block;background:#000000;border-radius:12px;padding:12px;margin:0 auto 32px;"),
        paragraphNode(
          "Get the app.\nThe fastest, easiest way to use Barebones.",
          "margin:0 0 32px;color:#525252;font-size:28px;line-height:1.3;text-align:center;white-space:pre-line;",
        ),
        tableNode([
          rowNode([
            columnCell([buttonNode("App Store")], "width:50%;text-align:right;padding-right:8px;"),
            columnCell([buttonNode("Google Play")], "width:50%;text-align:left;padding-left:8px;"),
          ]),
        ]),
      ],
      "margin-bottom:48px;",
    ),
    barebonesFooter(),
  ]);
}

function createFeatureAnnouncementEditorDocument(): EditorDocument {
  const featureTitle = "Hello feature. Goodbye old feature.";
  const featureBody =
    "Ship updates in smaller, safer steps: clearer defaults, fewer clicks, and less context switching for your team.";

  return barebonesContainer([
    barebonesHeader(),
    card(
      [
        paragraphNode("What's new from Barebones", "margin:0 0 16px;color:#737373;font-size:13px;text-align:center;"),
        headingNode(1, "Release Notes", "margin:0 0 16px;color:#111111;font-size:40px;line-height:1.1;text-align:center;"),
        paragraphNode(
          "Learn what's shipping this month, plus other Barebones updates below.",
          "margin:0 auto 64px;max-width:422px;color:#525252;font-size:16px;line-height:1.55;text-align:center;",
        ),
        featureImageCard(featureTitle, featureBody),
        featureImageCard(featureTitle, featureBody),
      ],
      "padding-top:80px;padding-bottom:64px;",
    ),
    card(
      [
        headingNode(2, "New ways to work", "margin:0 0 40px;color:#111111;font-size:32px;line-height:1.15;text-align:left;"),
        tableNode([
          rowNode([
            columnCell([imageNode("/static/barebones/barebones-image-3.png", 48, "display:block;")], "width:72px;padding-right:28px;padding-bottom:36px;"),
            columnCell(
              [
                paragraphNode("Automations that save real time", "margin:0 0 6px;color:#111111;font-size:16px;font-weight:600;text-align:left;"),
                paragraphNode(
                  "Bring your workflows into one place, cut manual handoffs, and give everyone the same source of truth.",
                  "margin:0 0 16px;max-width:400px;color:#525252;font-size:16px;line-height:1.55;text-align:left;",
                ),
                linkedText("Read more"),
              ],
              "padding-bottom:36px;",
            ),
          ]),
          rowNode([
            columnCell([imageNode("/static/barebones/barebones-image-3.png", 48, "display:block;")], "width:72px;padding-right:28px;"),
            columnCell([
              paragraphNode("A clearer view of what needs attention", "margin:0 0 6px;color:#111111;font-size:16px;font-weight:600;text-align:left;"),
              paragraphNode(
                "Bring your workflows into one place, cut manual handoffs, and give everyone the same source of truth.",
                "margin:0 0 16px;max-width:400px;color:#525252;font-size:16px;line-height:1.55;text-align:left;",
              ),
              linkedText("Read more"),
            ]),
          ]),
        ]),
      ],
      "padding-left:32px;padding-right:32px;text-align:left;",
    ),
    card([featureImageCard(featureTitle, featureBody)], "padding-top:32px;padding-bottom:64px;"),
    card([
      imageNode("/static/shared/logo-white.png", 32, "display:block;background:#000000;border-radius:12px;padding:12px;margin:0 auto 32px;"),
      paragraphNode(
        "Start using Barebones\nThe fastest, easiest way to use Barebones.",
        "margin:0 auto 32px;max-width:420px;color:#111111;font-size:28px;line-height:1.3;text-align:center;white-space:pre-line;",
      ),
      buttonNode("Go to Dashboard"),
    ]),
    barebonesFooter(),
  ]);
}

export const emailTemplates: EmailTemplate[] = [
  {
    id: "welcome",
    name: "Welcome",
    campaignType: "Welcome",
    description: "Barebones welcome email for onboarding new users.",
    subject: "Welcome aboard—Barebones",
    previewText: "Welcome aboard—Barebones",
    sourceUrl: "https://github.com/resend/react-email/blob/canary/apps/demo/emails/01-Barebone/welcome.tsx",
    rawSourceUrl: "https://raw.githubusercontent.com/resend/react-email/canary/apps/demo/emails/01-Barebone/welcome.tsx",
    demoUrl: "https://demo.react.email/preview/01-Barebone/welcome",
    preserveSourceLayout: true,
    editorDocument: createWelcomeEditorDocument(),
    sections: [
      {
        id: "hero",
        type: "hero",
        eyebrow: "Thanks for joining us",
        headline: "Welcome to Barebones",
        body: "You're all set. Open your dashboard to explore the basics, connect a few tools, and invite your team when you're ready.",
        buttonLabel: "Open dashboard",
        buttonUrl: DEFAULT_URL,
      },
      {
        id: "getting-started",
        type: "text",
        headline: "Getting started",
        body: "Bring your team, tools, and workflows together in one place—with permissions that match how you work.",
      },
      {
        id: "features",
        type: "text",
        headline: "Some new things",
        body: "Team workspaces. Connect your stack. Roles, guests, and access levels so the right people see the right work—without extra admin overhead.",
      },
      {
        id: "footer",
        type: "footer",
        body: "Barebones is the catchy slogan that perfectly encapsulates the vision of our company.",
      },
    ],
  },
  {
    id: "product-update",
    name: "Product Update",
    campaignType: "Product update",
    description: "Barebones product update email for shipping meaningful changes.",
    subject: "Product update: what's new at Barebones",
    previewText: "Product update: what's new at Barebones",
    sourceUrl: "https://github.com/resend/react-email/blob/canary/apps/demo/emails/01-Barebone/product-update.tsx",
    rawSourceUrl: "https://raw.githubusercontent.com/resend/react-email/canary/apps/demo/emails/01-Barebone/product-update.tsx",
    demoUrl: "https://demo.react.email/preview/01-Barebone/product-update",
    preserveSourceLayout: true,
    editorDocument: createProductUpdateEditorDocument(),
    sections: [
      {
        id: "hero",
        type: "hero",
        eyebrow: "Product update",
        headline: "Here's what's new with Barebones",
        body: "We shipped a new release with improvements to help you move faster and stay in sync. Open the dashboard to explore the full changelog.",
        buttonLabel: "View in dashboard",
        buttonUrl: DEFAULT_URL,
      },
      {
        id: "starting",
        type: "text",
        headline: "Starting is easy",
        body: "Review the highlights. Try it when you're ready. Share with your team.",
      },
      {
        id: "updates",
        type: "product",
        productName: "Some new things",
        headline: "Quality-of-life fixes",
        body: "Expect faster load times, clearer status, and fewer clicks for everyday tasks. We also tightened the spots where teams tend to get stuck.",
        buttonLabel: "Explore updates",
        buttonUrl: DEFAULT_URL,
      },
      {
        id: "footer",
        type: "footer",
        body: "Barebones is the catchy slogan that perfectly encapsulates the vision of our company.",
      },
    ],
  },
  {
    id: "feature-announcement",
    name: "Feature",
    campaignType: "Feature",
    description: "Barebones feature announcement email for introducing a new capability.",
    subject: "Release notes — Barebones",
    previewText: "Release notes — Barebones",
    sourceUrl: "https://github.com/resend/react-email/blob/canary/apps/demo/emails/01-Barebone/feature-announcement.tsx",
    rawSourceUrl: "https://raw.githubusercontent.com/resend/react-email/canary/apps/demo/emails/01-Barebone/feature-announcement.tsx",
    demoUrl: "https://demo.react.email/preview/01-Barebone/feature-announcement",
    preserveSourceLayout: true,
    editorDocument: createFeatureAnnouncementEditorDocument(),
    sections: [
      {
        id: "hero",
        type: "hero",
        eyebrow: "What's new from Barebones",
        headline: "Release Notes",
        body: "Learn what's shipping this month, plus other Barebones updates below.",
        buttonLabel: "Try it out",
        buttonUrl: DEFAULT_URL,
      },
      {
        id: "feature",
        type: "text",
        headline: "Hello feature. Goodbye old feature.",
        body: "Ship updates in smaller, safer steps: clearer defaults, fewer clicks, and less context switching for your team.",
      },
      {
        id: "ways-to-work",
        type: "text",
        headline: "New ways to work",
        body: "Automations that save real time. A clearer view of what needs attention.",
      },
      {
        id: "footer",
        type: "footer",
        body: "Barebones is the catchy slogan that perfectly encapsulates the vision of our company.",
      },
    ],
  },
];

export function getTemplateSourceUrl(templateId: string) {
  return emailTemplates.find((item) => item.id === templateId)?.sourceUrl ?? null;
}

export function getTemplateRawSourceUrl(templateId: string) {
  return emailTemplates.find((item) => item.id === templateId)?.rawSourceUrl ?? null;
}

export function createDefaultBrandProfile(): BrandProfile {
  return {
    id: crypto.randomUUID(),
    name: "Commerce Studio",
    websiteUrl: "https://example.com",
    logoUrl: null,
    primaryColor: "#0f766e",
    accentColor: "#111827",
    fontPreset: "Inter",
    voiceNotes: "Clear, polished, and conversion-focused.",
    defaultFooter: "You are receiving this because you signed up for updates.",
    senderName: "Commerce Team",
    senderEmail: null,
  };
}

export function createEditorDocumentFromSections(
  sections: EmailSection[],
  brandProfile?: BrandProfile,
): EditorDocument {
  const document: EditorDocument = {
    type: "doc",
    content: sections.flatMap((section) => {
      const blocks = [];
      if (section.eyebrow) {
        blocks.push({ type: "paragraph", content: [{ type: "text", text: section.eyebrow }] });
      }
      if (section.headline) {
        blocks.push({
          type: "heading",
          attrs: { level: section.type === "hero" ? 1 : 2 },
          content: [{ type: "text", text: section.headline }],
        });
      }
      if (section.productName) {
        blocks.push({ type: "paragraph", content: [{ type: "text", text: section.productName }] });
      }
      if (section.body) {
        blocks.push({ type: "paragraph", content: [{ type: "text", text: section.body }] });
      }
      if (section.quote) {
        blocks.push({ type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: section.quote }] }] });
      }
      if (section.buttonLabel) {
        blocks.push({
          type: "button",
          attrs: {
            href: section.buttonUrl ?? brandProfile?.websiteUrl ?? "https://example.com",
            alignment: "left",
          },
          content: [{ type: "text", text: section.buttonLabel }],
        });
      }
      return blocks;
    }),
  };

  return brandProfile ? ensureBrandStructure(document, brandProfile) : document;
}

export function createBlankProject(title?: string): EmailProject {
  const brandProfile = createDefaultBrandProfile();
  const sections: EmailSection[] = [
    {
      id: "hero",
      type: "hero",
      eyebrow: "",
      headline: "Your headline here",
      body: "Write something compelling for your audience.",
      buttonLabel: "Call to action",
      buttonUrl: "https://example.com",
    },
    {
      id: "footer",
      type: "footer",
      body: "You are receiving this because you signed up for updates.",
    },
  ];
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    title: title ?? "Untitled Email",
    templateId: "blank",
    subject: "",
    previewText: "",
    editorDocument: createEditorDocumentFromSections(sections, brandProfile),
    sections,
    renderedHtml: null,
    renderedText: null,
    version: 1,
    brandProfile,
    createdAt: now,
    updatedAt: now,
  };
}

export function createProjectFromTemplate(templateId: string, title?: string): EmailProject {
  const template =
    emailTemplates.find((item) => item.id === templateId) ?? emailTemplates[0];
  const brandProfile = createDefaultBrandProfile();
  const now = new Date().toISOString();
  const editorDocument = template.editorDocument
    ? structuredClone(template.editorDocument)
    : createEditorDocumentFromSections(template.sections, brandProfile);

  return {
    id: crypto.randomUUID(),
    title: title ?? template.name,
    templateId: template.id,
    subject: template.subject,
    previewText: template.previewText,
    editorDocument: template.preserveSourceLayout
      ? editorDocument
      : ensureBrandStructure(editorDocument, brandProfile),
    sections: structuredClone(template.sections),
    renderedHtml: null,
    renderedText: null,
    version: 1,
    brandProfile,
    createdAt: now,
    updatedAt: now,
  };
}
