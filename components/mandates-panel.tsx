import { Badge } from "@/components/badge";
import { formatStatus } from "@/lib/format";
import { mandates } from "@/lib/mock-data";

export function MandatesPanel() {
  return (
    <section className="panel" id="Mandates">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Mandates</h2>
          <div className="section-kicker">Deal objectives ranked by relationship access and next action.</div>
        </div>
      </div>
      <div className="panel-body" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Mandate</th>
              <th>Client</th>
              <th>Sector</th>
              <th>Status</th>
              <th>Relevant Contacts</th>
              <th>Next Action</th>
            </tr>
          </thead>
          <tbody>
            {mandates.map((mandate) => (
              <tr key={mandate.id}>
                <td>
                  <span className="person-name">{mandate.title}</span>
                  <div className="muted">{mandate.objective}</div>
                </td>
                <td>{mandate.clientName}</td>
                <td>{mandate.sector}</td>
                <td>
                  <Badge tone={mandate.status === "active" ? "green" : mandate.status === "researching" ? "amber" : "blue"}>
                    {formatStatus(mandate.status)}
                  </Badge>
                </td>
                <td>
                  <Badge tone="purple">{mandate.relevantContacts}</Badge>
                </td>
                <td>{mandate.nextAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
