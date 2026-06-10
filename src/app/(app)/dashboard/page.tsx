import { ProjectDashboard } from "@/components/project-dashboard";

export default function HomePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-xs font-extrabold uppercase text-muted-foreground">
          MVP workspace
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          Agentic ecommerce email builder
        </h1>
      </div>
      <ProjectDashboard />
    </div>
  );
}
