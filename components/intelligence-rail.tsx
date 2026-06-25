import { Badge } from "@/components/badge";
import { withBasePath } from "@/lib/base-path";
import type { AppData } from "@/lib/data";
import { ArrowRight, DatabaseZap, FileCheck2, GitBranch, ShieldCheck, UsersRound } from "lucide-react";

const railStyles = `
  .rail-card-source {
    border-color: rgba(102, 209, 158, 0.34);
    background: rgba(102, 209, 158, 0.07);
  }

  .rail-card-source.attention {
    border-color: rgba(240, 189, 98, 0.4);
    background: rgba(240, 189, 98, 0.07);
  }

  .rail-card-access {
    border-style: dashed;
  }

  .rail-card-next {
    border-color: rgba(185, 149, 255, 0.36);
    background: rgba(185, 149, 255, 0.07);
  }

  .rail-card-review {
    background: rgba(255, 255, 255, 0.025);
  }

  .rail-card-policy {
    border-color: rgba(150, 163, 181, 0.28);
    background: rgba(255, 255, 255, 0.02);
  }

  .rail-card-header {
    display: flex;
    align-items: center;
    gap: 9px;
    color: var(--text);
  }

  .rail-card-header h3 {
    margin: 0;
  }

  .rail-stat {
    margin-top: 12px;
    font-size: 30px;
    font-weight: 800;
  }

  .rail-link {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-top: 12px;
    color: var(--blue);
    font-size: 13px;
    font-weight: 700;
  }

  .rail-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 13px;
  }

  .rail-action {
    display: grid;
    min-height: 36px;
    place-items: center;
    border: 1px solid rgba(185, 149, 255, 0.34);
    border-radius: 8px;
    color: var(--text);
    background: rgba(255, 255, 255, 0.04);
    font-size: 12px;
    font-weight: 700;
  }

  .rail-action.primary {
    border-color: rgba(105, 167, 255, 0.42);
    background: rgba(105, 167, 255, 0.12);
  }

  .rail-review-summary,
  .rail-task-list {
    display: grid;
    gap: 10px;
    margin-top: 12px;
  }

  .rail-review-summary {
    grid-template-columns: 1fr 1fr;
  }

  .rail-checklist {
    display: grid;
    gap: 8px;
    margin: 12px 0 0;
    padding-left: 18px;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.45;
  }
`;

export function IntelligenceRail({ data }: { data: AppData }) {
  const staleTasks = data.reviewTasks.filter((task) => task.status === "stale").length;
  const sensitiveTasks = data.reviewTasks.filter((task) => task.status === "sensitive").length;

  return (
    <aside className="rail">
      <style>{railStyles}</style>
      <div className={`rail-card rail-card-source ${data.source === "supabase" ? "active" : "attention"}`}>
        <div className="rail-card-header">
          <DatabaseZap size={17} />
          <h3>Data Source</h3>
        </div>
        <p>{data.source === "supabase" ? data.diagnostic ?? `Connected: ${data.currentWorkspace?.name ?? "Workspace"}.` : "Supabase unavailable."}</p>
        <a className="rail-link" href="#graph">
          Open desk <ArrowRight size={14} />
        </a>
      </div>

      <div className="rail-card rail-card-access">
        <div className="rail-card-header">
          <UsersRound size={17} />
          <h3>Portal Access</h3>
        </div>
        <div className="rail-stat">{data.workspaces.length}</div>
        <p>
          {data.workspaces.length === 1 ? "workspace" : "workspaces"} available. Role: {data.currentWorkspace?.role ?? "owner"}.
        </p>
      </div>

      <div className="rail-card rail-card-next">
        <div className="rail-card-header">
          <GitBranch size={17} />
          <h3>Next Capture</h3>
        </div>
        <div className="rail-actions">
          <a className="rail-action primary" href={withBasePath("/relationships/new")}>
            Relationship
          </a>
          <a className="rail-action" href={withBasePath("/mandates/new")}>
            Mandate
          </a>
        </div>
      </div>

      <div className="rail-card rail-card-review">
        <div className="rail-card-header">
          <FileCheck2 size={17} />
          <h3>Review Queue</h3>
        </div>
        <div className="rail-review-summary">
          <Badge tone={staleTasks ? "amber" : "blue"}>{staleTasks} stale</Badge>
          <Badge tone={sensitiveTasks ? "red" : "green"}>{sensitiveTasks} sensitive</Badge>
        </div>
        <div className="rail-task-list">
          {data.reviewTasks.slice(0, 3).map((task) => (
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
          {!data.reviewTasks.length ? <div className="empty-state">No review tasks.</div> : null}
        </div>
        <a className="rail-link" href="#outreach">
          Review outreach <ArrowRight size={14} />
        </a>
      </div>

      <div className="rail-card rail-card-policy">
        <div className="rail-card-header">
          <ShieldCheck size={17} />
          <h3>Guardrails</h3>
        </div>
        <ul className="rail-checklist">
          <li>Preserve source artifacts</li>
          <li>Keep historical roles intact</li>
          <li>Require approval before outreach</li>
        </ul>
      </div>
    </aside>
  );
}
