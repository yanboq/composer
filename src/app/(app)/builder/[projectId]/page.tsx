import { notFound } from "next/navigation";
import { BuilderWorkspace } from "@/components/builder-workspace";
import { SidebarCollapse } from "@/components/sidebar-collapse";
import { getCurrentUserId } from "@/server/auth";
import { getProjectForUser, loadChatMessages } from "@/server/project-store";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function BuilderPage({ params }: PageProps) {
  const userId = await getCurrentUserId();
  const { projectId } = await params;
  const project = await getProjectForUser(userId, projectId);

  if (!project) {
    notFound();
  }

  const chatHistory = await loadChatMessages(projectId);

  return (
    <>
      <SidebarCollapse />
      <BuilderWorkspace
        initialProject={project}
        initialChatMessages={chatHistory}
      />
    </>
  );
}
