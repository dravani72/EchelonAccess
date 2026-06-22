import { Badge } from "@/components/badge";
import { formatStatus } from "@/lib/format";
import type { OutreachItem } from "@/types/domain";

export function OutreachQueue({ outreachQueue }: { outreachQueue: OutreachItem[] }) {
  return (
    <section className="panel" id="Outreach Queue">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Outreach Queue</h2>
          <div className="section-kicker">No sensitive message is sent without user approval.</div>
        </div>
      </div>
      <div className="panel-body" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Person</th>
              <th>Mandate</th>
              <th>Reason</th>
              <th>Risk</th>
              <th>Due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {outreachQueue.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className="person-name">{item.personName}</span>
                  <div className="muted">{item.channel.replace("_", " ")}</div>
                </td>
                <td>{item.mandateTitle}</td>
                <td>{item.reason}</td>
                <td>
                  <Badge tone={item.riskLevel === "low" ? "green" : item.riskLevel === "medium" ? "amber" : "red"}>
                    {formatStatus(item.riskLevel)}
                  </Badge>
                </td>
                <td>{item.dueDate}</td>
                <td>
                  <Badge tone={item.status === "draft_ready" ? "green" : "amber"}>{formatStatus(item.status)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
