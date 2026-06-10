"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FileText, FolderOpen, LayoutTemplate, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { EmailProject } from "@/lib/schemas";

export function ProjectDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<EmailProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingBlank, setCreatingBlank] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data: { projects?: EmailProject[] }) => {
        if (!ignore) {
          setProjects(data.projects ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setProjects([]);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function createBlank() {
    setCreatingBlank(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await response.json()) as { project?: EmailProject };
      if (data.project) {
        router.push(`/builder/${data.project.id}`);
      }
    } finally {
      setCreatingBlank(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent projects</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={creatingBlank} onClick={createBlank}>
            <FileText data-icon="inline-start" />
            {creatingBlank ? "Creating..." : "Blank email"}
          </Button>
          <Link href="/templates">
            <Button size="sm">
              <LayoutTemplate data-icon="inline-start" />
              From template
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No projects yet. Create a blank email or pick a template.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/builder/${project.id}`} className="block">
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader className="flex-row items-center gap-3 py-4">
                  <FolderOpen className="size-5 text-muted-foreground" />
                  <div className="flex-1">
                    <CardTitle className="text-sm">{project.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {project.subject || "No subject"} &middot; v{project.version}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
