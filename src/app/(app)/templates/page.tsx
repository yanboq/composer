"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { emailTemplates } from "@/lib/templates";
import type { EmailProject } from "@/lib/schemas";

export default function TemplatesPage() {
  const router = useRouter();
  const [creating, setCreating] = useState<string | null>(null);

  async function createProject(templateId?: string) {
    const key = templateId ?? "blank";
    setCreating(key);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateId ? { templateId } : {}),
      });
      const data = (await response.json()) as { project?: EmailProject };
      if (data.project) {
        router.push(`/builder/${data.project.id}`);
      }
    } finally {
      setCreating(null);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
        <p className="text-sm text-muted-foreground">
          Choose a template to start a new email project, or start from scratch.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="size-4" />
              <span className="text-xs font-medium uppercase">Blank</span>
            </div>
            <CardTitle className="text-lg">Blank Email</CardTitle>
            <CardDescription>
              Start with a minimal hero and footer. Build your email from scratch.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">2 sections &middot; No preset content</p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              disabled={creating !== null}
              onClick={() => createProject()}
            >
              {creating === "blank" ? "Creating..." : "Start blank"}
            </Button>
          </CardFooter>
        </Card>

        {emailTemplates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-center gap-2 text-muted-foreground">
                <LayoutTemplate className="size-4" />
                <span className="text-xs font-medium uppercase">
                  {template.campaignType}
                </span>
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {template.sections.length} sections &middot; {template.subject}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                disabled={creating !== null}
                onClick={() => createProject(template.id)}
              >
                {creating === template.id ? "Creating..." : "Use template"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
