import { Badge } from "@/components/badge";
import type { AppData } from "@/lib/data";

export function IntelligenceRail({ data }: { data: AppData }) {
  return (
    <aside className="rail">
      <div className="rail-card">
        <h3>Data Source</h3>
        <p>
          {data.source === "supabase"
            ? data.diagnostic ?? `Connected to Supabase workspace: ${data.currentWorkspace?.name ?? "Workspace"}.`
            : "Using local mock data because Supabase is not required in this environment."}
        </p>
      </div>
      <div className="rail-card">
        <h3>Portal Access</h3>
        <p>
          {data.workspaces.length} workspace{data.workspaces.length === 1 ? "" : "s"} available. Role:{" "}
          {data.currentWorkspace?.role ?? "owner"}.
        </p>
      </div>
      <div className="rail-card">
        <h3>Suggested Next Move</h3>
        <p>
          Approve the Amelia Hart outreach draft after tightening the infrastructure mandate into a one-page ask.
        </p>
      </div>
      <div className="rail-card">
        <h3>Review Queue</h3>
        <div className="stack">
          {data.reviewTasks.map((task) => (
            <div className={task.isMockData ? "mock-record mock-rail-record" : undefined} key={task.id}>
              <div className="person-name">{task.title}</div>
              <p>{task.detail}</p>
              <div className="badge-row" style={{ marginTop: 8 }}>
                <Badge tone={task.status === "stale" ? "amber" : task.status === "sensitive" ? "red" : "blue"}>
                  {task.status.replace("_", " ")}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rail-card">
        <h3>Non-Negotiables</h3>
        <p>
          Preserve source artifacts, keep historical roles intact, show confidence, and require approval before merge
          or outreach.
        </p>
      </div>
    </aside>
  );
}
