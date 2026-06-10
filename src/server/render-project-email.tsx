import * as React from "react";
import { render, toPlainText } from "@react-email/render";
import { getTemplateRawSourceUrl, getTemplateSourceUrl } from "@/lib/templates";
import type { EmailProject, EmailSection } from "@/lib/schemas";

function shellStyle(project: EmailProject): React.CSSProperties {
  return {
    margin: 0,
    background: "#f3f4f6",
    fontFamily: `${project.brandProfile.fontPreset}, Arial, sans-serif`,
    color: "#111827",
  };
}

function Section({ project, section }: { project: EmailProject; section: EmailSection }) {
  const button =
    section.buttonLabel && section.buttonUrl ? (
      <a
        href={section.buttonUrl}
        style={{
          display: "inline-block",
          background: project.brandProfile.primaryColor,
          color: "#ffffff",
          padding: "13px 18px",
          borderRadius: 6,
          textDecoration: "none",
          fontWeight: 700,
          marginTop: 16,
        }}
      >
        {section.buttonLabel}
      </a>
    ) : null;

  if (section.type === "footer") {
    return (
      <tr data-section-id={section.id}>
        <td style={{ padding: "24px 32px", color: "#6b7280", fontSize: 12, lineHeight: 1.6 }}>
          {section.body ?? project.brandProfile.defaultFooter}
        </td>
      </tr>
    );
  }

  if (section.type === "testimonial") {
    return (
      <tr data-section-id={section.id}>
        <td style={{ padding: "26px 32px", background: "#f9fafb" }}>
          <p style={{ margin: 0, fontSize: 20, lineHeight: 1.5, color: project.brandProfile.accentColor }}>
            "{section.quote ?? "A concise customer proof point belongs here."}"
          </p>
          <p style={{ margin: "14px 0 0", color: "#6b7280" }}>{section.attribution ?? "Happy customer"}</p>
        </td>
      </tr>
    );
  }

  return (
    <tr data-section-id={section.id}>
      <td
        style={{
          padding: section.type === "hero" ? "42px 32px" : "28px 32px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {section.eyebrow ? (
          <p
            style={{
              margin: "0 0 10px",
              color: project.brandProfile.primaryColor,
              fontSize: 13,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 0,
            }}
          >
            {section.eyebrow}
          </p>
        ) : null}
        {section.productName ? (
          <p style={{ margin: "0 0 6px", color: "#6b7280", fontSize: 14 }}>{section.productName}</p>
        ) : null}
        {section.headline ? (
          <h1
            style={{
              margin: 0,
              fontSize: section.type === "hero" ? 34 : 24,
              lineHeight: 1.12,
              color: project.brandProfile.accentColor,
            }}
          >
            {section.headline}
          </h1>
        ) : null}
        {section.price ? (
          <p style={{ margin: "10px 0 0", fontWeight: 800, fontSize: 18 }}>{section.price}</p>
        ) : null}
        {section.body ? (
          <p style={{ margin: "14px 0 0", color: "#4b5563", lineHeight: 1.6, fontSize: 16 }}>{section.body}</p>
        ) : null}
        {button}
      </td>
    </tr>
  );
}

export function ProjectEmail({ project }: { project: EmailProject }) {
  return (
    <html>
      <body style={shellStyle(project)}>
        <div style={{ display: "none", overflow: "hidden", lineHeight: "1px", opacity: 0 }}>
          {project.previewText}
        </div>
        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ background: "#f3f4f6" }}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: "28px 12px" }}>
                <table
                  role="presentation"
                  width="100%"
                  cellPadding="0"
                  cellSpacing="0"
                  style={{ maxWidth: 620, background: "#ffffff", borderRadius: 8, overflow: "hidden" }}
                >
                  <tbody>
                    {project.sections.map((section) => (
                      <Section key={section.id} project={project} section={section} />
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

export async function renderProjectToHtml(project: EmailProject) {
  return render(<ProjectEmail project={project} />, { pretty: true });
}

export async function renderProjectToText(project: EmailProject) {
  const html = await renderProjectToHtml(project);
  return toPlainText(html);
}

export async function createProjectEmailSource(project: EmailProject) {
  const rawSourceUrl = getTemplateRawSourceUrl(project.templateId);

  if (rawSourceUrl) {
    try {
      const response = await fetch(rawSourceUrl, { next: { revalidate: 86400 } });
      if (response.ok) return response.text();
    } catch {
      // Fall back to the local project source export when the upstream source is unavailable.
    }
  }

  const sourceUrl = getTemplateSourceUrl(project.templateId);
  const sourceComment = sourceUrl
    ? `// Based on the React Email Barebones source: ${sourceUrl}\n`
    : "";

  return `${sourceComment}import { ProjectEmail } from "@/server/render-project-email";

export default function Email() {
  const project = ${JSON.stringify(project, null, 2)};
  return <ProjectEmail project={project} />;
}
`;
}
