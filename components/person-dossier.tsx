import { Badge } from "@/components/badge";
import { confidenceLabel } from "@/lib/format";
import type { Interaction, Person, Role } from "@/types/domain";

export function PersonDossier({
  people,
  roles,
  interactions
}: {
  people: Person[];
  roles: Role[];
  interactions: Interaction[];
}) {
  const person = people[0];
  if (!person) {
    return null;
  }

  const personRoles = roles.filter((role) => role.personId === person.id);
  const personInteractions = interactions.filter((interaction) => interaction.personId === person.id);

  return (
    <section className="panel" id="People">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Person Dossier</h2>
          <div className="section-kicker">Current status layered over preserved relationship history.</div>
        </div>
        <div className="badge-row">
          <Badge tone="green">Direct</Badge>
          <Badge tone="blue">5/5 strength</Badge>
          <Badge tone="purple">3 mandate matches</Badge>
        </div>
      </div>

      <div className="tabs" aria-label="Dossier tabs">
        {["Overview", "Timeline", "Roles", "Relationships", "Cards", "Sources"].map((tab, index) => (
          <button className={`tab ${index === 0 ? "active" : ""}`} key={tab} type="button">
            {tab}
          </button>
        ))}
      </div>

      <div className="panel-body">
        <div className="dossier">
          <aside className="identity-card">
            <div className="avatar">AH</div>
            <div className="identity-name">{person.displayName}</div>
            <div className="muted">{person.currentTitle}</div>
            <div className="muted">{person.currentOrganization}</div>

            <div className="field-list">
              <div>
                <div className="field-label">Primary Geography</div>
                <div className="field-value">{person.geography}</div>
              </div>
              <div>
                <div className="field-label">Sectors</div>
                <div className="field-value">{person.sectorTags.join(", ")}</div>
              </div>
              <div>
                <div className="field-label">Source Count</div>
                <div className="field-value">{person.sourceCount} sources</div>
              </div>
              <div>
                <div className="field-label">Private Note</div>
                <div className="field-value">{person.notes}</div>
              </div>
            </div>
          </aside>

          <div className="stack">
            <div>
              <h3 className="panel-title">Operator Summary</h3>
              <p className="section-kicker">
                Amelia is a direct infrastructure-capital relationship with government trade history and current fund
                authority. Best ask is specific, mandate-tied, and framed as a narrow counterparties review.
              </p>
            </div>

            <div>
              <h3 className="panel-title">Role History</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Organization</th>
                    <th>Period</th>
                    <th>Source</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {personRoles.map((role) => (
                    <tr key={role.id}>
                      <td>
                        <span className="person-name">{role.title}</span>
                        <div className="muted">{role.isCurrent ? "Current layer" : "Historical evidence"}</div>
                      </td>
                      <td>{role.organizationName}</td>
                      <td>
                        {role.startDate}
                        {role.endDate ? `-${role.endDate}` : "-present"}
                      </td>
                      <td>{role.sourceLabel}</td>
                      <td>
                        <Badge tone={role.confidence > 0.85 ? "green" : "amber"}>{confidenceLabel(role.confidence)}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="panel-title">Timeline</h3>
              <div className="timeline">
                {personInteractions.map((interaction) => (
                  <div className="timeline-item" key={interaction.id}>
                    <div className="timeline-date">{interaction.date}</div>
                    <div>
                      <div className="person-name">{interaction.summary}</div>
                      <div className="badge-row" style={{ marginTop: 8 }}>
                        <Badge tone="blue">{interaction.sourceLabel}</Badge>
                        <Badge tone="green">{confidenceLabel(interaction.confidence)}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
